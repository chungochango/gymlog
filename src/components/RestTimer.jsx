import { useEffect, useRef } from 'react'
import { Minus, Plus, SkipForward, Timer } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNow } from '../hooks/useNow'
import { beep, vibrate } from '../lib/alerts'
import { formatSeconds } from '../lib/format'
import { cn } from './ui'

const RING = 2 * Math.PI * 20

/** Floating rest countdown. Lives in the layout so it keeps running on every screen. */
export default function RestTimer() {
  const { state, actions } = useApp()
  const { rest, settings } = state
  const now = useNow(!!rest, 250)
  const alertedFor = useRef(null)

  const remaining = rest ? (rest.endsAt - now) / 1000 : 0
  const finished = rest && remaining <= 0

  useEffect(() => {
    if (!rest || remaining > 0 || alertedFor.current === rest.endsAt) return
    alertedFor.current = rest.endsAt
    // Timer expired long ago (e.g. app was closed): clear it without alerting.
    if (remaining < -3) {
      actions.stopRest()
      return
    }
    if (settings.vibrate) vibrate()
    if (settings.sound) beep()
  }, [rest, remaining, settings.vibrate, settings.sound, actions])

  // Auto-dismiss the "done" banner a moment after it appears.
  const endsAt = rest?.endsAt
  useEffect(() => {
    if (!finished) return
    const id = setTimeout(actions.stopRest, 2500)
    return () => clearTimeout(id)
  }, [finished, endsAt, actions])

  if (!rest) return null

  const progress = Math.min(1, Math.max(0, remaining / rest.duration))

  return (
    <div className="fixed inset-x-0 z-40 px-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] pointer-events-none">
      <div
        role="timer"
        aria-live="polite"
        className={cn(
          'pointer-events-auto mx-auto max-w-lg flex items-center gap-3 rounded-2xl border p-2.5 pr-3 shadow-2xl shadow-black/60 animate-sheet-in backdrop-blur-xl transition-colors',
          finished ? 'bg-accent text-accent-ink border-accent' : 'bg-surface-2/95 border-line',
        )}
      >
        <div className="relative h-12 w-12 shrink-0">
          <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" strokeWidth="4" className={finished ? 'stroke-accent-ink/20' : 'stroke-surface-3'} />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={RING}
              strokeDashoffset={RING * (1 - progress)}
              className={cn('transition-[stroke-dashoffset] duration-300 ease-linear', finished ? 'stroke-accent-ink' : 'stroke-accent')}
            />
          </svg>
          <Timer size={16} className="absolute inset-0 m-auto" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-medium', finished ? 'text-accent-ink/70' : 'text-muted')}>
            {finished ? '¡Descanso terminado!' : 'Descanso'}
          </p>
          <p className="text-2xl font-bold tabular leading-tight">
            {finished ? 'A por la serie' : formatSeconds(remaining)}
          </p>
        </div>

        {!finished && (
          <div className="flex items-center gap-1.5">
            <TimerButton label="Restar 15 segundos" onClick={() => actions.adjustRest(-15)}>
              <Minus size={16} />
              <span className="text-xs">15</span>
            </TimerButton>
            <TimerButton label="Sumar 15 segundos" onClick={() => actions.adjustRest(15)}>
              <Plus size={16} />
              <span className="text-xs">15</span>
            </TimerButton>
            <TimerButton label="Saltar descanso" onClick={actions.stopRest} accent>
              <SkipForward size={16} />
            </TimerButton>
          </div>
        )}
      </div>
    </div>
  )
}

function TimerButton({ label, onClick, accent, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'h-10 min-w-10 px-2 rounded-xl flex items-center justify-center gap-0.5 font-semibold active:scale-95 transition-transform',
        accent ? 'bg-accent text-accent-ink' : 'bg-surface-3 text-ink',
      )}
    >
      {children}
    </button>
  )
}
