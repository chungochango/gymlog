import { useState } from 'react'
import { Plus, Scale, TrendingDown, TrendingUp, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { dayKey, dayKeyToTime, formatDate, formatNumber, parseNum } from '../lib/format'
import Modal from './Modal'
import ProgressChart from './ProgressChart'
import { Button, Card, Input, cn } from './ui'

/** Body weight log with chart; the latest weigh-in also updates the profile weight. */
export default function BodyWeightCard({ className }) {
  const { state } = useApp()
  const [open, setOpen] = useState(false)
  const entries = state.bodyWeights // newest first
  const points = [...entries].reverse().map((b) => ({ date: dayKeyToTime(b.day), weight: b.kg }))
  const delta = entries.length > 1 ? entries[0].kg - entries.at(-1).kg : 0

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Scale size={15} className="text-accent" /> Peso corporal
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={15} /> Registrar
        </Button>
      </div>

      {entries.length ? (
        <>
          <div className="mt-3">
            <ProgressChart points={points} />
          </div>
          {entries.length > 1 && (
            <p className={cn('mt-2 flex items-center gap-1 text-sm font-semibold tabular', delta <= 0 ? 'text-accent' : 'text-cardio')}>
              {delta <= 0 ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
              {delta > 0 ? '+' : ''}
              {formatNumber(delta)} kg
              <span className="font-normal text-faint">desde el {formatDate(dayKeyToTime(entries.at(-1).day), { day: 'numeric', month: 'short' })}</span>
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">Pésate de vez en cuando (mejor en ayunas) y verás aquí tu evolución.</p>
      )}

      {open && <WeightForm onClose={() => setOpen(false)} />}
    </Card>
  )
}

function WeightForm({ onClose }) {
  const { state, actions } = useApp()
  const [kg, setKg] = useState(String(state.bodyWeights[0]?.kg ?? state.settings.bodyWeight).replace('.', ','))
  const [day, setDay] = useState(dayKey())
  const value = parseNum(kg)
  const valid = value > 20 && value < 400 && day

  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar peso"
      footer={
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!valid}
          onClick={() => {
            actions.logBodyWeight(Math.round(value * 10) / 10, day)
            onClose()
          }}
        >
          Guardar
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Peso (kg)</span>
          <Input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.,]/g, ''))} autoFocus />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Día</span>
          <Input type="date" value={day} max={dayKey()} onChange={(e) => setDay(e.target.value)} className="px-3" />
        </label>
      </div>
      <p className="mt-2 text-xs text-faint">Si ya hay un peso ese día, se sustituye. El último peso se usa para estimar calorías.</p>

      {state.bodyWeights.length > 0 && (
        <ul className="mt-5 divide-y divide-line rounded-xl bg-surface-2">
          {state.bodyWeights.slice(0, 8).map((b) => (
            <li key={b.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-muted">{formatDate(dayKeyToTime(b.day))}</span>
              <span className="flex items-center gap-2">
                <span className="font-semibold tabular">{formatNumber(b.kg)} kg</span>
                <button type="button" aria-label="Borrar" onClick={() => actions.removeBodyWeight(b.id)} className="text-faint hover:text-danger">
                  <X size={15} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
