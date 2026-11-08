// Plain-text report of a workout plus its context (history, recovery, nutrition, profile),
// meant to be sent to the computer and analysed by Claude.
import { ACTIVITIES } from '../data/activities'
import { sumNutrition } from '../data/nutrition'
import { entry1RM, suggestNext } from './coach'
import { dayKey, formatDate, plural, shiftDay } from './format'
import { baseBurn } from './metabolism'
import { setVolume, workoutDuration, workoutVolume } from './stats'

const DAY = 24 * 60 * 60000
const r1 = (n) => Math.round(n * 10) / 10
const hm = (t) => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
const date = (t) => formatDate(t, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const sets = (entry) => entry.sets.map((s) => `${r1(s.weight)}×${s.reps}`).join(', ')

/** Markdown report for one workout. */
export function workoutReport(state, exerciseById, workoutId) {
  const workout = state.workouts.find((w) => w.id === workoutId)
  const older = state.workouts.filter((w) => w.startedAt < workout.startedAt)
  const name = (id) => exerciseById.get(id)?.name ?? 'Ejercicio eliminado'
  const muscle = (id) => exerciseById.get(id)?.muscle ?? '—'
  const { settings } = state
  const p = settings.profile ?? {}
  const out = []
  const line = (s = '') => out.push(s)

  line(`# GymLog · ${workout.name} · ${date(workout.startedAt)}`)
  line()
  line('Analiza este entrenamiento con su contexto: qué mantener, qué cambiar y qué hacer más.')
  line('Pesos en kg; series como peso×repeticiones; solo se guardan las series completadas.')

  line()
  line('## Perfil')
  const profile = [
    p.sex && (p.sex === 'male' ? 'hombre' : 'mujer'),
    p.age && `${p.age} años`,
    p.height && `${p.height} cm`,
    `${settings.bodyWeight} kg`,
  ].filter(Boolean)
  line(`- ${profile.join(', ')}`)
  const burn = baseBurn(settings)
  line(
    `- Objetivo diario: ${settings.goals.kcal} kcal, ${settings.goals.protein} g proteína` +
      (burn ? ` (gasto sin ejercicio ≈ ${burn.total} kcal → ${burn.total - settings.goals.kcal >= 0 ? 'déficit' : 'superávit'} de ${Math.abs(burn.total - settings.goals.kcal)} kcal)` : ''),
  )
  line(`- Objetivo semanal: ${settings.weeklyGoal ?? 3} sesiones (fuerza + cardio)`)

  line()
  line('## La sesión')
  line(`- ${hm(workout.startedAt)}–${hm(workout.endedAt)} (${Math.round(workoutDuration(workout) / 60000)} min)`)
  line(`- ${workout.exercises.reduce((n, e) => n + e.sets.length, 0)} series, volumen total ${Math.round(workoutVolume(workout))} kg`)
  const w = workout.watch
  if (w && (w.avgHr || w.maxHr || w.kcal)) {
    line(`- Apple Watch: FC media ${w.avgHr ?? '—'}, FC máx ${w.maxHr ?? '—'}, ${w.kcal ?? '—'} kcal activas`)
  }

  for (const entry of workout.exercises) {
    line()
    line(`### ${name(entry.exerciseId)} (${muscle(entry.exerciseId)})`)
    line(`- Hoy: ${sets(entry)}`)
    line(`- Volumen ${Math.round(entry.sets.reduce((s, x) => s + setVolume(x), 0))} kg · 1RM estimado ${r1(entry1RM(entry))} kg · descanso ${entry.restSeconds ?? settings.restSeconds} s`)
    const previous = older
      .map((o) => ({ o, e: o.exercises.find((x) => x.exerciseId === entry.exerciseId) }))
      .filter((x) => x.e)
      .slice(0, 4)
    if (previous.length) {
      line('- Sesiones anteriores:')
      for (const { o, e } of previous) line(`  - ${date(o.startedAt)}: ${sets(e)} (1RM ${r1(entry1RM(e))})`)
    } else {
      line('- Primera vez que se registra este ejercicio.')
    }
    const tip = suggestNext([workout, ...older], entry.exerciseId, muscle(entry.exerciseId))
    if (tip) line(`- Sugerencia de la app para la próxima: ${tip.weight} kg × ${tip.reps}${tip.stalled ? ' (estancado en las 3 últimas sesiones)' : ''}`)
  }

  // Training context around this session.
  const since = (days) => state.workouts.filter((o) => o.startedAt > workout.endedAt - days * DAY && o.startedAt <= workout.endedAt)
  const setsByMuscle = (list) => {
    const m = {}
    for (const o of list) for (const e of o.exercises) m[muscle(e.exerciseId)] = (m[muscle(e.exerciseId)] ?? 0) + e.sets.length
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || 'nada'
  }
  line()
  line('## Contexto')
  line(`- Series por músculo, últimos 7 días: ${setsByMuscle(since(7))}`)
  line(`- Series por músculo, últimos 28 días: ${setsByMuscle(since(28))}`)
  line('- Sesiones de fuerza de las últimas 4 semanas:')
  for (const o of since(28)) {
    const muscles = [...new Set(o.exercises.map((e) => muscle(e.exerciseId)))].join(', ')
    line(`  - ${date(o.startedAt)}: ${o.name} (${muscles}; ${o.exercises.reduce((n, e) => n + e.sets.length, 0)} series)`)
  }
  const cardio = state.cardio.filter((c) => c.startedAt > workout.endedAt - 14 * DAY && c.startedAt <= workout.endedAt + DAY)
  if (cardio.length) {
    line('- Cardio últimos 14 días:')
    for (const c of cardio) {
      const act = c.name || ACTIVITIES.find((a) => a.id === c.activity)?.name || c.activity
      line(`  - ${date(c.startedAt)}: ${act} ${c.minutes} min, ${c.kcal} kcal${c.avgHr ? `, FC media ${c.avgHr}` : ''}`)
    }
  }

  const weights = state.bodyWeights.slice(0, 6)
  if (weights.length) line(`- Peso corporal (reciente → antiguo): ${weights.map((b) => `${b.day} ${b.kg} kg`).join(', ')}`)

  const day = dayKey(workout.startedAt)
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(day, -i))
  const logged = days.map((d) => sumNutrition(state.foods.filter((f) => f.day === d))).filter((t) => t.kcal > 0)
  if (logged.length) {
    const avg = (k) => Math.round(logged.reduce((s, t) => s + t[k], 0) / logged.length)
    line(`- Nutrición media (${plural(logged.length, 'día', 'días')} con registro de los últimos 7): ${avg('kcal')} kcal, ${avg('protein')} g proteína, ${avg('carbs')} g carbos, ${avg('fat')} g grasa`)
    const today = sumNutrition(state.foods.filter((f) => f.day === day))
    if (today.kcal) line(`- Ese día: ${Math.round(today.kcal)} kcal, ${Math.round(today.protein)} g proteína`)
  }

  line()
  line(`_Generado por GymLog el ${date(Date.now())} a las ${hm(Date.now())}._`)
  return out.join('\n')
}

