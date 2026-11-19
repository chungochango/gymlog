import { useState } from 'react'
import { ChevronDown, Pencil, Plus, Scale, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { BODY_METRICS, latestMetric } from '../data/bodyMetrics'
import { dayKey, dayKeyToTime, formatDate, formatNumber, parseNum } from '../lib/format'
import Modal from './Modal'
import ProgressChart from './ProgressChart'
import { Button, Card, Chip, Input, cn } from './ui'

const WEIGHT = { id: 'kg', short: 'Peso', unit: 'kg', good: 'down' }

/** Body weight and composition log with chart; the latest weigh-in also updates the profile. */
export default function BodyWeightCard({ className }) {
  const { state } = useApp()
  const [open, setOpen] = useState(false)
  const [metricId, setMetricId] = useState('kg')
  const entries = state.bodyWeights // newest first
  const height = state.settings.profile?.height

  // Only metrics with at least one reading get a chip and a tile.
  const available = [WEIGHT, ...BODY_METRICS.filter((m) => entries.some((e) => e[m.id] != null))]
  const metric = available.find((m) => m.id === metricId) ?? WEIGHT
  const series = entries.filter((e) => e[metric.id] != null)
  const points = [...series].reverse().map((e) => ({ date: dayKeyToTime(e.day), weight: e[metric.id] }))
  const delta = series.length > 1 ? Math.round((series[0][metric.id] - series.at(-1)[metric.id]) * 10) / 10 : 0
  const improving = metric.good === 'down' ? delta <= 0 : delta >= 0

  const latest = entries[0]
  const fat = latestMetric(entries, 'fat')
  const bmi = latest && height ? latest.kg / (height / 100) ** 2 : null

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Scale size={15} className="text-accent" /> Peso y composición
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus size={15} /> Registrar
        </Button>
      </div>

      {entries.length ? (
        <>
          {available.length > 1 && (
            <div className="no-scrollbar -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4">
              {available.map((m) => (
                <Chip key={m.id} active={m.id === metric.id} onClick={() => setMetricId(m.id)} className="shrink-0">
                  {m.short}
                </Chip>
              ))}
            </div>
          )}
          <div className="mt-3">
            <ProgressChart points={points} unit={metric.unit} />
          </div>
          {series.length > 1 && (
            <p className={cn('mt-2 flex items-center gap-1 text-sm font-semibold tabular', improving ? 'text-accent' : 'text-cardio')}>
              {delta <= 0 ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
              {delta > 0 ? '+' : ''}
              {formatNumber(delta)} {metric.unit}
              <span className="font-normal text-faint">desde el {formatDate(dayKeyToTime(series.at(-1).day), { day: 'numeric', month: 'short' })}</span>
            </p>
          )}

          {(available.length > 1 || bmi) && (
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
              {bmi && <Tile label="IMC" value={formatNumber(Math.round(bmi * 10) / 10)} />}
              {fat && <Tile label="Kg de grasa" value={`${formatNumber(Math.round(latest.kg * fat.value) / 100)} kg`} />}
              {fat && <Tile label="Masa magra" value={`${formatNumber(Math.round(latest.kg * (100 - fat.value)) / 100)} kg`} />}
              {BODY_METRICS.map((m) => {
                const v = latestMetric(entries, m.id)
                if (!v) return null
                const good = m.good && v.delta ? (m.good === 'up') === v.delta > 0 : null
                return (
                  <Tile
                    key={m.id}
                    label={m.short}
                    value={`${formatNumber(v.value)}${m.unit ? ` ${m.unit}` : ''}`}
                    delta={v.delta ? `${v.delta > 0 ? '+' : ''}${formatNumber(v.delta)}` : null}
                    good={good}
                  />
                )
              })}
            </div>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">Pésate de vez en cuando (mejor en ayunas) y verás aquí tu evolución.</p>
      )}

      {open && <WeightForm onClose={() => setOpen(false)} />}
    </Card>
  )
}

function Tile({ label, value, delta, good }) {
  return (
    <div className="rounded-xl bg-surface-2 px-2.5 py-2">
      <p className="truncate text-[11px] text-faint">{label}</p>
      <p className="text-sm font-semibold tabular">
        {value}
        {delta && <span className={cn('ml-1 text-[11px] font-medium', good == null ? 'text-faint' : good ? 'text-accent' : 'text-cardio')}>{delta}</span>}
      </p>
    </div>
  )
}

const toInput = (v) => (v != null ? String(v).replace('.', ',') : '')

const compositionInputs = (entry) => Object.fromEntries(BODY_METRICS.map((m) => [m.id, toInput(entry?.[m.id])]))

/** New weigh-in, or edits an existing one when `entry` is set. Tapping a past weigh-in switches to editing it. */
function WeightForm({ onClose }) {
  const { state, actions } = useApp()
  const last = state.bodyWeights[0]
  const [entry, setEntry] = useState(null) // weigh-in being edited
  const [kg, setKg] = useState(toInput(last?.kg ?? state.settings.bodyWeight))
  const [day, setDay] = useState(dayKey())
  const [showMore, setShowMore] = useState(false)
  const [values, setValues] = useState({})
  const value = parseNum(kg)
  const valid = value > 20 && value < 400 && day

  const edit = (b) => {
    setEntry(b)
    setKg(toInput(b.kg))
    setDay(b.day)
    setValues(compositionInputs(b))
    setShowMore(BODY_METRICS.some((m) => b[m.id] != null))
  }

  const save = () => {
    const composition = {}
    for (const m of BODY_METRICS) {
      const n = parseNum(values[m.id])
      if (n > 0 && n <= m.max) composition[m.id] = Math.round(n * 10) / 10
    }
    // Moving a weigh-in to another day must not leave the old one behind.
    if (entry && entry.day !== day) actions.removeBodyWeight(entry.id)
    actions.logBodyWeight(Math.round(value * 10) / 10, day, composition)
    onClose()
  }

  const remove = (b) => {
    if (!confirm(`¿Borrar el pesaje del ${formatDate(dayKeyToTime(b.day), { day: 'numeric', month: 'long' })} (${formatNumber(b.kg)} kg)?`)) return
    actions.removeBodyWeight(b.id)
    if (entry?.id === b.id) onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={entry ? 'Editar pesaje' : 'Registrar peso'}
      footer={
        <div className="flex gap-2">
          {entry && (
            <Button variant="danger" size="lg" aria-label="Borrar pesaje" onClick={() => remove(entry)}>
              <Trash2 size={18} />
            </Button>
          )}
          <Button variant="primary" size="lg" className="flex-1" disabled={!valid} onClick={save}>
            Guardar
          </Button>
        </div>
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

      <button
        type="button"
        onClick={() => setShowMore((s) => !s)}
        className="mt-4 flex w-full items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5 text-sm font-medium"
      >
        Datos de la báscula (opcional)
        <ChevronDown size={16} className={cn('text-faint transition-transform', showMore && 'rotate-180')} />
      </button>
      {showMore && (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
          {BODY_METRICS.map((m) => (
            <label key={m.id} className="block">
              <span className="mb-1 block truncate text-xs font-medium text-muted">
                {m.name}{m.unit && ` (${m.unit})`}
              </span>
              <Input
                inputMode="decimal"
                value={values[m.id] ?? ''}
                placeholder={(!entry && toInput(last?.[m.id])) || '—'}
                onChange={(e) => setValues((v) => ({ ...v, [m.id]: e.target.value.replace(/[^\d.,]/g, '') }))}
                className="h-11 px-3"
              />
            </label>
          ))}
          <p className="col-span-2 text-xs text-faint">
            Copia los que te dé tu báscula; deja vacíos los que no tengas.{!entry && ' En gris, tu última medición.'} El metabolismo basal de la báscula sustituye al calculado.
          </p>
        </div>
      )}
      {!entry && <p className="mt-3 text-xs text-faint">Si ya hay un registro ese día, se sustituye.</p>}

      {state.bodyWeights.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold">Pesajes anteriores</p>
          <p className="mb-2 text-xs text-faint">Toca uno para corregirlo, o la papelera para borrarlo.</p>
          <ul className="divide-y divide-line rounded-xl bg-surface-2">
            {state.bodyWeights.slice(0, 12).map((b) => (
              <li key={b.id} className={cn('flex items-center gap-1 pr-1', entry?.id === b.id && 'bg-accent-soft')}>
                <button type="button" onClick={() => edit(b)} className="flex min-w-0 flex-1 items-center justify-between gap-2 py-3 pl-3 text-left text-sm">
                  <span className="text-muted">{formatDate(dayKeyToTime(b.day))}</span>
                  <span className="flex items-center gap-2">
                    {b.fat != null && <span className="text-xs text-faint tabular">{formatNumber(b.fat)} % grasa</span>}
                    <span className="font-semibold tabular">{formatNumber(b.kg)} kg</span>
                    <Pencil size={13} className="text-faint" />
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Borrar pesaje del ${b.day}`}
                  onClick={() => remove(b)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-faint hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}
