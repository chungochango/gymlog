// Apple Watch data arrives through an Apple Shortcut (web apps can't read HealthKit).
// The app opens the shortcut with "minutes ago" bounds; the shortcut reads heart rate and
// active energy from Health for that window and copies "GYMLOG;avg;max;kcal;start;end" to the
// clipboard. The two dates are optional and only used to explain an empty result.

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

const clock = (t) => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

/**
 * Human explanation of why clipboard text couldn't be imported.
 * `expected` ({ start, end } in ms) is the window the app asked for.
 */
export function diagnoseWatchText(text, expected) {
  const raw = (text ?? '').trim()
  const shown = `«${raw.slice(0, 80) || 'vacío'}»`
  if (!/GYMLOG/i.test(raw)) {
    return `El portapapeles no tiene datos del Atajo (${shown}). Ejecuta el Atajo primero.`
  }
  if (/media|maximo|máximo|kcal/i.test(raw)) {
    return `El bloque Texto del Atajo tiene palabras escritas en vez de variables (${shown}). Bórralas e inserta las variables Media, Maximo y Kcal.`
  }
  const want = expected ? ` Debería buscar de ${clock(expected.start - MARGIN_MIN * 60000)} a ${clock(expected.end + MARGIN_MIN * 60000)}.` : ''
  const [, , , , from = '', to = ''] = raw.split(';').map((p) => p.trim())
  if (from && to) {
    if (from === to) {
      return `El Atajo buscó entre «${from}» y «${to}»: Inicio y Fin son la misma hora, así que no hay nada en medio.${want} Revisa el paso 5 de la guía: el segundo «Ajustar fecha» debe usar el ítem del segundo «Obtener ítem de la lista» (Último ítem).`
    }
    return `El Atajo buscó entre «${from}» y «${to}» y no encontró datos.${want} Si esas horas no coinciden, revisa los pasos 3–5 de la guía. Si coinciden, activa en Ajustes → Salud → Acceso a datos y dispositivos → Atajos: Frecuencia cardíaca y Energía en actividad.`
  }
  return `El Atajo funciona pero no encontró pulsaciones ni calorías (${shown}).${want} Para saber por qué, añade al final del bloque Texto del Atajo «;» + variable Inicio + «;» + variable Fin (paso 10 de la guía), vuelve a importar y te diré qué horas buscó.`
}

export const hasWatchData = (d) => !!(d && (d.avgHr || d.maxHr || d.kcal))
