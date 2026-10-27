import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { BookmarkPlus, Check, ChevronLeft, Trash2, Trophy } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatClock, formatDate, formatDuration, formatNumber, formatVolume } from '../lib/format'
import { bestSet, setVolume, workoutDuration, workoutSetCount, workoutVolume } from '../lib/stats'
import WatchImport from '../components/WatchImport'
import { Button, Card, MuscleTag, PageHeader, Stat } from '../components/ui'

export default function WorkoutDetail() {
  const { id } = useParams()
  const { state, actions, exerciseById } = useApp()
  const navigate = useNavigate()
  const [savedRoutine, setSavedRoutine] = useState(false)

  const workout = state.workouts.find((w) => w.id === id)
  if (!workout) return <Navigate to="/history" replace />

  // Previous sessions only (the list is newest-first), to flag personal records.
  const older = state.workouts.slice(state.workouts.indexOf(workout) + 1)
  const previousBest = (exerciseId) =>
    older.reduce((max, w) => {
      const entry = w.exercises.find((e) => e.exerciseId === exerciseId)
      const best = entry && bestSet(entry)
      return best ? Math.max(max, best.weight) : max
    }, 0)

  const saveAsRoutine = () => {
    actions.addRoutine({ name: workout.name, exerciseIds: workout.exercises.map((e) => e.exerciseId) })
    setSavedRoutine(true)
  }

  return (
    <>
      <PageHeader
        back={
          <Link to="/history" aria-label="Volver" className="-ml-2 grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink">
            <ChevronLeft size={24} />
          </Link>
        }
        subtitle={formatDate(workout.startedAt, { weekday: 'long', day: 'numeric', month: 'long' })}
        title={workout.name}
      />

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Duración" value={formatDuration(workoutDuration(workout))} />
        <Stat label="Volumen" value={formatVolume(workoutVolume(workout))} />
        <Stat label="Series" value={workoutSetCount(workout)} />
      </div>
      <p className="mt-2 px-1 text-xs text-faint tabular">
        {formatDate(workout.startedAt, { hour: '2-digit', minute: '2-digit' })} – {formatDate(workout.endedAt, { hour: '2-digit', minute: '2-digit' })} · {formatClock(workoutDuration(workout))}
      </p>

      <WatchImport
        className="mt-4"
        start={workout.startedAt}
        end={workout.endedAt}
        data={workout.watch}
        onApply={(watch) => actions.updateWorkout(workout.id, { watch: { ...watch, importedAt: Date.now() } })}
      />

      <div className="mt-6 space-y-3">
        {workout.exercises.map((entry) => {
          const ex = exerciseById.get(entry.exerciseId)
          const best = bestSet(entry)
          const isPR = best && older.length > 0 && best.weight > previousBest(entry.exerciseId)
          const volume = entry.sets.reduce((s, set) => s + setVolume(set), 0)
          return (
            <Card key={entry.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{ex?.name ?? 'Ejercicio eliminado'}</h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    {ex && <MuscleTag muscle={ex.muscle} />}
                    <span className="text-xs text-faint tabular">{formatVolume(volume)}</span>
                  </div>
                </div>
                {isPR && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                    <Trophy size={13} /> Récord
                  </span>
                )}
              </div>
              <table className="mt-3 w-full text-sm tabular">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-faint">
                    <th className="w-12 pb-1.5 font-medium">Serie</th>
                    <th className="pb-1.5 font-medium">Peso</th>
                    <th className="pb-1.5 font-medium">Reps</th>
                    <th className="pb-1.5 text-right font-medium">Volumen</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.sets.map((set, i) => (
                    <tr key={set.id} className="border-t border-line">
                      <td className="py-2 text-muted">{i + 1}</td>
                      <td className="py-2 font-semibold">
                        {formatNumber(set.weight)} kg
                        {set === best && <Check size={13} className="ml-1 inline text-accent" aria-label="Mejor serie" />}
                      </td>
                      <td className="py-2 font-semibold">{set.reps}</td>
                      <td className="py-2 text-right text-muted">{formatNumber(setVolume(set))} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button onClick={saveAsRoutine} disabled={savedRoutine}>
          <BookmarkPlus size={16} /> {savedRoutine ? 'Rutina guardada' : 'Guardar como rutina'}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm('¿Eliminar este entrenamiento del historial?')) {
              actions.deleteWorkout(workout.id)
              navigate('/history', { replace: true })
            }
          }}
        >
          <Trash2 size={16} /> Eliminar
        </Button>
      </div>
    </>
  )
}
