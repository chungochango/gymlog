import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ACTIVITIES, INTENSITIES, estimateKcal } from '../data/activities'
import { parseNum, toLocalInput } from '../lib/format'
import Modal from './Modal'
import { Button, Input, cn } from './ui'

const DURATION_PRESETS = [30, 45, 60, 90, 120]

/**
 * Log or edit a cardio / sports session. Rendered only while open so its
 * form state starts fresh every time.
 */
export default function CardioForm({ entry, initialActivity = 'padel', onClose }) {
  const { state, actions } = useApp()
  const [activity, setActivity] = useState(entry?.activity ?? initialActivity)
  const [name, setName] = useState(entry?.name ?? '')
  const [when, setWhen] = useState(toLocalInput(entry?.startedAt ?? Date.now() - 60 * 60000))
  const [minutes, setMinutes] = useState(String(entry?.minutes ?? 60))
  const [distance, setDistance] = useState(entry?.distanceKm != null ? String(entry.distanceKm) : '')
  const [intensity, setIntensity] = useState(entry?.intensity ?? 'moderate')
  const [kcal, setKcal] = useState(entry && !entry.kcalEstimated ? String(entry.kcal) : '')
  const [avgHr, setAvgHr] = useState(entry?.avgHr != null ? String(entry.avgHr) : '')
  const [maxHr, setMaxHr] = useState(entry?.maxHr != null ? String(entry.maxHr) : '')
  const [notes, setNotes] = useState(entry?.notes ?? '')

  const def = ACTIVITIES.find((a) => a.id === activity)
  const mins = parseNum(minutes) ?? 0
  const estimate = estimateKcal(activity, mins, intensity, state.settings.bodyWeight)
  const valid = mins > 0 && !Number.isNaN(new Date(when).getTime())

  const save = () => {
    if (!valid) return
    const manualKcal = parseNum(kcal)
    actions.saveCardio({
      ...(entry?.id && { id: entry.id }),
      activity,
      name: activity === 'other' ? name.trim() : '',
      startedAt: new Date(when).getTime(),
      minutes: mins,
      distanceKm: def.distance ? parseNum(distance) : null,
      intensity,
      kcal: manualKcal ?? estimate,
      kcalEstimated: manualKcal == null,
      avgHr: parseNum(avgHr),
      maxHr: parseNum(maxHr),
      notes: notes.trim(),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={entry ? 'Editar actividad' : 'Registrar cardio'}
      footer={
        <div className="flex gap-2">
          {entry && (
            <Button
              variant="danger"
              size="lg"
              aria-label="Eliminar actividad"
              onClick={() => {
                if (confirm('¿Eliminar esta actividad?')) {
                  actions.removeCardio(entry.id)
                  onClose()
                }
              }}
            >
              <Trash2 size={18} />
            </Button>
          )}
          <Button variant="primary" size="lg" className="flex-1" disabled={!valid} onClick={save}>
            Guardar
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-2">
        {ACTIVITIES.map(({ id, name: label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActivity(id)}
            aria-pressed={activity === id}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors',
              activity === id ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface-2 text-muted hover:text-ink',
            )}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>

      {activity === 'other' && (
        <Field label="Nombre del deporte">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fútbol, tenis, boxeo…" />
        </Field>
      )}

      <Field label="Duración (min)">
        <Input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))} />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DURATION_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMinutes(String(m))}
              className={cn(
                'h-8 rounded-lg px-3 text-sm tabular',
                mins === m ? 'bg-accent text-accent-ink font-semibold' : 'bg-surface-2 text-muted',
              )}
            >
              {m < 60 ? `${m} min` : `${m / 60} h`.replace('.5', ',5')}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Intensidad">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
          {INTENSITIES.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setIntensity(i.id)}
              className={cn(
                'h-10 rounded-lg text-sm font-medium transition-colors',
                intensity === i.id ? 'bg-surface-3 text-ink' : 'text-faint',
              )}
            >
              {i.name}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Calorías">
          <Input inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value.replace(/\D/g, ''))} placeholder={`≈ ${estimate}`} className="px-3 text-center" />
        </Field>
        <Field label="FC media">
          <Input inputMode="numeric" value={avgHr} onChange={(e) => setAvgHr(e.target.value.replace(/\D/g, ''))} placeholder="lpm" className="px-3 text-center" />
        </Field>
        <Field label="FC máx">
          <Input inputMode="numeric" value={maxHr} onChange={(e) => setMaxHr(e.target.value.replace(/\D/g, ''))} placeholder="lpm" className="px-3 text-center" />
        </Field>
      </div>
      <p className="mt-2 text-xs text-faint">
        Del Apple Watch: app Fitness → Entrenamientos → toca la sesión y usa las «Calorías activas». Si no pones
        calorías se estiman con tu peso ({state.settings.bodyWeight} kg), la duración y la intensidad.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {def.distance && (
          <Field label="Distancia (km)">
            <Input inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="Opcional" />
          </Field>
        )}
        <Field label="Fecha y hora" className={def.distance ? '' : 'col-span-2'}>
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="px-3" />
        </Field>
      </div>

      <Field label="Notas">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ganamos 6-4 6-3" />
      </Field>
    </Modal>
  )
}

function Field({ label, className, children }) {
  return (
    <label className={cn('mt-4 block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}
