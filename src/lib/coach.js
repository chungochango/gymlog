// "Smart coach": estimated 1RM and next-session suggestions using double progression
// (add reps inside a 6–10 range, then add weight and drop back to 8 reps).
import { parseNum } from './format'

const REP_MIN = 6
const REP_MAX = 10
const STALL_SESSIONS = 3

/** Epley formula; reliable up to ~12 reps. */
export function estimate1RM(weight, reps) {
  const w = parseNum(weight) ?? 0
  const r = parseNum(reps) ?? 0
  if (!w || !r) return 0
  return r === 1 ? w : w * (1 + r / 30)
}

const roundTo = (n, step) => Math.round(n / step) * step

/** Best estimated 1RM among the completed sets of one exercise entry. */
export function entry1RM(entry) {
  return entry.sets.filter((s) => s.done).reduce((m, s) => Math.max(m, estimate1RM(s.weight, s.reps)), 0)
}

/** Sessions (newest first) where this exercise has completed sets. */
function sessionsFor(workouts, exerciseId) {
  const out = []
  for (const w of workouts) {
    const entry = w.exercises.find((e) => e.exerciseId === exerciseId && e.sets.some((s) => s.done))
    if (entry) out.push({ date: w.startedAt, entry })
  }
  return out
}

/** Chronological estimated 1RM per session, for charts. */
export function oneRMHistory(workouts, exerciseId) {
  return sessionsFor(workouts, exerciseId)
    .map(({ date, entry }) => ({ date, weight: roundTo(entry1RM(entry), 0.5) }))
    .filter((p) => p.weight > 0)
    .reverse()
}

/**
 * Suggested top set for the next session, or null without history.
 * Returns { weight, reps, reason, stalled }.
 */
export function suggestNext(workouts, exerciseId, muscle) {
  const sessions = sessionsFor(workouts, exerciseId)
  if (!sessions.length) return null

  const sets = sessions[0].entry.sets.filter((s) => s.done)
  const top = sets.reduce((b, s) => (!b || s.weight > b.weight || (s.weight === b.weight && s.reps > b.reps) ? s : b), null)
  const weight = parseNum(top.weight) ?? 0
  const reps = parseNum(top.reps) ?? 0
  const step = muscle === 'Piernas' ? 5 : 2.5

  // Stalled: the latest of the last few sessions isn't better than the ones before it.
  const recent = sessions.slice(0, STALL_SESSIONS).map((s) => entry1RM(s.entry))
  const stalled = recent.length === STALL_SESSIONS && recent[0] <= Math.max(...recent.slice(1)) + 0.01

  if (!weight) {
    return { weight: 0, reps: reps + 1, reason: 'Una repetición más', stalled }
  }
  if (stalled) {
    return {
      weight: roundTo(weight * 0.9, 2.5),
      reps: Math.min(REP_MAX, reps + 2),
      reason: `${STALL_SESSIONS} sesiones sin mejorar: baja un 10 % y sube repeticiones`,
      stalled,
    }
  }
  if (reps >= REP_MAX) return { weight: weight + step, reps: 8, reason: `Subir ${String(step).replace('.', ',')} kg`, stalled }
  if (reps >= REP_MIN) return { weight, reps: reps + 1, reason: 'Una repetición más', stalled }
  return { weight, reps: REP_MIN, reason: `Llega a ${REP_MIN} repeticiones`, stalled }
}
