import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { History as HistoryIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDate, formatNumber, formatVolume, plural } from '../lib/format'
import { exerciseFrequency, maxWeightHistory, workoutVolume } from '../lib/stats'
import CardioCard from '../components/CardioCard'
import CardioForm from '../components/CardioForm'
import ProgressChart from '../components/ProgressChart'
import WorkoutCard from '../components/WorkoutCard'
import { Card, Chip, EmptyState, PageHeader, cn } from '../components/ui'

const FILTERS = [
  { id: 'all', name: 'Todo' },
  { id: 'gym', name: 'Fuerza' },
  { id: 'cardio', name: 'Cardio' },
]

export default function History() {
  const { state, exerciseById } = useApp()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)

  // Exercises with recorded history, most trained first.
  const tracked = useMemo(
    () => exerciseFrequency(state.workouts).filter((id) => exerciseById.has(id)),
    [state.workouts, exerciseById],
  )
  const requested = params.get('exercise')
  const selectedId = requested && exerciseById.has(requested) ? requested : tracked[0]
  const points = useMemo(
    () => (selectedId ? maxWeightHistory(state.workouts, selectedId) : []),
    [state.workouts, selectedId],
  )
  const delta = points.length > 1 ? points.at(-1).weight - points[0].weight : 0
  const pr = points.reduce((m, p) => Math.max(m, p.weight), 0)

  // Strength and cardio sessions merged into one timeline, grouped by month.
  const months = useMemo(() => {
    const items = [
      ...(filter !== 'cardio' ? state.workouts.map((w) => ({ kind: 'gym', at: w.startedAt, item: w })) : []),
      ...(filter !== 'gym' ? state.cardio.map((c) => ({ kind: 'cardio', at: c.startedAt, item: c })) : []),
    ].sort((a, b) => b.at - a.at)
    const map = new Map()
    for (const entry of items) {
      const key = formatDate(entry.at, { month: 'long', year: 'numeric' })
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(entry)
    }
    return [...map.entries()]
  }, [state.workouts, state.cardio, filter])

  const total = state.workouts.length + state.cardio.length

  if (total === 0) {
    return (
      <>
        <PageHeader title="Historial" />
        <EmptyState icon={HistoryIcon} title="Sin entrenamientos guardados">
          Cuando registres tu primera sesión de fuerza o cardio aparecerá aquí junto a tu progreso.
        </EmptyState>
      </>
    )
  }

  return (
    <>
      <PageHeader subtitle={plural(total, 'sesión', 'sesiones')} title="Historial" />

      {selectedId && (
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted">Peso máximo</p>
            <select
              aria-label="Ejercicio"
              value={selectedId}
              onChange={(e) => setParams({ exercise: e.target.value }, { replace: true })}
              className="max-w-[60%] truncate rounded-lg bg-surface-2 px-2.5 py-1.5 text-sm font-medium outline-none"
            >
              {[...new Set([selectedId, ...tracked])].map((id) => (
                <option key={id} value={id}>{exerciseById.get(id)?.name}</option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <ProgressChart points={points} />
          </div>
          {points.length > 0 && (
            <div className="mt-3 flex gap-4 border-t border-line pt-3 text-sm">
              <span className="text-muted">
                Récord <span className="font-semibold text-ink tabular">{formatNumber(pr)} kg</span>
              </span>
              {points.length > 1 && (
                <span className={cn('flex items-center gap-1 font-semibold tabular', delta >= 0 ? 'text-accent' : 'text-danger')}>
                  {delta >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  {delta >= 0 ? '+' : ''}
                  {formatNumber(delta)} kg
                </span>
              )}
              <span className="ml-auto text-faint tabular">{plural(points.length, 'sesión', 'sesiones')}</span>
            </div>
          )}
        </Card>
      )}

      <div className="no-scrollbar mt-8 flex gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.name}</Chip>
        ))}
      </div>

      <div className="mt-5 space-y-8">
        {months.map(([month, entries]) => {
          const volume = entries.reduce((s, e) => s + (e.kind === 'gym' ? workoutVolume(e.item) : 0), 0)
          const kcal = entries.reduce((s, e) => s + (e.kind === 'cardio' ? e.item.kcal || 0 : 0), 0)
          return (
            <section key={month}>
              <div className="mb-3 flex items-baseline justify-between px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{month}</h2>
                <span className="text-xs text-faint tabular">
                  {plural(entries.length, 'sesión', 'sesiones')}
                  {volume > 0 && ` · ${formatVolume(volume)}`}
                  {kcal > 0 && ` · ${formatNumber(kcal)} kcal`}
                </span>
              </div>
              <div className="space-y-2">
                {entries.map((e) =>
                  e.kind === 'gym' ? (
                    <WorkoutCard key={e.item.id} workout={e.item} />
                  ) : (
                    <CardioCard key={e.item.id} entry={e.item} onOpen={setEditing} />
                  ),
                )}
              </div>
            </section>
          )
        })}
        {months.length === 0 && <p className="py-10 text-center text-sm text-muted">Nada registrado en esta categoría.</p>}
      </div>

      {editing && <CardioForm entry={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
