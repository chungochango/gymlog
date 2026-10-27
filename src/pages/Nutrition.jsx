import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookmarkPlus, ChevronLeft, ChevronRight, Flame, Plus, Target } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { MACROS, MEALS, mealForNow, sumNutrition } from '../data/nutrition'
import { dayKey, dayKeyToTime, formatDate, formatNumber, relativeDay, shiftDay } from '../lib/format'
import { baseBurn, exerciseKcal } from '../lib/metabolism'
import FoodForm from '../components/FoodForm'
import GoalsForm from '../components/GoalsForm'
import { Button, Card, PageHeader, cn } from '../components/ui'

const RING = 2 * Math.PI * 52

export default function Nutrition() {
  const { state, actions } = useApp()
  const [params, setParams] = useSearchParams()
  const today = dayKey()
  const day = params.get('day') ?? today
  const [form, setForm] = useState(null) // { entry?, meal }
  const [goalsOpen, setGoalsOpen] = useState(false)

  const { goals } = state.settings
  const entries = useMemo(() => state.foods.filter((f) => f.day === day), [state.foods, day])
  const totals = sumNutrition(entries)
  const burned = exerciseKcal(state, day)
  const remaining = goals.kcal - totals.kcal + burned
  const progress = Math.min(1, totals.kcal / Math.max(1, goals.kcal + burned))
  // Energy balance: what the body burns on its own (BMR × everyday activity) plus exercise, minus food.
  const base = baseBurn(state.settings)
  const spent = base ? base.total + burned : null
  const balance = spent != null ? spent - totals.kcal : null

  const goTo = (key) => setParams(key === today ? {} : { day: key }, { replace: true })
  const dayLabel = relativeDay(dayKeyToTime(day))

  return (
    <>
      <PageHeader
        subtitle="Nutrición"
        title={day >= shiftDay(today, -1) ? dayLabel : formatDate(dayKeyToTime(day), { weekday: 'short', day: 'numeric', month: 'short' })}
        action={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Día anterior" onClick={() => goTo(shiftDay(day, -1))}>
              <ChevronLeft size={20} />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Día siguiente" disabled={day >= today} onClick={() => goTo(shiftDay(day, 1))}>
              <ChevronRight size={20} />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Objetivos" onClick={() => setGoalsOpen(true)}>
              <Target size={20} />
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-surface-3" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - progress)}
                className={cn('transition-[stroke-dashoffset] duration-500', remaining < 0 ? 'stroke-danger' : 'stroke-accent')}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-2xl font-bold tabular', remaining < 0 && 'text-danger')}>{formatNumber(Math.abs(remaining))}</span>
              <span className="text-[11px] text-muted">{remaining < 0 ? 'kcal de más' : 'kcal restantes'}</span>
            </div>
          </div>
          <dl className="flex-1 space-y-2 text-sm tabular">
            <Row label="Objetivo" value={formatNumber(goals.kcal)} />
            <Row label="Comidas" value={`− ${formatNumber(totals.kcal)}`} />
            <Row label="Ejercicio" value={`+ ${formatNumber(burned)}`} accent={burned > 0} />
          </dl>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
          {MACROS.map((m) => {
            const value = totals[m.id]
            const goal = goals[m.id] || 1
            return (
              <div key={m.id}>
                <p className="text-xs text-muted">{m.id === 'carbs' ? 'Carbos' : m.name}</p>
                <p className="mt-0.5 text-sm font-semibold tabular">
                  {formatNumber(Math.round(value))}<span className="font-normal text-faint"> / {goal} g</span>
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, (value / goal) * 100)}%`, background: m.color }} />
                </div>
              </div>
            )
          })}
        </div>

        {base ? (
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium"><Flame size={15} className="text-accent" /> Balance del día</p>
            <dl className="space-y-1.5 text-sm tabular">
              <Row label="Metabolismo y día a día" value={`${formatNumber(base.total)} kcal`} />
              <Row label="Ejercicio" value={`+ ${formatNumber(burned)} kcal`} accent={burned > 0} />
              <Row label="Comido" value={`− ${formatNumber(totals.kcal)} kcal`} />
            </dl>
            <div
              className={cn(
                'mt-3 flex items-baseline justify-between rounded-xl px-3 py-2.5',
                balance >= 0 ? 'bg-accent-soft' : 'bg-danger-soft',
              )}
            >
              <span className="text-sm font-semibold">{balance >= 0 ? 'Déficit' : 'Superávit'}</span>
              <span className={cn('text-lg font-bold tabular', balance >= 0 ? 'text-accent' : 'text-danger')}>
                {formatNumber(Math.abs(balance))} kcal
              </span>
            </div>
            <p className="mt-1.5 text-xs text-faint">
              {day === today ? 'Estimado para el día completo: ' : ''}gastas {formatNumber(spent)} kcal en total (basal {formatNumber(base.basal)}).
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setGoalsOpen(true)}
            className="mt-4 flex w-full items-center gap-2 rounded-xl bg-surface-2 px-3 py-3 text-left text-sm text-muted hover:bg-surface-3"
          >
            <Flame size={16} className="shrink-0 text-accent" />
            Añade sexo, altura y edad para ver lo que quema tu cuerpo solo y tu déficit real.
          </button>
        )}
      </Card>

      <Button variant="primary" size="lg" className="mt-4 w-full" onClick={() => setForm({ meal: mealForNow() })}>
        <Plus size={20} /> Añadir alimento
      </Button>

      <div className="mt-6 space-y-3">
        {MEALS.map(({ id, name, icon: Icon }) => {
          const items = entries.filter((e) => e.meal === id)
          if (id === 'other' && !items.length) return null
          const mealKcal = items.reduce((s, e) => s + e.kcal, 0)
          return (
            <Card key={id} className="overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <Icon size={18} className="text-muted" />
                <span className="flex-1 font-semibold">{name}</span>
                {mealKcal > 0 && <span className="text-sm text-muted tabular">{formatNumber(mealKcal)} kcal</span>}
                {items.length > 0 && (
                  <button
                    type="button"
                    aria-label={`Guardar ${name} como comida`}
                    title="Guardar como comida"
                    onClick={() => {
                      const mealName = prompt('Nombre para esta comida guardada:', `Mi ${name.toLowerCase()}`)
                      if (mealName?.trim()) actions.saveMeal({ name: mealName, items })
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted hover:text-accent"
                  >
                    <BookmarkPlus size={16} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Añadir a ${name}`}
                  onClick={() => setForm({ meal: id })}
                  className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted hover:text-accent"
                >
                  <Plus size={16} />
                </button>
              </div>
              {items.length > 0 && (
                <ul className="divide-y divide-line border-t border-line">
                  {items.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setForm({ entry: e, meal: e.meal })}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{e.name}</span>
                          <span className="block text-xs text-faint tabular">
                            P {formatNumber(e.protein)} · C {formatNumber(e.carbs)} · G {formatNumber(e.fat)}
                          </span>
                        </span>
                        <span className="text-sm font-semibold tabular">{e.kcal}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )
        })}
      </div>

      {form && <FoodForm entry={form.entry} initialMeal={form.meal} day={day} onClose={() => setForm(null)} />}
      {goalsOpen && <GoalsForm onClose={() => setGoalsOpen(false)} />}
    </>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className={cn('font-semibold', accent && 'text-cardio')}>{value}</dd>
    </div>
  )
}
