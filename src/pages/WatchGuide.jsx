import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ClipboardPaste, HeartPulse, Watch } from 'lucide-react'
import { SHORTCUT_NAME, parseWatchText, shortcutUrl } from '../lib/watch'
import { Button, Card, PageHeader } from '../components/ui'

// Spanish iOS action names, as they appear in the Shortcuts app search.
const STEPS = [
  <>Abre <b>Atajos</b>, pulsa <b>+</b> y nombra el atajo exactamente <Code>{SHORTCUT_NAME}</Code>.</>,
  <>Añade <b>Dividir texto</b>. Entrada: <Var>Entrada del atajo</Var>. Separador: <b>Personalizado</b> → <Code>|</Code></>,
  <>Añade <b>Obtener elemento de la lista</b> → <b>Primer elemento</b> de <Var>Texto dividido</Var>.</>,
  <>Añade <b>Ajustar fecha</b>: <b>Restar</b> <Var>Elemento de la lista</Var> <b>minutos</b> de <Var>Fecha actual</Var>. Luego <b>Establecer variable</b> con el nombre <Code>Inicio</Code>.</>,
  <>Añade otra vez <b>Obtener elemento de la lista</b> → <b>Último elemento</b> de <Var>Texto dividido</Var>, y repite <b>Ajustar fecha</b> igual que antes. Guárdalo con <b>Establecer variable</b> como <Code>Fin</Code>.</>,
  <>Añade <b>Buscar muestras de salud</b> con <b>todas</b> estas condiciones: Tipo es <b>Frecuencia cardíaca</b> · Fecha de inicio es <b>posterior a</b> <Var>Inicio</Var> · Fecha de inicio es <b>anterior a</b> <Var>Fin</Var>.</>,
  <>Añade <b>Calcular estadísticas</b> → <b>Media</b> de <Var>Muestras de salud</Var>, luego <b>Redondear número</b> y <b>Establecer variable</b> <Code>Media</Code>.</>,
  <>Añade otra vez <b>Calcular estadísticas</b> → <b>Máximo</b> (toca la entrada y elige <Var>Muestras de salud</Var>), <b>Redondear número</b> y <b>Establecer variable</b> <Code>Maximo</Code>.</>,
  <>Añade otra <b>Buscar muestras de salud</b> con Tipo <b>Energía activa</b> y las mismas dos condiciones de fecha. Después <b>Calcular estadísticas</b> → <b>Suma</b>, <b>Redondear número</b> y <b>Establecer variable</b> <Code>Kcal</Code>.</>,
  <>Añade <b>Texto</b> y escribe <Code>GYMLOG;</Code><Var>Media</Var><Code>;</Code><Var>Maximo</Var><Code>;</Code><Var>Kcal</Var> (sin espacios).</>,
  <>Añade <b>Copiar al portapapeles</b> con ese <Var>Texto</Var>. Opcional: <b>Mostrar notificación</b> «Vuelve a GymLog y pulsa Pegar datos».</>,
]

export default function WatchGuide() {
  const [waiting, setWaiting] = useState(false)
  const [result, setResult] = useState(null)

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const parsed = parseWatchText(text)
      setResult(parsed ? { ok: true, ...parsed } : { ok: false, text: `El portapapeles contiene: «${text.slice(0, 60)}». Revisa el paso 10.` })
    } catch {
      setResult({ ok: false, text: 'Este navegador no deja leer el portapapeles. Funciona en la versión publicada (https).' })
    }
  }

  return (
    <>
      <PageHeader
        back={
          <Link to="/" aria-label="Volver" className="-ml-2 grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink">
            <ChevronLeft size={24} />
          </Link>
        }
        subtitle="Configuración"
        title="Apple Watch"
      />

      <Card className="p-4">
        <p className="flex items-center gap-2 font-semibold"><Watch size={18} className="text-cardio" /> Cómo funciona</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>Al empezar, abre <b className="text-ink">Entreno</b> en el reloj (Fuerza tradicional, Pádel, Ciclismo…). Así mide el pulso de forma continua.</li>
          <li>Apunta tus series o tu actividad en GymLog como siempre y finaliza el entreno en el reloj.</li>
          <li>En el resumen de la sesión pulsa <b className="text-ink">Importar con Atajos</b>. El Atajo lee Salud y copia los datos.</li>
          <li>Vuelve a GymLog y pulsa <b className="text-ink">Pegar datos</b>.</li>
        </ol>
      </Card>

      <h2 className="mt-8 mb-1 text-lg font-bold tracking-tight">Crear el Atajo (una sola vez)</h2>
      <p className="mb-3 text-sm text-muted">Unos 5 minutos en el iPhone. Busca cada acción por su nombre con la barra de búsqueda de Atajos.</p>
      <ol className="space-y-2">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-3 rounded-2xl border border-line bg-surface p-3.5 text-sm leading-relaxed">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>
            <span className="text-muted [&_b]:font-semibold [&_b]:text-ink">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-faint">
        La primera vez iOS pedirá permiso para leer Frecuencia cardíaca y Energía activa de Salud, y para usar el portapapeles: acepta ambos.
      </p>

      <h2 className="mt-8 mb-1 text-lg font-bold tracking-tight">Probarlo</h2>
      <p className="mb-3 text-sm text-muted">Lee los datos de la última hora. Si llevas el reloj puesto, deberías ver tu pulso.</p>
      <Card className="p-4">
        {waiting ? (
          <Button variant="primary" className="w-full" onClick={paste}>
            <ClipboardPaste size={16} /> Pegar datos
          </Button>
        ) : (
          <a
            href={shortcutUrl(Date.now() - 60 * 60000, Date.now())}
            onClick={() => {
              setWaiting(true)
              setResult(null)
            }}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cardio text-sm font-semibold text-[#06202c]"
          >
            <HeartPulse size={16} /> Ejecutar «{SHORTCUT_NAME}»
          </a>
        )}
        {result && (
          <p className={result.ok ? 'mt-3 text-sm text-accent' : 'mt-3 text-sm text-danger'}>
            {result.ok
              ? `Funciona: FC media ${result.avgHr ?? '—'} · máx ${result.maxHr ?? '—'} · ${result.kcal ?? '—'} kcal`
              : result.text}
          </p>
        )}
        {waiting && (
          <button type="button" onClick={() => setWaiting(false)} className="mt-2 w-full text-center text-xs text-faint">
            Volver a ejecutar el Atajo
          </button>
        )}
      </Card>
    </>
  )
}

function Code({ children }) {
  return <code className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[13px] text-ink">{children}</code>
}

function Var({ children }) {
  return <span className="rounded bg-cardio-soft px-1.5 py-0.5 text-[13px] font-medium text-cardio">{children}</span>
}
