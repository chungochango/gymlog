import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Download, Target, Upload, Watch } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { REST_PRESETS } from '../data/defaults'
import { beep, primeAudio, vibrate } from '../lib/alerts'
import { dayKey, formatSeconds } from '../lib/format'
import Modal from './Modal'
import { Button, Chip, cn } from './ui'

export default function SettingsModal({ open, onClose, onOpenGoals }) {
  const { state, actions } = useApp()
  const { settings } = state
  const fileInput = useRef(null)
  const [message, setMessage] = useState(null)

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(actions.exportData(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gymlog-copia-${dayKey()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage({ ok: true, text: 'Copia descargada. Guárdala en Archivos o iCloud.' })
  }

  const importBackup = async (file) => {
    if (!file) return
    try {
      const backup = JSON.parse(await file.text())
      if (!confirm('Esto reemplazará todos los datos actuales por los de la copia. ¿Continuar?')) return
      actions.importData(backup)
      setMessage({ ok: true, text: 'Copia restaurada.' })
    } catch (err) {
      setMessage({ ok: false, text: err.message.startsWith('El archivo') ? err.message : 'No se pudo leer el archivo.' })
    } finally {
      fileInput.current.value = ''
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajustes">
      <button
        type="button"
        onClick={() => {
          onClose()
          onOpenGoals()
        }}
        className="mb-5 flex w-full items-center gap-3 rounded-xl bg-surface-2 p-3 text-left hover:bg-surface-3"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent"><Target size={18} /></span>
        <span className="flex-1">
          <span className="block font-medium">Objetivos y perfil</span>
          <span className="block text-xs text-muted tabular">
            {settings.bodyWeight} kg · {settings.goals.kcal} kcal · {settings.goals.protein} g proteína
          </span>
        </span>
        <ChevronRight size={18} className="text-faint" />
      </button>

      <Link
        to="/watch"
        onClick={onClose}
        className="-mt-3 mb-5 flex w-full items-center gap-3 rounded-xl bg-surface-2 p-3 text-left hover:bg-surface-3"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-cardio-soft text-cardio"><Watch size={18} /></span>
        <span className="flex-1">
          <span className="block font-medium">Apple Watch</span>
          <span className="block text-xs text-muted">Pulsaciones y calorías con Atajos</span>
        </span>
        <ChevronRight size={18} className="text-faint" />
      </Link>

      <section className="space-y-3">
        <div>
          <h3 className="font-medium">Descanso por defecto</h3>
          <p className="text-sm text-muted">Se aplica a los ejercicios que añadas a partir de ahora.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {REST_PRESETS.map((s) => (
            <Chip key={s} active={settings.restSeconds === s} onClick={() => actions.updateSettings({ restSeconds: s })}>
              {formatSeconds(s)}
            </Chip>
          ))}
        </div>
      </section>

      <div className="my-5 h-px bg-line" />

      <section className="space-y-1">
        <Toggle
          label="Vibración al terminar el descanso"
          hint="No disponible en iPhone"
          checked={settings.vibrate}
          onChange={(v) => {
            actions.updateSettings({ vibrate: v })
            if (v) vibrate(120)
          }}
        />
        <Toggle
          label="Sonido al terminar el descanso"
          checked={settings.sound}
          onChange={(v) => {
            actions.updateSettings({ sound: v })
            if (v) {
              primeAudio()
              beep()
            }
          }}
        />
      </section>

      <div className="my-5 h-px bg-line" />

      <section>
        <h3 className="font-medium">Copia de seguridad</h3>
        <p className="text-sm text-muted">
          Tus datos solo están en este navegador. Descarga una copia de vez en cuando o antes de cambiar de móvil o de dirección de la app.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button onClick={exportBackup}><Download size={16} /> Exportar</Button>
          <Button onClick={() => fileInput.current?.click()}><Upload size={16} /> Importar</Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => importBackup(e.target.files?.[0])}
        />
        {message && (
          <p className={cn('mt-2 text-sm', message.ok ? 'text-accent' : 'text-danger')}>{message.text}</p>
        )}
      </section>
    </Modal>
  )
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl py-3 text-left"
    >
      <span>
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-xs text-faint">{hint}</span>}
      </span>
      <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-surface-3')}>
        <span
          className={cn(
            'absolute top-1 h-5 w-5 rounded-full shadow transition-[left,background-color] duration-200',
            checked ? 'left-6 bg-accent-ink' : 'left-1 bg-muted',
          )}
        />
      </span>
    </button>
  )
}
