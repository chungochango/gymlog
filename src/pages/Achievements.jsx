import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Flame, Lock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ACTIVITY_BY_ID } from '../data/activities'
import { achievements, periodSummary, volumeComparison, weeklyStreak } from '../lib/achievements'
import { formatDuration, formatNumber, formatVolume } from '../lib/format'
import { Card, Chip, PageHeader, cn } from '../components/ui'

export default function Achievements() {
  const { state, exerciseById } = useApp()
  const [period, setPeriod] = useState('month')
  const goal = state.settings.weeklyGoal ?? 3

  const streak = useMemo(() => weeklyStreak(state.workouts, state.cardio, goal), [state.workouts, state.cardio, goal])
  const list = useMemo(() => achievements(state), [state])
  const summary = useMemo(() => periodSummary(state, exerciseById, period), [state, exerciseById, period])
  const unlocked = list.filter((a) => a.unlocked).length

  return (
    <>
      <PageHeader
        back={
          <Link to="/" aria-label="Volver" className="-ml-2 grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink">
            <ChevronLeft size={24} />
          </Link>
        }
        subtitle={`${unlocked} de ${list.length} medallas`}
        title="Logros"
      />

      <StreakCard streak={streak} />

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Tu resumen</h2>
        <div className="flex gap-2">
          <Chip active={period === 'month'} onClick={() => setPeriod('month')}>Este mes</Chip>
          <Chip active={period === 'year'} onClick={() => setPeriod('year')}>Este año</Chip>
        </div>
      </div>
      <Wrapped summary={summary} />

      <h2 className="mt-8 mb-3 text-lg font-bold tracking-tight">Medallas</h2>
      <div className="grid grid-cols-2 gap-2">
        {list.map((a) => (
          <div
            key={a.id}
            className={cn('rounded-2xl border p-3', a.unlocked ? 'border-accent/30 bg-accent-soft' : 'border-line bg-surface')}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                  a.unlocked ? 'bg-accent text-accent-ink' : 'bg-surface-3 text-faint',
                )}
              >
                {a.unlocked ? <a.icon size={18} /> : <Lock size={15} />}
              </span>
              <p className={cn('text-sm font-semibold leading-tight', !a.unlocked && 'text-muted')}>{a.title}</p>
            </div>
            <p className="mt-2 text-xs text-muted">{a.desc}</p>
            {!a.unlocked && (
              <>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-accent/70" style={{ width: `${a.progress * 100}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-faint tabular">
                  {formatNumber(Math.floor(a.value))} / {formatNumber(a.target)} {a.unit ?? ''}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function StreakCard({ streak }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent text-accent-ink">
          <div className="text-center leading-none">
            <Flame size={20} className="mx-auto" />
            <span className="mt-0.5 block text-xl font-extrabold tabular">{streak.current}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {streak.current === 1 ? '1 semana' : `${streak.current} semanas`} de racha
          </p>
          <p className="text-sm text-muted">
            Mejor racha: {streak.best} · Objetivo: {streak.goal} sesiones por semana
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-muted tabular">
          <span>Esta semana</span>
          <span>
            {streak.thisWeek} / {streak.goal}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: streak.goal }, (_, i) => (
            <div key={i} className={cn('h-2 flex-1 rounded-full', i < streak.thisWeek ? 'bg-accent' : 'bg-surface-3')} />
          ))}
        </div>
        <p className="mt-2 text-xs text-faint">
          {streak.thisWeek >= streak.goal
            ? '¡Semana cumplida! La racha sigue.'
            : `Te ${streak.goal - streak.thisWeek === 1 ? 'falta 1 sesión' : `faltan ${streak.goal - streak.thisWeek} sesiones`} para cumplir esta semana.`}
        </p>
      </div>
    </Card>
  )
}

function Wrapped({ summary }) {
  const empty = !summary.workouts && !summary.cardio
  const cmp = volumeComparison(summary.volume)
  const activity = summary.topActivity && ACTIVITY_BY_ID[summary.topActivity.id]

  if (empty) {
    return (
      <Card className="p-5 text-center text-sm text-muted">
        Todavía no hay sesiones en este periodo. ¡Tu resumen te espera!
      </Card>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-accent p-5 text-accent-ink">
      <p className="text-xs font-bold uppercase tracking-widest opacity-60">GymLog · {summary.label}</p>
      <p className="mt-3 text-4xl font-extrabold leading-none tabular">{formatVolume(summary.volume)}</p>
      <p className="mt-1 text-sm font-semibold opacity-80">
        levantados: como {cmp.count === 1 ? `1 ${cmp.single}` : `${formatNumber(cmp.count)} ${cmp.label}`}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <WrapStat label="Días activos" value={summary.days} />
        <WrapStat label="Tiempo entrenando" value={formatDuration(summary.minutes * 60000)} />
        <WrapStat label="Sesiones de fuerza" value={summary.workouts} />
        <WrapStat label={summary.padel ? 'Partidos de pádel' : 'Sesiones de cardio'} value={summary.padel || summary.cardio} />
        {summary.kcal > 0 && <WrapStat label="Calorías quemadas" value={`${formatNumber(summary.kcal)} kcal`} />}
        {summary.topExercise && <WrapStat label="Tu ejercicio estrella" value={summary.topExercise} small />}
        {activity && !summary.padel && <WrapStat label="Tu deporte favorito" value={activity.name} small />}
      </div>
    </div>
  )
}

function WrapStat({ label, value, small }) {
  return (
    <div className="rounded-2xl bg-accent-ink/10 p-3">
      <p className="text-[11px] font-semibold opacity-60">{label}</p>
      <p className={cn('mt-0.5 font-extrabold tabular leading-tight', small ? 'text-sm' : 'text-xl')}>{value}</p>
    </div>
  )
}
