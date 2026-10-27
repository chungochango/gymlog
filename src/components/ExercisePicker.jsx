import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { MUSCLE_GROUPS } from '../data/defaults'
import Modal from './Modal'
import { Button, Chip, Input, MuscleTag, cn } from './ui'

/** Multi-select exercise chooser used by the live session and the routine editor. */
export default function ExercisePicker({ open, onClose, onConfirm, title = 'Añadir ejercicios', confirmLabel = 'Añadir', exclude = [] }) {
  const { state } = useApp()
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState(null)
  const [selected, setSelected] = useState([])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.exercises
      .filter((e) => !exclude.includes(e.id))
      .filter((e) => !muscle || e.muscle === muscle)
      .filter((e) => !q || e.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [state.exercises, query, muscle, exclude])

  const toggle = (id) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  const close = () => {
    setSelected([])
    setQuery('')
    setMuscle(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      footer={
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!selected.length}
          onClick={() => {
            onConfirm(selected)
            close()
          }}
        >
          {confirmLabel}
          {selected.length > 0 && ` (${selected.length})`}
        </Button>
      }
    >
      <div className="sticky top-0 z-10 -mx-5 bg-surface px-5 pb-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ejercicio" className="pl-10" />
        </div>
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          <Chip active={!muscle} onClick={() => setMuscle(null)}>Todos</Chip>
          {MUSCLE_GROUPS.map((m) => (
            <Chip key={m} active={muscle === m} onClick={() => setMuscle(m)}>{m}</Chip>
          ))}
        </div>
      </div>

      <ul className="space-y-1">
        {results.map((ex) => {
          const isOn = selected.includes(ex.id)
          return (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => toggle(ex.id)}
                aria-pressed={isOn}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                  isOn ? 'bg-accent-soft' : 'hover:bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-lg border transition-colors',
                    isOn ? 'border-accent bg-accent text-accent-ink' : 'border-surface-3',
                  )}
                >
                  {isOn && <Check size={15} strokeWidth={3} />}
                </span>
                <span className="flex-1 font-medium">{ex.name}</span>
                <MuscleTag muscle={ex.muscle} />
              </button>
            </li>
          )
        })}
        {results.length === 0 && <li className="py-10 text-center text-sm text-muted">Sin resultados</li>}
      </ul>
    </Modal>
  )
}
