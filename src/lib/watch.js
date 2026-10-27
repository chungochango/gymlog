// Apple Watch data arrives through an Apple Shortcut (web apps can't read HealthKit).
// The app opens the shortcut with "minutes ago" bounds; the shortcut reads heart rate and
// active energy from Health for that window and copies "GYMLOG;avg;max;kcal" to the clipboard.

export const SHORTCUT_NAME = 'GymLog Salud'

const MARGIN_MIN = 1

/** shortcuts:// link that runs the shortcut for the time window [start, end]. */
export function shortcutUrl(start, end, now = Date.now()) {
  const ago = (t) => Math.max(0, Math.round((now - t) / 60000))
  const text = `${ago(start) + MARGIN_MIN}|${Math.max(0, ago(end) - MARGIN_MIN)}`
  return `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=text&text=${encodeURIComponent(text)}`
}

const toNum = (s) => {
  const n = Number(String(s ?? '').trim().replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

/** Parses the shortcut's clipboard output. Returns null when it isn't GymLog data. */
export function parseWatchText(text) {
  const m = /GYMLOG\s*;\s*([\d.,]*)\s*;\s*([\d.,]*)\s*;\s*([\d.,]*)/i.exec(text ?? '')
  if (!m) return null
  const data = { avgHr: toNum(m[1]), maxHr: toNum(m[2]), kcal: toNum(m[3]) }
  return data.avgHr || data.maxHr || data.kcal ? data : null
}

export const hasWatchData = (d) => !!(d && (d.avgHr || d.maxHr || d.kcal))
