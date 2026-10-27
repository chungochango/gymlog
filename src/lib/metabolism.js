import { dayKey } from './format'

// Basal metabolic rate and daily energy balance.
// Logged exercise is added on top, so the activity factor only covers everyday life.

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', name: 'Sentado', hint: 'Oficina o estudio, poco movimiento', factor: 1.2 },
  { id: 'light', name: 'Algo activo', hint: 'De pie a ratos, caminas a menudo', factor: 1.35 },
  { id: 'active', name: 'Muy activo', hint: 'Trabajo físico o todo el día de pie', factor: 1.5 },
]

export const DEFICITS = [
  { kcal: 0, name: 'Mantener' },
  { kcal: 300, name: 'Déficit suave' },
  { kcal: 500, name: 'Déficit' },
  { kcal: 750, name: 'Déficit fuerte' },
]

/** Mifflin-St Jeor BMR in kcal/day, or null while the profile is incomplete. */
export function bmr({ sex, age, height }, weight) {
  if (!sex || !age || !height || !weight) return null
  return Math.round(10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161))
}

/** Calories burned in a day without counting logged exercise (BMR × everyday activity). */
export function baseBurn(settings) {
  const profile = settings.profile ?? {}
  const basal = bmr(profile, settings.bodyWeight)
  if (basal == null) return null
  const level = ACTIVITY_LEVELS.find((l) => l.id === profile.activity) ?? ACTIVITY_LEVELS[0]
  return { basal, total: Math.round(basal * level.factor) }
}

/** Calories burned exercising on a day: cardio entries plus strength sessions with Apple Watch data. */
export function exerciseKcal(state, day) {
  return (
    state.cardio.filter((c) => dayKey(c.startedAt) === day).reduce((s, c) => s + (c.kcal || 0), 0) +
    state.workouts.filter((w) => dayKey(w.startedAt) === day).reduce((s, w) => s + (w.watch?.kcal || 0), 0)
  )
}
