import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, Search, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { MUSCLE_GROUPS } from '../data/defaults'
import Modal from '../components/Modal'
import { Button, Chip, Input, PageHeader, cn } from '../components/ui'

export default function Exercises() {
  const { state, actions } = useApp()
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState(null)
  const [adding, setAdding] = useState(false)

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MUSCLE_GROUPS.filter((m) => !muscle || m === muscle)
      .map((m) => ({
        muscle: m,
        items: state.exercises
          .filter((e) => e.muscle === m && (!q || e.name.toLowerCase().includes(q)))
          .sort((a, b) => a.name.localeCompare(b.name, 'es')),
      }))
      .filter((g) => g.items.length)
  }, [state.exercises, query, muscle])

  return (
    <>
      <PageHeader
        subtitle={`${state.exercises.length} ejercicios`}
        title="Biblioteca"
        action={
          <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
            <Plus size={16} /> Nuevo
          </Button>
        }
      />

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ejercicio" className="pl-10" />
      </div>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        <Chip active={!muscle} onClick={() => setMuscle(null)}>Todos</Chip>
        {MUSCLE_GROUPS.map((m) => (
          <Chip key={m} active={muscle === m} onClick={() => setMuscle(m)}>{m}</Chip>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {groups.map((g) => (
          <section key={g.muscle}>
            <h2 className="mb-2 flex items-baseline gap-2 px-1 text-sm font-semibold uppercase tracking-wider text-muted">
              {g.muscle}
              <span className="text-xs font-normal text-faint tabular">{g.items.length}</span>
            </h2>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {g.items.map((ex) => (
                <li key={ex.id} className="flex items-center">
                  <Link
                    to={`/history?exercise=${ex.id}`}
                    className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3.5 hover:bg-surface-2"
                  >
                    <span className="truncate font-medium">{ex.name}</span>
                    {ex.custom && (
                      <span className="shrink-0 rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">
                        Propio
                      </span>
                    )}
                    <ChevronRight size={16} className="ml-auto shrink-0 text-faint" />
                  </Link>
                  {ex.custom && (
                    <button
                      type="button"
                      aria-label={`Eliminar ${ex.name}`}
                      onClick={() => confirm(`¿Eliminar "${ex.name}" de la biblioteca?`) && actions.removeLibraryExercise(ex.id)}
                      className="grid h-12 w-12 shrink-0 place-items-center text-faint hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {groups.length === 0 && <p className="py-10 text-center text-sm text-muted">Sin resultados para «{query}»</p>}
      </div>

      <NewExerciseModal open={adding} onClose={() => setAdding(false)} defaultMuscle={muscle} />
    </>
  )
}

function NewExerciseModal({ open, onClose, defaultMuscle }) {
  const { state, actions } = useApp()
  const [name, setName] = useState('')
  const [muscle, setMuscle] = useState(null)
  const selectedMuscle = muscle ?? defaultMuscle ?? MUSCLE_GROUPS[0]

  const trimmed = name.trim()
  const duplicate = state.exercises.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())

  const close = () => {
    setName('')
    setMuscle(null)
    onClose()
  }

  const submit = (e) => {
    e?.preventDefault()
    if (!trimmed || duplicate) return
    actions.addExercise({ name: trimmed, muscle: selectedMuscle })
    close()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Nuevo ejercicio"
      footer={
        <Button variant="primary" size="lg" className="w-full" disabled={!trimmed || duplicate} onClick={submit}>
          Guardar ejercicio
        </Button>
      }
    >
      <form onSubmit={submit}>
        <label className="block text-sm font-medium text-muted" htmlFor="ex-name">Nombre</label>
        <Input id="ex-name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Hip thrust" autoFocus />
        {duplicate && <p className="mt-1.5 text-sm text-danger">Ya existe un ejercicio con ese nombre.</p>}

        <p className="mt-5 text-sm font-medium text-muted">Grupo muscular</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMuscle(m)}
              className={cn(
                'h-11 rounded-xl border text-sm font-medium transition-colors',
                selectedMuscle === m ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface-2 text-muted hover:text-ink',
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </form>
    </Modal>
  )
}
