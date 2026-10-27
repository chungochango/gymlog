import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardPaste, HeartPulse, Pencil, Watch } from 'lucide-react'
import { hasWatchData, parseWatchText, shortcutUrl } from '../lib/watch'
import { Button, Input, cn } from './ui'

/**
 * Shows Apple Watch heart rate / calories for a session and imports them through the
 * "GymLog Salud" shortcut (clipboard round trip) or by typing them in.
 */
export default function WatchImport({ start, end, data, onApply, className }) {
  const [waiting, setWaiting] = useState(false)
  const [manual, setManual] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ avgHr: '', maxHr: '', kcal: '' })

  const apply = (values) => {
    onApply(values)
    setWaiting(false)
    setManual(false)
    setError(null)
  }

  const paste = async () => {
    setError(null)
    try {
      const parsed = parseWatchText(await navigator.clipboard.readText())
      if (parsed) apply(parsed)
      else setError('El portapapeles no tiene datos del Atajo. Ejecuta el Atajo primero.')
    } catch {
      setError('No se pudo leer el portapapeles. Introduce los datos a mano.')
      setManual(true)
    }
  }

  const saveManual = () => {
    const parsed = parseWatchText(`GYMLOG;${form.avgHr};${form.maxHr};${form.kcal}`)
    if (parsed) apply(parsed)
    else setError('Escribe al menos un valor.')
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value.replace(/\D/g, '') }))

  return (
    <div className={cn('rounded-2xl border border-line bg-surface p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <Watch size={18} className="text-cardio" /> Apple Watch
        </p>
        <Link to="/watch" className="text-xs font-medium text-muted hover:text-ink">Cómo configurarlo</Link>
      </div>

      {hasWatchData(data) && (
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-3 text-center tabular">
          <Metric label="FC media" value={data.avgHr} unit="lpm" heart />
          <Metric label="FC máx" value={data.maxHr} unit="lpm" heart />
          <Metric label="Calorías" value={data.kcal} unit="kcal" />
        </div>
      )}

      {!hasWatchData(data) && !waiting && !manual && (
        <p className="mt-2 text-sm text-muted">
          Importa las pulsaciones y calorías que registró tu reloj durante esta sesión.
        </p>
      )}

      {waiting && (
        <p className="mt-3 rounded-xl bg-cardio-soft px-3 py-2.5 text-sm text-cardio">
          Cuando el Atajo termine, vuelve aquí y pulsa «Pegar datos».
        </p>
      )}

      {manual ? (
        <div className="mt-3">
          <div className="grid grid-cols-3 gap-2">
            <ManualField label="FC media" value={form.avgHr} onChange={set('avgHr')} />
            <ManualField label="FC máx" value={form.maxHr} onChange={set('maxHr')} />
            <ManualField label="kcal" value={form.kcal} onChange={set('kcal')} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button onClick={() => setManual(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveManual}>Guardar</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {waiting ? (
            <Button variant="primary" className="col-span-2" onClick={paste}>
              <ClipboardPaste size={16} /> Pegar datos
            </Button>
          ) : (
            <a
              href={shortcutUrl(start, end)}
              onClick={() => {
                setWaiting(true)
                setError(null)
              }}
              className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cardio text-sm font-semibold text-[#06202c] active:scale-[0.97] transition-transform"
            >
              <HeartPulse size={16} /> {hasWatchData(data) ? 'Volver a importar' : 'Importar con Atajos'}
            </a>
          )}
          {waiting && (
            <Button variant="ghost" onClick={() => setWaiting(false)}>Cancelar</Button>
          )}
          <Button variant="ghost" className={waiting ? '' : 'col-span-2'} onClick={() => setManual(true)}>
            <Pencil size={14} /> A mano
          </Button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
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

function ManualField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <Input inputMode="numeric" value={value} onChange={onChange} className="h-11 px-2 text-center" />
    </label>
  )
}
