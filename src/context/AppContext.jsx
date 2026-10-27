import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { DEFAULT_EXERCISES, DEFAULT_ROUTINES, DEFAULT_SETTINGS } from '../data/defaults'
import { load, save } from '../lib/storage'
import { uid } from '../lib/format'
import { reducer, newEntry } from './store'

const AppContext = createContext(null)

// Built-in exercises always take the current name, so renames reach existing installs.
const DEFAULT_NAMES = new Map(DEFAULT_EXERCISES.map((e) => [e.id, e.name]))
const withCurrentNames = (exercises) =>
  exercises.map((e) => (!e.custom && DEFAULT_NAMES.has(e.id) ? { ...e, name: DEFAULT_NAMES.get(e.id) } : e))

function init() {
  return {
    exercises: withCurrentNames(load('exercises', DEFAULT_EXERCISES)),
    routines: load('routines', DEFAULT_ROUTINES),
    workouts: load('workouts', []),
    active: load('active', null),
    rest: load('rest', null),
    settings: { ...DEFAULT_SETTINGS, ...load('settings', {}) },
    cardio: load('cardio', []),
    foods: load('foods', []),
    bodyWeights: load('bodyWeights', []),
    savedMeals: load('savedMeals', []),
  }
}

// Slices included in a backup file, in the same shape they are persisted.
export const BACKUP_KEYS = ['exercises', 'routines', 'workouts', 'active', 'settings', 'cardio', 'foods', 'bodyWeights', 'savedMeals']

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  // Persist each slice independently so a large history isn't rewritten on every keystroke.
  useEffect(() => save('exercises', state.exercises), [state.exercises])
  useEffect(() => save('routines', state.routines), [state.routines])
  useEffect(() => save('workouts', state.workouts), [state.workouts])
  useEffect(() => save('active', state.active), [state.active])
  useEffect(() => save('rest', state.rest), [state.rest])
  useEffect(() => save('settings', state.settings), [state.settings])
  useEffect(() => save('cardio', state.cardio), [state.cardio])
  useEffect(() => save('foods', state.foods), [state.foods])
  useEffect(() => save('bodyWeights', state.bodyWeights), [state.bodyWeights])
  useEffect(() => save('savedMeals', state.savedMeals), [state.savedMeals])

  const value = useMemo(() => {
    const exerciseById = new Map(state.exercises.map((e) => [e.id, e]))

    const actions = {
      startWorkout({ name = 'Entrenamiento libre', exerciseIds = [], routineId = null } = {}) {
        dispatch({
          type: 'workout/start',
          workout: {
            id: uid(),
            name,
            routineId,
            startedAt: Date.now(),
            exercises: exerciseIds
              .filter((id) => exerciseById.has(id))
              .map((id) => newEntry(id, state.settings.restSeconds)),
          },
        })
      },
      finishWorkout: () => dispatch({ type: 'workout/finish' }),
      discardWorkout: () => dispatch({ type: 'workout/discard' }),
      deleteWorkout: (id) => dispatch({ type: 'workout/delete', id }),
      updateWorkout: (id, patch) => dispatch({ type: 'workout/update', id, patch }),

      renameActive: (name) => dispatch({ type: 'active/rename', name }),
      addExercises: (exerciseIds) => dispatch({ type: 'active/addExercises', exerciseIds }),
      removeEntry: (entryId) => dispatch({ type: 'active/removeExercise', entryId }),
      setEntryRest: (entryId, seconds) => dispatch({ type: 'active/setRest', entryId, seconds }),
      addSet: (entryId) => dispatch({ type: 'active/addSet', entryId }),
      updateSet: (entryId, setId, patch) => dispatch({ type: 'active/updateSet', entryId, setId, patch }),
      removeSet: (entryId, setId) => dispatch({ type: 'active/removeSet', entryId, setId }),

      startRest: (seconds) => dispatch({ type: 'rest/start', seconds }),
      adjustRest: (delta) => dispatch({ type: 'rest/adjust', delta }),
      stopRest: () => dispatch({ type: 'rest/stop' }),

      addExercise({ name, muscle }) {
        const exercise = { id: `ex-custom-${uid()}`, name: name.trim(), muscle, custom: true }
        dispatch({ type: 'exercise/add', exercise })
        return exercise
      },
      removeLibraryExercise: (id) => dispatch({ type: 'exercise/remove', id }),
      addRoutine: ({ name, exerciseIds }) =>
        dispatch({ type: 'routine/add', routine: { id: `rt-${uid()}`, name: name.trim(), exerciseIds } }),
      removeRoutine: (id) => dispatch({ type: 'routine/remove', id }),

      updateSettings: (patch) => dispatch({ type: 'settings/update', patch }),

      saveCardio: (entry) => dispatch({ type: 'cardio/save', entry: { id: uid(), ...entry } }),
      removeCardio: (id) => dispatch({ type: 'cardio/remove', id }),
      saveFood: (entry) => dispatch({ type: 'food/save', entry: { id: uid(), createdAt: Date.now(), ...entry } }),
      removeFood: (id) => dispatch({ type: 'food/remove', id }),

      logBodyWeight: (kg, day) => dispatch({ type: 'bodyWeight/save', entry: { id: uid(), day, kg } }),
      removeBodyWeight: (id) => dispatch({ type: 'bodyWeight/remove', id }),
      saveMeal: ({ name, items }) =>
        dispatch({
          type: 'savedMeal/save',
          meal: {
            id: uid(),
            name: name.trim(),
            items: items.map(({ name: n, kcal, protein, carbs, fat }) => ({ name: n, kcal, protein, carbs, fat })),
          },
        }),
      removeSavedMeal: (id) => dispatch({ type: 'savedMeal/remove', id }),

      exportData: () => ({
        app: 'gymlog',
        version: 1,
        exportedAt: new Date().toISOString(),
        data: Object.fromEntries(BACKUP_KEYS.map((k) => [k, state[k]])),
      }),
      /** Throws if the file isn't a GymLog backup. */
      importData(backup) {
        if (backup?.app !== 'gymlog' || typeof backup.data !== 'object') {
          throw new Error('El archivo no es una copia de GymLog.')
        }
        const data = Object.fromEntries(BACKUP_KEYS.filter((k) => k in backup.data).map((k) => [k, backup.data[k]]))
        if (data.settings) data.settings = { ...DEFAULT_SETTINGS, ...data.settings }
        if (Array.isArray(data.exercises)) data.exercises = withCurrentNames(data.exercises)
        dispatch({ type: 'data/import', data })
      },
    }

    return { state, actions, exerciseById }
  }, [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
