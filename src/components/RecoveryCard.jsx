import { useMemo } from 'react'
import { Activity } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { RECOVERY_LEVELS, muscleRecovery } from '../lib/recovery'
import MuscleMap from './MuscleMap'
import { Card } from './ui'

export default function RecoveryCard({ className }) {
  const { state, exerciseById } = useApp()
  const { byMuscle, suggestion } = useMemo(
    () => muscleRecovery(state.workouts, exerciseById),
    [state.workouts, exerciseById],
  )
  const trainedAny = Object.values(byMuscle).some((m) => m.level !== 'untrained')

  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Activity size={15} className="text-accent" /> Recuperación muscular
        </p>
      </div>
      <div className="px-4 pt-3">
        <MuscleMap byMuscle={byMuscle} />
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 pt-2 text-[11px] text-muted">
        {['fatigued', 'recovering', 'ready'].map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: RECOVERY_LEVELS[k].color }} />
            {RECOVERY_LEVELS[k].label} <span className="text-faint">{RECOVERY_LEVELS[k].hint}</span>
          </span>
        ))}
      </div>
      <p className="mx-4 mb-4 mt-3 rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
        {trainedAny && suggestion.length ? (
          <>
            <span className="text-muted">Hoy toca: </span>
            <span className="font-semibold text-accent">{suggestion.join(' y ')}</span>
          </>
        ) : trainedAny ? (
          <span className="text-muted">Todo está recuperándose: buen día para cardio o descanso.</span>
        ) : (
          <span className="text-muted">Entrena y verás aquí qué músculos están listos.</span>
        )}
      </p>
    </Card>
  )
}
