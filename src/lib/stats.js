// Pure functions over workout data. A workout looks like:
// { id, name, startedAt, endedAt, exercises: [{ id, exerciseId, restSeconds, sets: [{ id, weight, reps, done }] }] }

import { parseNum } from './format'

const doneSets = (entry) => entry.sets.filter((s) => s.done)

// Live sessions hold typed text ("62,5"), finished ones hold numbers: parseNum handles both.
export function setVolume(set) {
  return (parseNum(set.weight) ?? 0) * (parseNum(set.reps) ?? 0)
}

export function workoutVolume(workout) {
  return workout.exercises.reduce(
    (sum, ex) => sum + doneSets(ex).reduce((s, set) => s + setVolume(set), 0),
    0,
  )
}

export function workoutSetCount(workout) {
  return workout.exercises.reduce((sum, ex) => sum + doneSets(ex).length, 0)
}

export function workoutDuration(workout) {
  return (workout.endedAt ?? Date.now()) - workout.startedAt
}

/** Heaviest completed set of an exercise entry (ties broken by reps). */
export function bestSet(entry) {
  return doneSets(entry).reduce(
    (best, s) =>
      !best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best,
    null,
  )
}

/** Sets from the most recent finished workout that included this exercise. */
export function lastPerformance(workouts, exerciseId) {
  for (const w of workouts) {
    const entry = w.exercises.find((e) => e.exerciseId === exerciseId)
    if (entry) return doneSets(entry)
  }
  return []
}

/** Chronological max weight per session for one exercise. */
export function maxWeightHistory(workouts, exerciseId) {
  const points = []
  for (const w of workouts) {
    const entry = w.exercises.find((e) => e.exerciseId === exerciseId)
    const best = entry && bestSet(entry)
    if (best) points.push({ date: w.startedAt, weight: Number(best.weight) || 0, reps: best.reps })
  }
  return points.reverse()
}

/** Exercise ids ordered by how many sessions they appear in. */
export function exerciseFrequency(workouts) {
  const counts = new Map()
  for (const w of workouts) {
    for (const e of w.exercises) counts.set(e.exerciseId, (counts.get(e.exerciseId) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

/** Monday-based start of the current week. */
export function startOfWeek(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d.getTime()
}

/** Mon..Sun of the current week: null, 'gym', 'cardio' or 'both'. */
export function weekActivity(workouts, cardio = []) {
  const start = startOfWeek()
  const days = Array(7).fill(null)
  const mark = (ts, kind) => {
    const idx = Math.floor((ts - start) / 86400000)
    if (idx < 0 || idx >= 7) return
    days[idx] = days[idx] && days[idx] !== kind ? 'both' : kind
  }
  workouts.forEach((w) => mark(w.startedAt, 'gym'))
  cardio.forEach((c) => mark(c.startedAt, 'cardio'))
  return days
}

export function cardioSummary(cardio) {
  const week = cardio.filter((c) => c.startedAt >= startOfWeek())
  return {
    weekCount: week.length,
    weekMinutes: week.reduce((s, c) => s + (c.minutes || 0), 0),
    weekKcal: week.reduce((s, c) => s + (c.kcal || 0), 0),
  }
}

export function summary(workouts) {
  const weekStart = startOfWeek()
  const monthAgo = Date.now() - 30 * 86400000
  const recent = workouts.filter((w) => w.startedAt >= monthAgo)
  const totalTime = workouts.reduce((s, w) => s + workoutDuration(w), 0)
  return {
    total: workouts.length,
    thisWeek: workouts.filter((w) => w.startedAt >= weekStart).length,
    volume30d: recent.reduce((s, w) => s + workoutVolume(w), 0),
    avgDuration: workouts.length ? totalTime / workouts.length : 0,
  }
}
