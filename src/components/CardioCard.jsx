import { ChevronRight, Clock, Flame, HeartPulse, Route } from 'lucide-react'
import { ACTIVITY_BY_ID, activityName } from '../data/activities'
import { formatDuration, formatNumber, relativeDay } from '../lib/format'

/** History row for a cardio / sports session; tapping opens the editor. */
export default function CardioCard({ entry, onOpen }) {
  const Icon = ACTIVITY_BY_ID[entry.activity]?.icon ?? HeartPulse
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:bg-surface-2"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cardio-soft text-cardio">
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-semibold">{activityName(entry)}</p>
          <p className="shrink-0 text-xs text-faint">{relativeDay(entry.startedAt)}</p>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted tabular">
          <span className="flex items-center gap-1"><Clock size={13} />{formatDuration(entry.minutes * 60000)}</span>
          {entry.distanceKm != null && (
            <span className="flex items-center gap-1"><Route size={13} />{formatNumber(entry.distanceKm)} km</span>
          )}
          <span className="flex items-center gap-1"><Flame size={13} />{entry.kcalEstimated ? '≈' : ''}{entry.kcal} kcal</span>
          {entry.avgHr != null && (
            <span className="flex items-center gap-1"><HeartPulse size={13} />{entry.avgHr} lpm</span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}