/** Monday 00:00 of the week `offset` weeks from the one containing `now`. */
export function weekStart(offset = 0, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7)
  return d.getTime()
}

const addDays = (t, n) => {
  const d = new Date(t)
  d.setDate(d.getDate() + n)
  return d.getTime()
}

/** Markdown report for the Monday–Sunday week starting at `start`. */
export function weeklyReport(state, exerciseById, start) {
  const end = addDays(start, 7)
  const prevStart = addDays(start, -7)
  const name = (id) => exerciseById.get(id)?.name ?? 'Ejercicio eliminado'
  const muscle = (id) => exerciseById.get(id)?.muscle ?? '—'
  const inRange = (t, a, b) => t >= a && t < b
  const { settings } = state
  const p = settings.profile ?? {}
  const burn = baseBurn(settings)
  const out = []
  const line = (s = '') => out.push(s)

  const workouts = state.workouts.filter((w) => inRange(w.startedAt, start, end)).reverse()
  const prevWorkouts = state.workouts.filter((w) => inRange(w.startedAt, prevStart, start))
  const cardio = state.cardio.filter((c) => inRange(c.startedAt, start, end)).reverse()
  const prevCardio = state.cardio.filter((c) => inRange(c.startedAt, prevStart, start))
  const before = state.workouts.filter((w) => w.startedAt < start)
  const short = (t) => formatDate(t, { day: 'numeric', month: 'short' })

  line(`# GymLog · Semana del ${short(start)} al ${short(addDays(end, -1))} de ${new Date(start).getFullYear()}`)
  line()
  line('Analiza la semana entera: qué mantener, qué cambiar y qué hacer más (entreno, reparto por músculos, progresión, cardio, nutrición y peso).')
  line('Pesos en kg; series como peso×repeticiones; solo se guardan las series completadas.')

  line()
  line('## Perfil')
  const profile = [
    p.sex && (p.sex === 'male' ? 'hombre' : 'mujer'),
    p.age && `${p.age} años`,
    p.height && `${p.height} cm`,
    `${settings.bodyWeight} kg`,
  ].filter(Boolean)
  line(`- ${profile.join(', ')}`)
  line(`- Objetivo diario: ${settings.goals.kcal} kcal, ${settings.goals.protein} g proteína${burn ? `; gasto sin ejercicio ≈ ${burn.total} kcal (basal ${burn.basal})` : ''}`)
  line(`- Objetivo semanal: ${settings.weeklyGoal ?? 3} sesiones (fuerza + cardio)`)

  // Summary against the previous week.
  const vol = (list) => Math.round(list.reduce((s, w) => s + workoutVolume(w), 0))
  const setCount = (list) => list.reduce((n, w) => n + w.exercises.reduce((m, e) => m + e.sets.length, 0), 0)
  const byMuscle = (list) => {
    const m = {}
    for (const w of list) for (const e of w.exercises) m[muscle(e.exerciseId)] = (m[muscle(e.exerciseId)] ?? 0) + e.sets.length
    return m
  }
  const activeDays = new Set([...workouts, ...cardio].map((x) => dayKey(x.startedAt))).size
  line()
  line('## Resumen (entre paréntesis, la semana anterior)')
  line(`- Sesiones: ${workouts.length} de fuerza (${prevWorkouts.length}) + ${cardio.length} de cardio (${prevCardio.length}) = ${workouts.length + cardio.length} de ${settings.weeklyGoal ?? 3} objetivo`)
  line(`- Días activos: ${activeDays} de 7`)
  line(`- Fuerza: ${setCount(workouts)} series (${setCount(prevWorkouts)}), volumen ${vol(workouts)} kg (${vol(prevWorkouts)} kg)`)
  const cur = byMuscle(workouts)
  const prev = byMuscle(prevWorkouts)
  const muscles = [...new Set([...Object.keys(cur), ...Object.keys(prev)])].sort((a, b) => (cur[b] ?? 0) - (cur[a] ?? 0))
  line(`- Series por músculo: ${muscles.map((m) => `${m} ${cur[m] ?? 0} (${prev[m] ?? 0})`).join(', ') || 'ninguna'}`)
  const cardioMin = (list) => list.reduce((s, c) => s + c.minutes, 0)
  const cardioKcal = (list) => list.reduce((s, c) => s + (c.kcal || 0), 0)
  line(`- Cardio: ${cardioMin(cardio)} min, ${cardioKcal(cardio)} kcal (${cardioMin(prevCardio)} min, ${cardioKcal(prevCardio)} kcal)`)

  // Day by day: training and energy balance.
  line()
  line('## Día a día')
  let logged = 0
  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, balance: 0 }
  for (let i = 0; i < 7; i++) {
    const t = addDays(start, i)
    const key = dayKey(t)
    const did = [
      ...workouts.filter((w) => dayKey(w.startedAt) === key).map((w) => `${w.name} (${[...new Set(w.exercises.map((e) => muscle(e.exerciseId)))].join(', ')})`),
      ...cardio.filter((c) => dayKey(c.startedAt) === key).map((c) => `${c.name || ACTIVITIES.find((a) => a.id === c.activity)?.name || c.activity} ${c.minutes} min`),
    ]
    const food = sumNutrition(state.foods.filter((f) => f.day === key))
    const exercise =
      cardio.filter((c) => dayKey(c.startedAt) === key).reduce((s, c) => s + (c.kcal || 0), 0) +
      workouts.filter((w) => dayKey(w.startedAt) === key).reduce((s, w) => s + (w.watch?.kcal || 0), 0)
    let nutrition = 'sin registro de comidas'
    if (food.kcal > 0) {
      logged++
      for (const k of ['kcal', 'protein', 'carbs', 'fat']) totals[k] += food[k]
      nutrition = `${Math.round(food.kcal)} kcal, ${Math.round(food.protein)} g prot., ${Math.round(food.carbs)} g carb., ${Math.round(food.fat)} g grasa`
      if (burn) {
        const balance = burn.total + exercise - food.kcal
        totals.balance += balance
        nutrition += ` → ${balance >= 0 ? 'déficit' : 'superávit'} ${Math.abs(Math.round(balance))} kcal`
      }
    }
    line(`- ${formatDate(t, { weekday: 'long', day: 'numeric' })}: ${did.join(' + ') || 'descanso'} · ${nutrition}${exercise ? ` · ejercicio ${exercise} kcal` : ''}`)
  }
  if (logged) {
    const avg = (k) => Math.round(totals[k] / logged)
    line(`- Media de ${plural(logged, 'día', 'días')} con comidas: ${avg('kcal')} kcal, ${avg('protein')} g proteína, ${avg('carbs')} g carbos, ${avg('fat')} g grasa`)
    if (burn) line(`- Balance acumulado de esos días: ${totals.balance >= 0 ? 'déficit' : 'superávit'} de ${Math.abs(Math.round(totals.balance))} kcal (≈ ${r1(Math.abs(totals.balance) / 7700)} kg de grasa)`)
  }

  // Body weight: weigh-ins this week plus the last one before it.
  const weights = state.bodyWeights.filter((b) => b.day < dayKey(end)).slice(0, 8)
  const inWeek = weights.filter((b) => b.day >= dayKey(start))
  const lastBefore = weights.find((b) => b.day < dayKey(start))
  if (inWeek.length || lastBefore) {
    line()
    line('## Peso corporal')
    if (lastBefore) line(`- Último antes de la semana: ${lastBefore.day} ${lastBefore.kg} kg`)
    for (const b of [...inWeek].reverse()) line(`- ${b.day}: ${b.kg} kg`)
    if (inWeek.length && lastBefore) line(`- Cambio: ${r1(inWeek[0].kg - lastBefore.kg)} kg`)
  }

  // Every strength session with each exercise compared to its previous time.
  if (workouts.length) {
    line()
    line('## Sesiones de fuerza')
    for (const w of workouts) {
      line()
      const watch = w.watch && (w.watch.avgHr || w.watch.kcal) ? ` · FC media ${w.watch.avgHr ?? '—'}, máx ${w.watch.maxHr ?? '—'}, ${w.watch.kcal ?? '—'} kcal` : ''
      line(`### ${formatDate(w.startedAt, { weekday: 'long', day: 'numeric' })} · ${w.name} · ${Math.round(workoutDuration(w) / 60000)} min${watch}`)
      const earlier = state.workouts.filter((o) => o.startedAt < w.startedAt)
      for (const e of w.exercises) {
        const prevEntry = earlier.map((o) => ({ o, e: o.exercises.find((x) => x.exerciseId === e.exerciseId) })).find((x) => x.e)
        const best = Math.max(0, ...before.flatMap((o) => o.exercises.filter((x) => x.exerciseId === e.exerciseId)).map(entry1RM))
        const record = best > 0 && entry1RM(e) > best + 0.01 ? ' 🏆 récord' : ''
        line(`- ${name(e.exerciseId)} (${muscle(e.exerciseId)}): ${sets(e)} · 1RM ${r1(entry1RM(e))}${record}`)
        line(prevEntry ? `  - Vez anterior (${short(prevEntry.o.startedAt)}): ${sets(prevEntry.e)} · 1RM ${r1(entry1RM(prevEntry.e))}` : '  - Primera vez registrado')
      }
    }
  }

  if (cardio.length) {
    line()
    line('## Cardio')
    for (const c of cardio) {
      const act = c.name || ACTIVITIES.find((a) => a.id === c.activity)?.name || c.activity
      line(`- ${formatDate(c.startedAt, { weekday: 'long', day: 'numeric' })}: ${act} ${c.minutes} min, ${c.kcal} kcal${c.distanceKm ? `, ${c.distanceKm} km` : ''}${c.avgHr ? `, FC media ${c.avgHr}` : ''}${c.notes ? ` («${c.notes}»)` : ''}`)
    }
  }

  line()
  line(`_Generado por GymLog el ${date(Date.now())} a las ${hm(Date.now())}._`)
  return out.join('\n')
}

/** File name like gymlog-semana-2026-11-02.md */
export const weeklyFileName = (start) => `gymlog-semana-${dayKey(start)}.md`

/** File name like gymlog-2026-11-06-brazo.md */
export function reportFileName(workout) {
  const slug = workout.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `gymlog-${dayKey(workout.startedAt)}${slug ? `-${slug}` : ''}.md`
}

/**
 * Sends the report out of the phone: share sheet with a file (WhatsApp, Mail, Archivos…),
 * falling back to a download. Returns 'shared' | 'downloaded' | 'cancelled'.
 */
export async function shareReport(text, fileName) {
  const file = new File([text], fileName, { type: 'text/plain' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
