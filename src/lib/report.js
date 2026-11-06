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
