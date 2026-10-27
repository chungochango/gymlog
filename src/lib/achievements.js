import {
  Award, Bike, CalendarCheck, Dumbbell, Flame, Medal, Moon, Mountain, Salad, Sun, Trophy, Volleyball, Watch, Weight,
} from 'lucide-react'
import { startOfWeek, workoutDuration, workoutVolume } from './stats'
import { dayKey } from './format'


function bestWeight(workouts, exerciseId) {
  let max = 0
  for (const w of workouts) {
    for (const e of w.exercises) {
      if (e.exerciseId !== exerciseId) continue
      for (const s of e.sets) if (s.done && s.weight > max) max = s.weight
    }
  }
  return max
}

/**
 * Weekly streak: consecutive weeks reaching the weekly session goal (strength + cardio).
 * The current week only adds to the streak once reached, and never breaks it while in progress.
 */
export function weeklyStreak(workouts, cardio, goal, now = Date.now()) {
  const counts = new Map()
  for (const t of [...workouts.map((w) => w.startedAt), ...cardio.map((c) => c.startedAt)]) {
    const wk = startOfWeek(new Date(t))
    counts.set(wk, (counts.get(wk) ?? 0) + 1)
  }
  const thisWeek = startOfWeek(new Date(now))
  const met = (wk) => (counts.get(wk) ?? 0) >= goal
  // Weeks are aligned to local Monday midnight, so step by date rather than fixed ms (DST).
  const shift = (wk, days) => {
    const d = new Date(wk)
    d.setDate(d.getDate() + days)
    return d.getTime()
  }

  let current = 0
  let wk = met(thisWeek) ? thisWeek : shift(thisWeek, -7)
  while (met(wk)) {
    current++
    wk = shift(wk, -7)
  }

  let best = 0
  let run = 0
  if (counts.size) {
    for (let w = Math.min(...counts.keys()); w <= thisWeek; w = shift(w, 7)) {
      if (met(w)) best = Math.max(best, ++run)
      else if (w !== thisWeek) run = 0
    }
  }

  return { current, best: Math.max(best, current), thisWeek: counts.get(thisWeek) ?? 0, goal }
}

/** All achievements with progress, unlocked first. */
export function achievements(state) {
  const { workouts, cardio, foods, settings } = state
  const volume = workouts.reduce((s, w) => s + workoutVolume(w), 0)
  const padel = cardio.filter((c) => c.activity === 'padel').length
  const bike = cardio.filter((c) => c.activity === 'bike').reduce((s, c) => s + (c.distanceKm || 0), 0)
  const hike = cardio.filter((c) => c.activity === 'hike').length
  const cardioMinutes = cardio.reduce((s, c) => s + (c.minutes || 0), 0)
  const foodDays = new Set(foods.map((f) => f.day)).size
  const streak = weeklyStreak(workouts, cardio, settings.weeklyGoal ?? 3)
  const hourOf = (t) => new Date(t).getHours()
  const early = workouts.filter((w) => hourOf(w.startedAt) < 8).length
  const late = workouts.filter((w) => hourOf(w.startedAt) >= 22).length
  const watch = workouts.filter((w) => w.watch).length + cardio.filter((c) => c.maxHr).length
  const bench = bestWeight(workouts, 'ex-press-banca')
  const squat = bestWeight(workouts, 'ex-sentadilla')
  const deadlift = bestWeight(workouts, 'ex-peso-muerto')

  const list = [
    { id: 'first', icon: Dumbbell, title: 'Primer paso', desc: 'Completa tu primer entreno de fuerza', value: workouts.length, target: 1 },
    { id: 'w10', icon: Dumbbell, title: 'Constante', desc: '10 entrenos de fuerza', value: workouts.length, target: 10 },
    { id: 'w50', icon: Medal, title: 'Veterano', desc: '50 entrenos de fuerza', value: workouts.length, target: 50 },
    { id: 'w100', icon: Trophy, title: 'Centenario', desc: '100 entrenos de fuerza', value: workouts.length, target: 100 },
    { id: 'v10', icon: Weight, title: '10 toneladas', desc: 'Mueve 10.000 kg en total', value: volume, target: 10000, unit: 'kg' },
    { id: 'v100', icon: Weight, title: '100 toneladas', desc: 'Mueve 100.000 kg en total', value: volume, target: 100000, unit: 'kg' },
    { id: 'v500', icon: Trophy, title: 'Grúa humana', desc: 'Mueve 500.000 kg en total', value: volume, target: 500000, unit: 'kg' },
    { id: 'bench100', icon: Award, title: 'Club de los 100', desc: '100 kg en press banca', value: bench, target: 100, unit: 'kg' },
    { id: 'squat100', icon: Award, title: 'Piernas de acero', desc: '100 kg en sentadilla', value: squat, target: 100, unit: 'kg' },
    { id: 'dead140', icon: Award, title: 'Tirón serio', desc: '140 kg en peso muerto', value: deadlift, target: 140, unit: 'kg' },
    { id: 'padel1', icon: Volleyball, title: 'A la pista', desc: 'Registra tu primer partido de pádel', value: padel, target: 1 },
    { id: 'padel25', icon: Volleyball, title: 'Padelero', desc: '25 partidos de pádel', value: padel, target: 25 },
    { id: 'bike100', icon: Bike, title: 'Centurión', desc: '100 km en bici', value: bike, target: 100, unit: 'km' },
    { id: 'hike5', icon: Mountain, title: 'Montañero', desc: '5 rutas de senderismo', value: hike, target: 5 },
    { id: 'cardio24h', icon: Flame, title: 'Un día entero', desc: '24 horas de cardio en total', value: cardioMinutes, target: 1440, unit: 'min' },
    { id: 'streak4', icon: CalendarCheck, title: 'Racha de un mes', desc: '4 semanas seguidas cumpliendo tu objetivo', value: streak.best, target: 4, unit: 'sem' },
    { id: 'streak12', icon: CalendarCheck, title: 'Imparable', desc: '12 semanas seguidas cumpliendo tu objetivo', value: streak.best, target: 12, unit: 'sem' },
    { id: 'food7', icon: Salad, title: 'Buen comienzo', desc: 'Apunta tus comidas 7 días', value: foodDays, target: 7, unit: 'días' },
    { id: 'food30', icon: Salad, title: 'Nutrición al día', desc: 'Apunta tus comidas 30 días', value: foodDays, target: 30, unit: 'días' },
    { id: 'watch', icon: Watch, title: 'Conectado', desc: 'Importa datos del Apple Watch', value: watch, target: 1 },
    { id: 'early', icon: Sun, title: 'Madrugador', desc: 'Entrena antes de las 8:00', value: early, target: 1 },
    { id: 'late', icon: Moon, title: 'Búho', desc: 'Entrena a partir de las 22:00', value: late, target: 1 },
  ].map((a) => ({ ...a, unlocked: a.value >= a.target, progress: Math.min(1, a.value / a.target) }))

  return list.sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.progress - a.progress)
}

