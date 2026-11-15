// Body composition fields a smart scale (Huawei, Xiaomi…) reports, all optional per weigh-in.
// `good` says which direction is progress, to colour the change.
export const BODY_METRICS = [
  { id: 'fat', name: 'Grasa corporal', short: 'Grasa', unit: '%', good: 'down', max: 70 },
  { id: 'muscle', name: 'Masa muscular', short: 'Músculo', unit: 'kg', good: 'up', max: 150 },
  { id: 'skeletal', name: 'Masa musculoesquelética', short: 'M. esquelética', unit: 'kg', good: 'up', max: 100 },
  { id: 'visceral', name: 'Grasa visceral', short: 'Visceral', unit: '', good: 'down', max: 60 },
  { id: 'water', name: 'Agua corporal', short: 'Agua', unit: '%', good: 'up', max: 90 },
  { id: 'protein', name: 'Proteínas', short: 'Proteínas', unit: '%', good: 'up', max: 50 },
  { id: 'bone', name: 'Masa ósea', short: 'Ósea', unit: 'kg', good: 'up', max: 10 },
  { id: 'bmr', name: 'Metabolismo basal', short: 'TMB', unit: 'kcal', good: null, max: 5000 },
]

export const metricById = new Map(BODY_METRICS.map((m) => [m.id, m]))

/** Latest value of a metric (entries newest first) and its change against the previous reading. */
export function latestMetric(entries, id) {
  const withValue = entries.filter((e) => e[id] != null)
  if (!withValue.length) return null
  const [last, prev] = withValue
  return { value: last[id], day: last.day, delta: prev ? Math.round((last[id] - prev[id]) * 10) / 10 : null }
}
