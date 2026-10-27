import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { MACROS } from '../data/nutrition'
import { formatNumber, parseNum } from '../lib/format'
import Modal from './Modal'
import { Button, Input } from './ui'

/** Body weight and daily nutrition goals. Rendered only while open. */
export default function GoalsForm({ onClose }) {
  const { state, actions } = useApp()
  const { goals, bodyWeight } = state.settings
  const [weight, setWeight] = useState(String(bodyWeight))
  const [values, setValues] = useState({
    kcal: String(goals.kcal),
    protein: String(goals.protein),
    carbs: String(goals.carbs),
    fat: String(goals.fat),
  })

  const w = parseNum(weight) ?? 0
  const macroKcal = Math.round(
    (parseNum(values.protein) ?? 0) * 4 + (parseNum(values.carbs) ?? 0) * 4 + (parseNum(values.fat) ?? 0) * 9,
  )
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value.replace(/[^\d.,]/g, '') }))

  const save = () => {
    actions.updateSettings({
      bodyWeight: w || bodyWeight,
      goals: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, parseNum(v) ?? goals[k]])),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Objetivos y perfil"
      footer={<Button variant="primary" size="lg" className="w-full" onClick={save}>Guardar</Button>}
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Peso corporal (kg)</span>
        <Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.,]/g, ''))} />
        <span className="mt-1.5 block text-xs text-faint">Se usa para estimar las calorías del cardio.</span>
      </label>

      <div className="my-5 h-px bg-line" />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Calorías diarias (kcal)</span>
        <Input inputMode="numeric" value={values.kcal} onChange={set('kcal')} />
      </label>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {MACROS.map((m) => (
          <label key={m.id} className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
              {m.id === 'carbs' ? 'Carbos' : m.name} (g)
            </span>
            <Input inputMode="numeric" value={values[m.id]} onChange={set(m.id)} className="px-3 text-center" />
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-faint">
        Tus macros suman {formatNumber(macroKcal)} kcal.
        {w > 0 && ` Para ganar o mantener músculo se suele recomendar 1,6–2,2 g de proteína por kg: ${Math.round(w * 1.6)}–${Math.round(w * 2.2)} g.`}
      </p>
    </Modal>
  )
}
