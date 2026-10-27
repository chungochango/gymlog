import { Activity, Bike, Footprints, HeartPulse, Mountain, PersonStanding, Ship, Volleyball, Waves } from 'lucide-react'

// MET values (Compendium of Physical Activities, moderate effort) drive the calorie estimate.
export const ACTIVITIES = [
  { id: 'padel', name: 'Pádel', icon: Volleyball, met: 6, distance: false },
  { id: 'bike', name: 'Bici', icon: Bike, met: 7.5, distance: true },
  { id: 'run', name: 'Correr', icon: Footprints, met: 9.8, distance: true },
  { id: 'walk', name: 'Caminar', icon: PersonStanding, met: 3.8, distance: true },
  { id: 'swim', name: 'Natación', icon: Waves, met: 7, distance: true },
  { id: 'hike', name: 'Senderismo', icon: Mountain, met: 6, distance: true },
  { id: 'row', name: 'Remo', icon: Ship, met: 7, distance: true },
  { id: 'elliptical', name: 'Elíptica', icon: Activity, met: 5, distance: false },
  { id: 'other', name: 'Otro deporte', icon: HeartPulse, met: 5, distance: false },
]

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]))

export const INTENSITIES = [
  { id: 'easy', name: 'Suave', factor: 0.8 },
  { id: 'moderate', name: 'Moderada', factor: 1 },
  { id: 'hard', name: 'Intensa', factor: 1.25 },
]

/** kcal ≈ MET × intensity × body weight (kg) × hours */
export function estimateKcal(activityId, minutes, intensityId, bodyWeight) {
  const met = ACTIVITY_BY_ID[activityId]?.met ?? 5
  const factor = INTENSITIES.find((i) => i.id === intensityId)?.factor ?? 1
  return Math.round(met * factor * (bodyWeight || 75) * (minutes / 60))
}

/** Display name, using the custom name for "Otro deporte". */
export const activityName = (entry) =>
  (entry.activity === 'other' && entry.name) || ACTIVITY_BY_ID[entry.activity]?.name || 'Cardio'
