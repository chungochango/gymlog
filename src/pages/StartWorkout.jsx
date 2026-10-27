import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ListPlus, Plus, Trash2, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ACTIVITIES } from '../data/activities'
import CardioForm from '../components/CardioForm'
import { plural } from '../lib/format'
import ExercisePicker from '../components/ExercisePicker'
import Modal from '../components/Modal'
import { Button, Card, Input, PageHeader } from '../components/ui'

export default function StartWorkout() {
  const { state, actions, exerciseById } = useApp()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [cardioActivity, setCardioActivity] = useState(null)

  // A session is already running: go straight to it.
  useEffect(() => {
    if (state.active) navigate('/workout', { replace: true })
  }, [state.active, navigate])

  const start = (opts) => {
    actions.startWorkout(opts)
    navigate('/workout')
  }

  return (
    <>
      <PageHeader subtitle="Entrenar" title="¿Qué toca hoy?" />

      <button
        type="button"
        onClick={() => start({ name: 'Entrenamiento libre' })}
        className="flex w-full items-center gap-4 rounded-2xl border border-accent/30 bg-accent-soft p-4 text-left transition-colors hover:bg-accent/20"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink">
          <Zap size={22} />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Entrenamiento libre</span>
          <span className="block text-sm text-muted">Empieza vacío y añade ejercicios sobre la marcha</span>
        </span>
        <ChevronRight size={18} className="text-accent" />
      </button>

      <h2 className="mt-8 mb-1 text-lg font-bold tracking-tight">Cardio y deportes</h2>
      <p className="mb-3 text-sm text-muted">Registra la actividad cuando termines.</p>
      <div className="grid grid-cols-3 gap-2">
        {ACTIVITIES.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCardioActivity(id)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface py-4 text-sm font-medium transition-colors hover:bg-surface-2 active:scale-[0.97]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cardio-soft text-cardio">
              <Icon size={20} />
            </span>
            {name}
          </button>
        ))}
      </div>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Rutinas de fuerza</h2>
        <Button size="sm" variant="ghost" onClick={() => setCreating(true)}>
          <Plus size={16} /> Nueva rutina
        </Button>
      </div>

      <div className="space-y-3">
        {state.routines.map((r) => {
          const names = r.exerciseIds.map((id) => exerciseById.get(id)?.name).filter(Boolean)
          return (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{r.name}</p>
                  <p className="mt-1 text-sm text-muted line-clamp-2">{names.join(' · ') || 'Sin ejercicios'}</p>
                </div>
                {!r.builtIn && (
                  <button
                    type="button"
                    aria-label={`Eliminar rutina ${r.name}`}
                    onClick={() => confirm(`¿Eliminar la rutina "${r.name}"?`) && actions.removeRoutine(r.id)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-faint hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <Button
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => start({ name: r.name, exerciseIds: r.exerciseIds, routineId: r.id })}
              >
                Empezar · {plural(names.length, 'ejercicio')}
              </Button>
            </Card>
          )
        })}
      </div>

      <RoutineForm open={creating} onClose={() => setCreating(false)} />
      {cardioActivity && (
        <CardioForm
          initialActivity={cardioActivity}
          onClose={() => {
            setCardioActivity(null)
          }}
        />
      )}
    </>
  )
}

function RoutineForm({ open, onClose }) {
  const { actions, exerciseById } = useApp()
  const [name, setName] = useState('')
  const [ids, setIds] = useState([])
  const [picking, setPicking] = useState(false)

  const close = () => {
    setName('')
    setIds([])
    onClose()
  }

  return (
    <>
      <Modal
        open={open && !picking}
        onClose={close}
        title="Nueva rutina"
        footer={
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!name.trim() || !ids.length}
            onClick={() => {
              actions.addRoutine({ name, exerciseIds: ids })
              close()
            }}
          >
            Guardar rutina
          </Button>
        }
      >
        <label className="block text-sm font-medium text-muted" htmlFor="routine-name">Nombre</label>
        <Input id="routine-name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Torso A" />

        <p className="mt-5 text-sm font-medium text-muted">Ejercicios</p>
        <ol className="mt-2 space-y-1.5">
          {ids.map((id, i) => (
            <li key={id} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
              <span className="w-5 text-sm text-faint tabular">{i + 1}</span>
              <span className="flex-1 truncate text-sm font-medium">{exerciseById.get(id)?.name}</span>
              <button
                type="button"
                aria-label="Quitar"
                onClick={() => setIds(ids.filter((x) => x !== id))}
                className="text-faint hover:text-danger"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ol>
        <Button className="mt-2 w-full" onClick={() => setPicking(true)}>
          <ListPlus size={16} /> Añadir ejercicios
        </Button>
      </Modal>

      <ExercisePicker
        open={open && picking}
        exclude={ids}
        onClose={() => setPicking(false)}
        onConfirm={(sel) => setIds([...ids, ...sel])}
      />
    </>
  )
}
