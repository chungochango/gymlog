import { Check, Plus, Timer, Trash2, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { REST_PRESETS } from '../data/defaults'
import { primeAudio } from '../lib/alerts'
import { formatNumber, formatSeconds } from '../lib/format'
import { Card, MuscleTag, cn } from './ui'

/** One exercise inside the live session: its sets table plus per-exercise rest time. */
export default function ExerciseCard({ entry, previous }) {
  const { actions, exerciseById } = useApp()
  const exercise = exerciseById.get(entry.exerciseId)
  const doneCount = entry.sets.filter((s) => s.done).length

  const toggleDone = (set) => {
    const done = !set.done
    const patch = { done }
    // Completing an empty set reuses the "previous" values as a sensible default.
    if (done) {
      const idx = entry.sets.indexOf(set)
      const prev = previous[idx]
      if (set.weight === '' && prev) patch.weight = String(prev.weight)
      if (set.reps === '' && prev) patch.reps = String(prev.reps)
      primeAudio()
      actions.startRest(entry.restSeconds)
    }
    actions.updateSet(entry.id, set.id, patch)
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">{exercise?.name ?? 'Ejercicio eliminado'}</h3>
          <div className="mt-1.5 flex items-center gap-2">
            {exercise && <MuscleTag muscle={exercise.muscle} />}
            <span className="text-xs text-faint tabular">
              {doneCount}/{entry.sets.length} series
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <label className="relative flex h-9 items-center gap-1.5 rounded-xl bg-surface-2 pl-2.5 pr-3 text-sm text-muted">
            <Timer size={15} />
            <span className="tabular">{formatSeconds(entry.restSeconds)}</span>
            <select
              aria-label="Tiempo de descanso"
              value={entry.restSeconds}
              onChange={(e) => actions.setEntryRest(entry.id, Number(e.target.value))}
              className="absolute inset-0 opacity-0"
            >
              {[...new Set([...REST_PRESETS, entry.restSeconds])]
                .sort((a, b) => a - b)
                .map((s) => (
                  <option key={s} value={s}>Descanso {formatSeconds(s)}</option>
                ))}
            </select>
          </label>
          <button
            type="button"
            aria-label="Quitar ejercicio"
            onClick={() => {
              if (!entry.sets.some((s) => s.done) || confirm('¿Quitar este ejercicio y sus series?')) {
                actions.removeEntry(entry.id)
              }
            }}
            className="grid h-9 w-9 place-items-center rounded-xl text-faint hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="px-2">
        <div className="grid grid-cols-[2rem_1fr_4.25rem_4.25rem_2.75rem_1.75rem] items-center gap-1.5 px-1 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-faint">
          <span className="text-center">Serie</span>
          <span>Anterior</span>
          <span className="text-center">kg</span>
          <span className="text-center">Reps</span>
          <span />
          <span />
        </div>

        <ul>
          {entry.sets.map((set, i) => {
            const prev = previous[i]
            return (
              <li
                key={set.id}
                className={cn(
                  'grid grid-cols-[2rem_1fr_4.25rem_4.25rem_2.75rem_1.75rem] items-center gap-1.5 rounded-xl px-1 py-1 transition-colors',
                  set.done && 'bg-accent-soft',
                )}
              >
                <span className={cn('text-center text-sm font-semibold tabular', set.done ? 'text-accent' : 'text-muted')}>
                  {i + 1}
                </span>
                <button
                  type="button"
                  disabled={!prev || set.done}
                  onClick={() => actions.updateSet(entry.id, set.id, { weight: String(prev.weight), reps: String(prev.reps) })}
                  className="truncate text-left text-sm text-faint tabular disabled:cursor-default"
                  title={prev ? 'Usar valores anteriores' : undefined}
                >
                  {prev ? `${formatNumber(prev.weight)} × ${prev.reps}` : '—'}
                </button>
                <SetInput
                  label={`Peso serie ${i + 1}`}
                  value={set.weight}
                  placeholder={prev ? formatNumber(prev.weight) : '0'}
                  done={set.done}
                  onChange={(v) => actions.updateSet(entry.id, set.id, { weight: v })}
                />
                <SetInput
                  label={`Repeticiones serie ${i + 1}`}
                  value={set.reps}
                  placeholder={prev ? String(prev.reps) : '0'}
                  done={set.done}
                  integer
                  onChange={(v) => actions.updateSet(entry.id, set.id, { reps: v })}
                />
                <button
                  type="button"
                  aria-label={set.done ? 'Desmarcar serie' : 'Completar serie'}
                  aria-pressed={set.done}
                  onClick={() => toggleDone(set)}
                  className={cn(
                    'grid h-10 w-10 place-items-center justify-self-center rounded-xl transition-[background-color,transform] active:scale-90',
                    set.done ? 'bg-accent text-accent-ink' : 'bg-surface-3 text-faint hover:text-ink',
                  )}
                >
                  <Check size={20} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar serie ${i + 1}`}
                  onClick={() => actions.removeSet(entry.id, set.id)}
                  className="grid h-8 w-7 place-items-center rounded-lg text-faint/70 hover:text-danger"
                >
                  <X size={15} />
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="p-2 pt-1">
        <button
          type="button"
          onClick={() => actions.addSet(entry.id)}
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
        >
          <Plus size={16} /> Añadir serie
        </button>
      </div>
    </Card>
  )
}

function SetInput({ label, value, onChange, placeholder, done, integer }) {
  return (
    <input
      aria-label={label}
      inputMode={integer ? 'numeric' : 'decimal'}
      enterKeyHint="next"
      value={value}
      placeholder={placeholder}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const v = e.target.value.replace(integer ? /[^\d]/g : /[^\d.,]/g, '')
        onChange(v)
      }}
      className={cn(
        'h-10 w-full rounded-xl text-center font-semibold tabular outline-none transition-colors placeholder:font-normal placeholder:text-faint/70',
        done ? 'bg-transparent text-ink' : 'bg-surface-2 focus:bg-surface-3 focus:ring-1 focus:ring-accent/60',
      )}
    />
  )
}
