import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Dumbbell, Flag, Plus, Timer, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNow } from '../hooks/useNow'
import { formatClock, formatVolume, plural } from '../lib/format'
import { lastPerformance, workoutSetCount, workoutVolume } from '../lib/stats'
import ExerciseCard from '../components/ExerciseCard'
import ExercisePicker from '../components/ExercisePicker'
import Modal from '../components/Modal'
import { Button, EmptyState } from '../components/ui'

export default function Workout() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const now = useNow()
  const [picking, setPicking] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  // Set while leaving on purpose, so the "no active session" redirect doesn't race our navigate().
  const leaving = useRef(false)

  const workout = state.active
  if (!workout) return leaving.current ? null : <Navigate to="/start" replace />

  const doneSets = workoutSetCount(workout)
  const pendingSets = workout.exercises.reduce((n, e) => n + e.sets.filter((s) => !s.done).length, 0)

  const finish = () => {
    const id = workout.id
    leaving.current = true
    actions.finishWorkout()
    navigate(doneSets ? `/history/${id}` : '/', { replace: true })
  }

  const discard = () => {
    if (confirm('¿Descartar este entrenamiento? Se perderán todas las series.')) {
      leaving.current = true
      actions.discardWorkout()
      navigate('/', { replace: true })
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 border-b border-line bg-bg/85 px-4 pt-safe backdrop-blur-xl">
        <div className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <input
              aria-label="Nombre del entrenamiento"
              value={workout.name}
              onChange={(e) => actions.renameActive(e.target.value)}
              onBlur={(e) => !e.target.value.trim() && actions.renameActive('Entrenamiento')}
              className="w-full truncate bg-transparent text-lg font-bold tracking-tight outline-none focus:text-accent"
            />
            <div className="flex items-center gap-3 text-sm text-muted tabular">
              <span className="flex items-center gap-1 font-semibold text-accent">
                <Timer size={14} />
                {formatClock(now - workout.startedAt)}
              </span>
              <span>{formatVolume(workoutVolume(workout))}</span>
              <span>{plural(doneSets, 'serie')}</span>
            </div>
          </div>
          <Button variant="primary" onClick={() => setConfirmFinish(true)}>
            <Flag size={16} /> Finalizar
          </Button>
        </div>
      </header>

      <div className="mt-4 space-y-3">
        {workout.exercises.map((entry) => (
          <ExerciseCard key={entry.id} entry={entry} previous={lastPerformance(state.workouts, entry.exerciseId)} />
        ))}
      </div>

      {workout.exercises.length === 0 && (
        <EmptyState icon={Dumbbell} title="Sesión vacía">
          Añade el primer ejercicio para empezar a registrar series.
        </EmptyState>
      )}

      <Button variant="secondary" size="lg" className="mt-4 w-full border-dashed" onClick={() => setPicking(true)}>
        <Plus size={20} /> Añadir ejercicio
      </Button>

      <Button variant="danger" className="mt-3 w-full" onClick={discard}>
        <Trash2 size={16} /> Descartar entrenamiento
      </Button>

      <ExercisePicker
        open={picking}
        onClose={() => setPicking(false)}
        onConfirm={actions.addExercises}
        exclude={workout.exercises.map((e) => e.exerciseId)}
      />

      <Modal
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title={doneSets ? '¿Finalizar entrenamiento?' : 'No hay series completadas'}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button size="lg" onClick={() => setConfirmFinish(false)}>Seguir</Button>
            <Button variant={doneSets ? 'primary' : 'danger'} size="lg" onClick={finish}>
              {doneSets ? 'Guardar' : 'Salir sin guardar'}
            </Button>
          </div>
        }
      >
        <p className="text-muted">
          {doneSets
            ? `Se ${doneSets === 1 ? 'guardará 1 serie completada' : `guardarán ${doneSets} series completadas`} en ${formatClock(now - workout.startedAt)}.`
            : 'Marca al menos una serie como completada para guardar la sesión en el historial.'}
          {doneSets > 0 && pendingSets > 0 &&
            (pendingSets === 1 ? ' La serie sin marcar no se guardará.' : ` Las ${pendingSets} series sin marcar no se guardarán.`)}
        </p>
      </Modal>
    </>
  )
}
