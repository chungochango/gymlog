import { uid, parseNum } from '../lib/format'

export const newSet = (from) => ({
  id: uid(),
  weight: from?.weight ?? '',
  reps: from?.reps ?? '',
  done: false,
})

export const newEntry = (exerciseId, restSeconds) => ({
  id: uid(),
  exerciseId,
  restSeconds,
  sets: [newSet()],
})

/** Applies `fn` to the active workout, keeping state untouched if there is none. */
function withActive(state, fn) {
  if (!state.active) return state
  return { ...state, active: fn(state.active) }
}

function withEntry(state, entryId, fn) {
  return withActive(state, (w) => ({
    ...w,
    exercises: w.exercises.map((e) => (e.id === entryId ? fn(e) : e)),
  }))
}

/** Keeps only completed sets, converts typed text to numbers and drops empty exercises. */
export function finalizeWorkout(active) {
  const exercises = active.exercises
    .map((e) => ({
      ...e,
      sets: e.sets
        .filter((s) => s.done)
        .map((s) => ({ ...s, weight: parseNum(s.weight) ?? 0, reps: parseNum(s.reps) ?? 0 })),
    }))
    .filter((e) => e.sets.length > 0)
  return { ...active, exercises, endedAt: Date.now() }
}

export function reducer(state, action) {
  switch (action.type) {
    // Exercise library
    case 'exercise/add':
      return { ...state, exercises: [...state.exercises, action.exercise] }
    case 'exercise/remove':
      return {
        ...state,
        exercises: state.exercises.filter((e) => e.id !== action.id),
        routines: state.routines.map((r) => ({
          ...r,
          exerciseIds: r.exerciseIds.filter((id) => id !== action.id),
        })),
      }

    // Routines
    case 'routine/add':
      return { ...state, routines: [...state.routines, action.routine] }
    case 'routine/remove':
      return { ...state, routines: state.routines.filter((r) => r.id !== action.id) }

    // Workout lifecycle
    case 'workout/start':
      return { ...state, active: action.workout, rest: null }
    case 'workout/discard':
      return { ...state, active: null, rest: null }
    case 'workout/finish': {
      if (!state.active) return state
      const done = finalizeWorkout(state.active)
      const workouts = done.exercises.length ? [done, ...state.workouts] : state.workouts
      return { ...state, workouts, active: null, rest: null }
    }
    case 'workout/update':
      return {
        ...state,
        workouts: state.workouts.map((w) => (w.id === action.id ? { ...w, ...action.patch } : w)),
      }
    case 'workout/delete':
      return { ...state, workouts: state.workouts.filter((w) => w.id !== action.id) }

    // Active session editing
    case 'active/rename':
      return withActive(state, (w) => ({ ...w, name: action.name }))
    case 'active/addExercises':
      return withActive(state, (w) => ({
        ...w,
        exercises: [
          ...w.exercises,
          ...action.exerciseIds.map((id) => newEntry(id, state.settings.restSeconds)),
        ],
      }))
    case 'active/removeExercise':
      return withActive(state, (w) => ({
        ...w,
        exercises: w.exercises.filter((e) => e.id !== action.entryId),
      }))
    case 'active/setRest':
      return withEntry(state, action.entryId, (e) => ({ ...e, restSeconds: action.seconds }))
    case 'active/addSet':
      return withEntry(state, action.entryId, (e) => ({
        ...e,
        sets: [...e.sets, newSet(e.sets[e.sets.length - 1])],
      }))
    case 'active/updateSet':
      return withEntry(state, action.entryId, (e) => ({
        ...e,
        sets: e.sets.map((s) => (s.id === action.setId ? { ...s, ...action.patch } : s)),
      }))
    case 'active/removeSet':
      return withEntry(state, action.entryId, (e) => ({
        ...e,
        sets: e.sets.filter((s) => s.id !== action.setId),
      }))

    // Rest timer (stored as an absolute end time so it survives navigation and reloads)
    case 'rest/start':
      return { ...state, rest: { endsAt: Date.now() + action.seconds * 1000, duration: action.seconds } }
    case 'rest/adjust':
      if (!state.rest) return state
      return {
        ...state,
        rest: {
          endsAt: state.rest.endsAt + action.delta * 1000,
          duration: Math.max(1, state.rest.duration + action.delta),
        },
      }
    case 'rest/stop':
      return { ...state, rest: null }

    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.patch } }

    // Cardio and sports (newest first, like workouts)
    case 'cardio/save': {
      const others = state.cardio.filter((c) => c.id !== action.entry.id)
      return { ...state, cardio: [...others, action.entry].sort((a, b) => b.startedAt - a.startedAt) }
    }
    case 'cardio/remove':
      return { ...state, cardio: state.cardio.filter((c) => c.id !== action.id) }

    // Food log
    case 'food/save': {
      const exists = state.foods.some((f) => f.id === action.entry.id)
      return {
        ...state,
        foods: exists
          ? state.foods.map((f) => (f.id === action.entry.id ? action.entry : f))
          : [...state.foods, action.entry],
      }
    }
    case 'food/remove':
      return { ...state, foods: state.foods.filter((f) => f.id !== action.id) }

    // Body weight log: one entry per day, newest first
    case 'bodyWeight/save': {
      const others = state.bodyWeights.filter((b) => b.day !== action.entry.day)
      const bodyWeights = [...others, action.entry].sort((a, b) => b.day.localeCompare(a.day))
      // The latest weigh-in also feeds calorie estimates.
      const latest = bodyWeights[0]
      return { ...state, bodyWeights, settings: { ...state.settings, bodyWeight: latest.kg } }
    }
    case 'bodyWeight/remove':
      return { ...state, bodyWeights: state.bodyWeights.filter((b) => b.id !== action.id) }

    // Saved meals: reusable groups of foods
    case 'savedMeal/save':
      return { ...state, savedMeals: [...state.savedMeals.filter((m) => m.id !== action.meal.id), action.meal] }
    case 'savedMeal/remove':
      return { ...state, savedMeals: state.savedMeals.filter((m) => m.id !== action.id) }

    // Backup restore replaces every persisted slice at once.
    case 'data/import':
      return { ...state, ...action.data, rest: null }

    default:
      return state
  }
}
