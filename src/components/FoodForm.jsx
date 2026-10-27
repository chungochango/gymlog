import { useMemo, useState } from 'react'
import { History, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { MACROS, MEALS } from '../data/nutrition'
import { formatNumber, parseNum } from '../lib/format'
import Modal from './Modal'
import { Button, Input, cn } from './ui'

const numOrEmpty = (v) => (v != null && v !== 0 ? String(v) : '')

/** Add or edit a food entry for a given day. Rendered only while open. */
export default function FoodForm({ entry, day, initialMeal, onClose }) {
  const { state, actions } = useApp()
  const [meal, setMeal] = useState(entry?.meal ?? initialMeal)
  const [name, setName] = useState(entry?.name ?? '')
  const [values, setValues] = useState({
    kcal: numOrEmpty(entry?.kcal),
    protein: numOrEmpty(entry?.protein),
    carbs: numOrEmpty(entry?.carbs),
    fat: numOrEmpty(entry?.fat),
  })

  // Distinct foods logged before (latest version of each), to re-add in one tap.
  const recent = useMemo(() => {
    const byName = new Map()
    for (const f of [...state.foods].sort((a, b) => b.createdAt - a.createdAt)) {
      const key = f.name.toLowerCase()
      if (!byName.has(key)) byName.set(key, f)
    }
    const q = name.trim().toLowerCase()
    return [...byName.values()].filter((f) => !q || f.name.toLowerCase().includes(q)).slice(0, 6)
  }, [state.foods, name])

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value.replace(/[^\d.,]/g, '') }))
  const fromMacros = Math.round(
    (parseNum(values.protein) ?? 0) * 4 + (parseNum(values.carbs) ?? 0) * 4 + (parseNum(values.fat) ?? 0) * 9,
  )
  const kcal = parseNum(values.kcal) ?? fromMacros
  const valid = name.trim() && kcal > 0

  const save = () => {
    if (!valid) return
    actions.saveFood({
      ...(entry && { id: entry.id, createdAt: entry.createdAt }),
      day: entry?.day ?? day,
      meal,
      name: name.trim(),
      kcal: Math.round(kcal),
      protein: parseNum(values.protein) ?? 0,
      carbs: parseNum(values.carbs) ?? 0,
      fat: parseNum(values.fat) ?? 0,
    })
    onClose()
  }

  const showRecent = !entry && recent.length > 0 && !recent.some((r) => r.name === name)

  return (
    <Modal
      open
      onClose={onClose}
      title={entry ? 'Editar alimento' : 'Añadir alimento'}
      footer={
        <div className="flex gap-2">
          {entry && (
            <Button
              variant="danger"
              size="lg"
              aria-label="Eliminar alimento"
              onClick={() => {
                actions.removeFood(entry.id)
                onClose()
              }}
            >
              <Trash2 size={18} />
            </Button>
          )}
          <Button variant="primary" size="lg" className="flex-1" disabled={!valid} onClick={save}>
            Guardar · {formatNumber(Math.round(kcal))} kcal
          </Button>
        </div>
      }
    >
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {MEALS.map(({ id, name: label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMeal(id)}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
              meal === id ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface text-muted',
            )}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Alimento</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pechuga de pollo 200 g" autoFocus={!entry} />
      </label>

      {showRecent && (
        <div className="mt-3">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-faint"><History size={13} /> Recientes</p>
          <ul className="space-y-1">
            {recent.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => {
                    setName(f.name)
                    setValues({ kcal: String(f.kcal), protein: numOrEmpty(f.protein), carbs: numOrEmpty(f.carbs), fat: numOrEmpty(f.fat) })
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-left text-sm hover:bg-surface-3"
                >
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 text-faint tabular">{f.kcal} kcal</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Calorías (kcal)</span>
        <Input inputMode="numeric" value={values.kcal} onChange={set('kcal')} placeholder={fromMacros ? `${fromMacros} (según macros)` : '0'} />
      </label>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {MACROS.map((m) => (
          <label key={m.id} className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
              {m.id === 'carbs' ? 'Carbos' : m.name} (g)
            </span>
            <Input inputMode="decimal" value={values[m.id]} onChange={set(m.id)} placeholder="0" className="px-3 text-center" />
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-faint">Si dejas las calorías vacías se calculan con los macros (4/4/9 kcal por gramo).</p>
    </Modal>
  )
}
