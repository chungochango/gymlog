export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

const pad = (n) => String(n).padStart(2, '0')

/** 3725000 ms -> "1:02:05", 125000 -> "02:05" */
export function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** Seconds -> "1:30" for rest timers. */
export function formatSeconds(sec) {
  const s = Math.max(0, Math.ceil(sec))
  return `${Math.floor(s / 60)}:${pad(s % 60)}`
}

/** 4500000 ms -> "1 h 15 min" */
export function formatDuration(ms) {
  const min = Math.round(ms / 60000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const rest = min % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}

// Spanish locale skips grouping on 4-digit numbers by default ("8105"); force "8.105".
const nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1, useGrouping: 'always' })
export const formatNumber = (n) => nf.format(n)

export function formatVolume(kg) {
  if (kg >= 10000) return `${nf.format(kg / 1000)} t`
  return `${nf.format(kg)} kg`
}

export function formatDate(ts, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Intl.DateTimeFormat('es-ES', opts).format(new Date(ts))
}

export function relativeDay(ts) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(new Date()) - startOfDay(new Date(ts))) / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return formatDate(ts)
}

/** Parse a user-typed number accepting comma decimals ("62,5"). */
export function parseNum(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Local calendar day as "2026-10-27" (used to group meals by day). */
export function dayKey(ts = Date.now()) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function dayKeyToTime(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

export function shiftDay(key, days) {
  const t = new Date(dayKeyToTime(key))
  t.setDate(t.getDate() + days)
  return dayKey(t.getTime())
}

/** "2026-10-27T18:30" for <input type="datetime-local">, in local time. */
export function toLocalInput(ts) {
  const d = new Date(ts)
  return `${dayKey(ts)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** plural(1, 'serie') -> "1 serie", plural(3, 'serie') -> "3 series" */
export function plural(n, word, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`
}
