import { MUSCLE_GROUPS } from '../data/defaults'

const HOUR = 3600000

export const RECOVERY_LEVELS = {
  fatigued: { label: 'Cansado', hint: '< 24 h', color: '#f87171' },
  recovering: { label: 'Recuperando', hint: '24–48 h', color: '#fbbf24' },
  ready: { label: 'Listo', hint: '> 48 h', color: '#c4f031' },
  untrained: { label: 'Sin datos', hint: '', color: '#2e2e36' },
}

function levelFor(hours) {
  if (hours == null) return 'untrained'
  if (hours < 24) return 'fatigued'
  if (hours < 48) return 'recovering'
  return 'ready'
}

/**
 * Recovery state per muscle group from completed sets.
 * Returns { [muscle]: { level, hours, sets } } plus `suggestion`: muscles to train today.
 */
export function muscleRecovery(workouts, exerciseById, now = Date.now()) {
  const last = {}
  for (const w of workouts) {
    for (const e of w.exercises) {
      const muscle = exerciseById.get(e.exerciseId)?.muscle
      const sets = e.sets.filter((s) => s.done).length
      if (!muscle || !sets) continue
      // Workouts are newest first, so the first hit is the most recent session.
      if (!last[muscle]) last[muscle] = { at: w.startedAt, sets }
      else if (last[muscle].at === w.startedAt) last[muscle].sets += sets
    }
  }

  const byMuscle = Object.fromEntries(
    MUSCLE_GROUPS.map((m) => {
      const hours = last[m] ? (now - last[m].at) / HOUR : null
      return [m, { level: levelFor(hours), hours, sets: last[m]?.sets ?? 0 }]
    }),
  )

  // Suggest the ready (or never trained) groups that have rested the longest; Core is a filler.
  const candidates = MUSCLE_GROUPS.filter((m) => m !== 'Core' && ['ready', 'untrained'].includes(byMuscle[m].level)).sort(
    (a, b) => (byMuscle[b].hours ?? Infinity) - (byMuscle[a].hours ?? Infinity),
  )
  return { byMuscle, suggestion: candidates.slice(0, 2) }
}
