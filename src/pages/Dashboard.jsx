import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Apple, CalendarCheck, ChevronRight, Clock, Flame, HeartPulse, Medal, Play, Settings, Weight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNow } from '../hooks/useNow'
import { dayKey, formatClock, formatDuration, formatNumber, formatVolume, relativeDay } from '../lib/format'
import { bestSet, cardioSummary, summary, weekActivity, workoutDuration, workoutSetCount, workoutVolume } from '../lib/stats'
import { MACROS, mealForNow, sumNutrition } from '../data/nutrition'
import { achievements, weeklyStreak } from '../lib/achievements'
import BodyWeightCard from '../components/BodyWeightCard'
import RecoveryCard from '../components/RecoveryCard'
import CardioCard from '../components/CardioCard'
import CardioForm from '../components/CardioForm'
import FoodForm from '../components/FoodForm'
import GoalsForm from '../components/GoalsForm'
import SettingsModal from '../components/SettingsModal'
import { LogoTile } from '../components/Logo'
import { Button, Card, EmptyState, PageHeader, Stat, cn } from '../components/ui'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function greeting() {
  const h = new Date().getHours()
  if (h < 13) return 'Buenos días'
  if (h < 21) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function Dashboard() {
  const { state, exerciseById } = useApp()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cardioForm, setCardioForm] = useState(null) // { entry? }
  const [foodOpen, setFoodOpen] = useState(false)
  const [goalsOpen, setGoalsOpen] = useState(false)
  const now = useNow(!!state.active)

  const stats = summary(state.workouts)
  const cardio = cardioSummary(state.cardio)
  const week = weekActivity(state.workouts, state.cardio)
  const weekSessions = stats.thisWeek + cardio.weekCount
  const today = (new Date().getDay() + 6) % 7
  const last = state.workouts[0]
  const lastCardio = state.cardio[0]
  const { goals } = state.settings
  const eaten = sumNutrition(state.foods.filter((f) => f.day === dayKey()))
  const streak = weeklyStreak(state.workouts, state.cardio, state.settings.weeklyGoal ?? 3)
  const medals = achievements(state).filter((a) => a.unlocked).length

  return (
    <>
      <PageHeader
        back={<LogoTile className="mr-1" />}
        subtitle={greeting()}
        title="Tu entrenamiento"
        action={
          <Button variant="ghost" size="icon" aria-label="Ajustes" onClick={() => setSettingsOpen(true)}>
            <Settings size={20} />
          </Button>
        }
      />

      {state.active ? (
        <button
          type="button"
          onClick={() => navigate('/workout')}
          className="group relative w-full overflow-hidden rounded-3xl bg-accent p-5 text-left text-accent-ink active:scale-[0.99] transition-transform"
        >
          <p className="text-sm font-semibold opacity-70">Sesión en curso</p>
          <p className="mt-0.5 truncate text-2xl font-extrabold tracking-tight">{state.active.name}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-3xl font-extrabold tabular">{formatClock(now - state.active.startedAt)}</span>
            <span className="flex items-center gap-1 rounded-full bg-accent-ink px-4 py-2 text-sm font-semibold text-accent">
              Continuar <ChevronRight size={16} />
            </span>
          </div>
        </button>
      ) : (
        <Button variant="primary" size="lg" className="h-20 w-full rounded-3xl text-lg font-bold" onClick={() => navigate('/start')}>
          <Play size={24} fill="currentColor" />
          Iniciar entrenamiento de fuerza
        </Button>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button size="lg" className="rounded-2xl" onClick={() => setCardioForm({})}>
          <HeartPulse size={20} className="text-cardio" /> Cardio
        </Button>
        <Button size="lg" className="rounded-2xl" onClick={() => setFoodOpen(true)}>
          <Apple size={20} className="text-accent" /> Comida
        </Button>
      </div>

      <Card className="mt-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Esta semana</p>
          <p className="text-sm text-muted tabular">
            <span className="font-semibold text-ink">{weekSessions}</span> {weekSessions === 1 ? 'sesión' : 'sesiones'}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {week.map((kind, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'relative grid h-9 w-full max-w-10 place-items-center rounded-xl',
                  kind === 'cardio' ? 'bg-cardio-soft text-cardio' : kind ? 'bg-accent text-accent-ink' : 'bg-surface-2',
                  i === today && !kind && 'ring-1 ring-accent/50',
                )}
              >
                {kind === 'cardio' ? <HeartPulse size={16} /> : kind && <Flame size={16} />}
                {kind === 'both' && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-cardio ring-2 ring-surface" />}
              </div>
              <span className={cn('text-[11px] font-medium', i === today ? 'text-ink' : 'text-faint')}>{WEEKDAYS[i]}</span>
            </div>
          ))}
        </div>
      </Card>

      <Link to="/achievements" className="mt-3 block">
        <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink">
            <Flame size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              {streak.current === 1 ? '1 semana' : `${streak.current} semanas`} de racha
            </span>
            <span className="block text-xs text-muted tabular">
              Esta semana {streak.thisWeek}/{streak.goal} · <Medal size={12} className="inline -mt-0.5" /> {medals} medallas
            </span>
          </span>
          <ChevronRight size={18} className="text-faint" />
        </Card>
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat icon={CalendarCheck} label="Fuerza (semana)" value={stats.thisWeek} />
        <Stat icon={HeartPulse} label="Cardio (semana)" value={cardio.weekMinutes ? formatDuration(cardio.weekMinutes * 60000) : '—'} />
        <Stat icon={Weight} label="Volumen 30 días" value={formatVolume(stats.volume30d)} />
        <Stat icon={Clock} label="Duración media" value={stats.total ? formatDuration(stats.avgDuration) : '—'} />
      </div>

      <Link to="/nutrition" className="mt-4 block">
        <Card className="p-4 transition-colors hover:bg-surface-2">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium"><Apple size={15} className="text-accent" /> Nutrición de hoy</p>
            <p className="text-sm text-muted tabular">
              <span className="font-semibold text-ink">{formatNumber(eaten.kcal)}</span> / {formatNumber(goals.kcal)} kcal
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
            <div
              className={cn('h-full rounded-full', eaten.kcal > goals.kcal ? 'bg-danger' : 'bg-accent')}
              style={{ width: `${Math.min(100, (eaten.kcal / goals.kcal) * 100)}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted tabular">
            {MACROS.map((m) => (
              <span key={m.id} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                {formatNumber(Math.round(eaten[m.id]))}/{goals[m.id]} g
              </span>
            ))}
          </div>
        </Card>
      </Link>

      <RecoveryCard className="mt-4" />
      <BodyWeightCard className="mt-4" />

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Última sesión de fuerza</h2>
          {last && (
            <Link to="/history" className="text-sm font-medium text-accent">Ver historial</Link>
          )}
        </div>

        {last ? (
          <Link to={`/history/${last.id}`} className="block">
            <Card className="p-4 transition-colors hover:bg-surface-2">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate font-semibold">{last.name}</p>
                <p className="shrink-0 text-xs text-faint">{relativeDay(last.startedAt)}</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-3 text-center">
                <MiniStat label="Duración" value={formatDuration(workoutDuration(last))} />
                <MiniStat label="Volumen" value={formatVolume(workoutVolume(last))} />
                <MiniStat label="Series" value={workoutSetCount(last)} />
              </div>
              <ul className="mt-3 space-y-2">
                {last.exercises.slice(0, 5).map((e) => {
                  const best = bestSet(e)
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-muted">
                        <span className="text-ink tabular">{e.sets.length} ×</span> {exerciseById.get(e.exerciseId)?.name ?? 'Ejercicio'}
                      </span>
                      {best && (
                        <span className="shrink-0 text-faint tabular">
                          {formatNumber(best.weight)} kg × {best.reps}
                        </span>
                      )}
                    </li>
                  )
                })}
                {last.exercises.length > 5 && (
                  <li className="text-xs text-faint">+{last.exercises.length - 5} ejercicios más</li>
                )}
              </ul>
            </Card>
          </Link>
        ) : (
          <Card>
            <EmptyState icon={Flame} title="Todavía no hay sesiones">
              Empieza tu primer entrenamiento y aquí verás el resumen.
            </EmptyState>
          </Card>
        )}
      </section>

      {lastCardio && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold tracking-tight">Último cardio</h2>
          <CardioCard entry={lastCardio} onOpen={(entry) => setCardioForm({ entry })} />
        </section>
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onOpenGoals={() => setGoalsOpen(true)} />
      {goalsOpen && <GoalsForm onClose={() => setGoalsOpen(false)} />}
      {cardioForm && <CardioForm entry={cardioForm.entry} onClose={() => setCardioForm(null)} />}
      {foodOpen && <FoodForm day={dayKey()} initialMeal={mealForNow()} onClose={() => setFoodOpen(false)} />}
    </>
  )
}

function MiniStat({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-faint">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular">{value}</p>
    </div>
  )
}
