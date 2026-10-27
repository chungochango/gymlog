import { RECOVERY_LEVELS } from '../lib/recovery'

const NEUTRAL = '#1c1c21'

/** Front and back silhouettes with muscle groups colored by recovery level. */
export default function MuscleMap({ byMuscle }) {
  const fill = (muscle) => RECOVERY_LEVELS[byMuscle[muscle]?.level ?? 'untrained'].color
  const title = (muscle) => {
    const m = byMuscle[muscle]
    if (!m?.hours) return `${muscle}: sin datos`
    const h = Math.round(m.hours)
    return `${muscle}: hace ${h < 48 ? `${h} h` : `${Math.round(h / 24)} días`}`
  }
  const part = (muscle, el) => (
    <g fill={fill(muscle)}>
      <title>{title(muscle)}</title>
      {el}
    </g>
  )

  return (
    <div className="grid grid-cols-2 gap-2">
      <Figure label="Frontal">
        {part('Hombros', <><ellipse cx="31" cy="47" rx="9" ry="7" /><ellipse cx="69" cy="47" rx="9" ry="7" /></>)}
        {part('Pecho', <><rect x="36" y="44" width="13.5" height="19" rx="5" /><rect x="50.5" y="44" width="13.5" height="19" rx="5" /></>)}
        {part('Bíceps', <><ellipse cx="25" cy="66" rx="5.5" ry="11" /><ellipse cx="75" cy="66" rx="5.5" ry="11" /></>)}
        {part('Core', <rect x="39" y="65" width="22" height="31" rx="6" />)}
        {part('Piernas', <><rect x="37" y="101" width="12" height="40" rx="6" /><rect x="51" y="101" width="12" height="40" rx="6" /></>)}
      </Figure>
      <Figure label="Espalda">
        {part('Hombros', <><ellipse cx="31" cy="47" rx="9" ry="7" /><ellipse cx="69" cy="47" rx="9" ry="7" /></>)}
        {part('Espalda', <path d="M38 41h24l2 10-3 41H39l-3-41z" />)}
        {part('Tríceps', <><ellipse cx="25" cy="66" rx="5.5" ry="11" /><ellipse cx="75" cy="66" rx="5.5" ry="11" /></>)}
        {part('Piernas', <><rect x="38" y="94" width="24" height="14" rx="6" /><rect x="37" y="110" width="12" height="31" rx="6" /><rect x="51" y="110" width="12" height="31" rx="6" /></>)}
      </Figure>
    </div>
  )
}

/** Neutral body (head, forearms, hips, calves) with the colored parts layered on top. */
function Figure({ label, children }) {
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 100 190" className="h-44 w-auto" aria-hidden="true">
        <g fill={NEUTRAL}>
          <circle cx="50" cy="20" r="11" />
          <rect x="45" y="29" width="10" height="9" rx="3" />
          <rect x="34" y="38" width="32" height="60" rx="10" />
          <ellipse cx="21" cy="88" rx="4.5" ry="11" />
          <ellipse cx="79" cy="88" rx="4.5" ry="11" />
          <rect x="36" y="94" width="28" height="12" rx="5" />
          <rect x="38" y="144" width="10" height="36" rx="5" />
          <rect x="52" y="144" width="10" height="36" rx="5" />
        </g>
        {children}
      </svg>
      <figcaption className="mt-1 text-[11px] text-faint">{label}</figcaption>
    </figure>
  )
}
