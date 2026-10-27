import { Link } from 'react-router-dom'
import { ChevronRight, Clock, Flame, Layers, Weight } from 'lucide-react'
import { formatDuration, formatVolume, plural, relativeDay } from '../lib/format'
import { workoutDuration, workoutSetCount, workoutVolume } from '../lib/stats'

/** Compact row linking to a finished workout's detail page. */
export default function WorkoutCard({ workout }) {
  return (
    <Link
      to={`/history/${workout.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-semibold">{workout.name}</p>
          <p className="shrink-0 text-xs text-faint">{relativeDay(workout.startedAt)}</p>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted tabular">
          <span className="flex items-center gap-1"><Clock size={13} />{formatDuration(workoutDuration(workout))}</span>
          <span className="flex items-center gap-1"><Weight size={13} />{formatVolume(workoutVolume(workout))}</span>
          <span className="flex items-center gap-1"><Layers size={13} />{plural(workoutSetCount(workout), 'serie')}</span>
          {workout.watch?.kcal && <span className="flex items-center gap-1"><Flame size={13} />{workout.watch.kcal} kcal</span>}
        </div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
