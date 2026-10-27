import { cn } from './ui'

/** "Pulso" mark: dumbbell plates joined by a heartbeat. Same drawing as public/icon.svg. */
export function LogoMark({ size = 24, className }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M9 25v14M55 25v14M15 20v24M49 20v24" />
      <path d="M15 32h7l4-9 6 18 5-13 3 4h9" />
    </svg>
  )
}

/** App-icon style tile with the mark, for headers. */
export function LogoTile({ className }) {
  return (
    <span
      role="img"
      aria-label="GymLog"
      className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-accent', className)}
    >
      <LogoMark size={30} />
    </span>
  )
}