/** Fun comparison for a lifted weight, "Wrapped" style. */
export function volumeComparison(kg) {
  if (kg >= 6000) return { count: Math.round(kg / 6000), label: 'elefantes', single: 'elefante' }
  if (kg >= 1500) return { count: Math.round(kg / 1500), label: 'coches', single: 'coche' }
  return { count: Math.max(1, Math.round(kg / 300)), label: 'pianos', single: 'piano' }
}

/** Summary of a period: 'month' or 'year' containing `now`. */
export function periodSummary(state, exerciseById, period, now = new Date()) {
  const start = period === 'year' ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), now.getMonth(), 1)
  const from = start.getTime()
  const workouts = state.workouts.filter((w) => w.startedAt >= from)
  const cardio = state.cardio.filter((c) => c.startedAt >= from)

  const volume = workouts.reduce((s, w) => s + workoutVolume(w), 0)
  const minutes =
    workouts.reduce((s, w) => s + workoutDuration(w) / 60000, 0) + cardio.reduce((s, c) => s + (c.minutes || 0), 0)
  const kcal = cardio.reduce((s, c) => s + (c.kcal || 0), 0) + workouts.reduce((s, w) => s + (w.watch?.kcal || 0), 0)
  const days = new Set([...workouts, ...cardio].map((x) => dayKey(x.startedAt))).size

  const exerciseCount = new Map()
  for (const w of workouts) for (const e of w.exercises) exerciseCount.set(e.exerciseId, (exerciseCount.get(e.exerciseId) ?? 0) + 1)
  const topExerciseId = [...exerciseCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

  const activityCount = new Map()
  for (const c of cardio) activityCount.set(c.activity, (activityCount.get(c.activity) ?? 0) + 1)
  const topActivity = [...activityCount.entries()].sort((a, b) => b[1] - a[1])[0]

  return {
    label: period === 'year' ? String(now.getFullYear()) : new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(now),
    workouts: workouts.length,
    cardio: cardio.length,
    padel: cardio.filter((c) => c.activity === 'padel').length,
    volume,
    minutes: Math.round(minutes),
    kcal,
    days,
    topExercise: topExerciseId ? exerciseById.get(topExerciseId)?.name : null,
    topActivity: topActivity ? { id: topActivity[0], count: topActivity[1] } : null,
  }
}
