import { useState } from 'react'
import { Pencil, Watch } from 'lucide-react'
import { parseNum } from '../lib/format'
import { Button, Input, cn } from './ui'

const hasData = (d) => !!(d && (d.avgHr || d.maxHr || d.kcal))
const str = (v) => (v != null ? String(v) : '')

/** Heart rate and calories for a session, typed in from the Apple Watch summary. */
export default function WatchStats({ data, onSave, className }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ avgHr: '', maxHr: '', kcal: '' })

  const open = () => {
    setForm({ avgHr: str(data?.avgHr), maxHr: str(data?.maxHr), kcal: str(data?.kcal) })
    setEditing(true)
  }
  const save = () => {
    const toInt = (v) => {
      const n = parseNum(v)
      return n > 0 ? Math.round(n) : null
    }
    onSave({ avgHr: toInt(form.avgHr), maxHr: toInt(form.maxHr), kcal: toInt(form.kcal) })
    setEditing(false)
  }
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value.replace(/\D/g, '') }))

  return (
    <div className={cn('rounded-2xl border border-line bg-surface p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <Watch size={18} className="text-cardio" /> Pulsaciones y calorías
        </p>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={open}>
            <Pencil size={14} /> {hasData(data) ? 'Editar' : 'Añadir'}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="mt-3">
          <div className="grid grid-cols-3 gap-2">
            <Field label="FC media" value={form.avgHr} onChange={set('avgHr')} />
            <Field label="FC máx" value={form.maxHr} onChange={set('maxHr')} />
            <Field label="kcal" value={form.kcal} onChange={set('kcal')} />
          </div>
          <p className="mt-2 text-xs text-faint">App Fitness → Entrenamientos → toca la sesión. Usa las «Calorías activas».</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button onClick={() => setEditing(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>Guardar</Button>
          </div>
        </div>
      ) : hasData(data) ? (
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-3 text-center tabular">
          <Metric label="FC media" value={data.avgHr} unit="lpm" heart />
          <Metric label="FC máx" value={data.maxHr} unit="lpm" heart />
          <Metric label="Calorías" value={data.kcal} unit="kcal" />
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">Apunta lo que marcó tu reloj en esta sesión.</p>
      )}
    </div>
  )
}

function Metric({ label, value, unit, heart }) {
  return (
    <div>
      <p className="text-[11px] text-faint">{label}</p>
      <p className={cn('mt-0.5 text-lg font-bold', heart ? 'text-danger' : 'text-accent')}>
        {value ?? '—'}
        {value != null && <span className="ml-0.5 text-[11px] font-normal text-faint">{unit}</span>}
      </p>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <Input inputMode="numeric" value={value} onChange={onChange} className="h-11 px-2 text-center" />
    </label>
  )
}
