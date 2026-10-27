import { useEffect, useRef, useState } from 'react'
import { Loader2, ScanBarcode } from 'lucide-react'
import { fetchProduct, forGrams } from '../lib/openfoodfacts'
import { formatNumber, parseNum } from '../lib/format'
import Modal from './Modal'
import { Button, Input } from './ui'

/**
 * Scans a food barcode with the camera, looks it up in Open Food Facts and returns
 * { name, kcal, protein, carbs, fat } for the chosen amount through onPick.
 */
export default function BarcodeScanner({ onPick, onClose }) {
  const videoRef = useRef(null)
  const [status, setStatus] = useState('scanning') // scanning | loading | found | notfound | error
  const [message, setMessage] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [product, setProduct] = useState(null)
  const [grams, setGrams] = useState('100')

  const lookup = async (code) => {
    setStatus('loading')
    try {
      const p = await fetchProduct(code)
      if (!p) {
        setStatus('notfound')
        setMessage(`El código ${code} no está en Open Food Facts. Añádelo a mano.`)
        return
      }
      setProduct(p)
      setGrams(String(p.serving ?? 100))
      setStatus('found')
    } catch {
      setStatus('error')
      setMessage('No se pudo consultar la base de datos. ¿Tienes conexión?')
    }
  }

  useEffect(() => {
    if (status !== 'scanning') return
    let controls
    let cancelled = false
    // The reader is loaded on demand so it doesn't weigh on the main bundle.
    import('@zxing/browser')
      .then(({ BrowserMultiFormatOneDReader }) =>
        new BrowserMultiFormatOneDReader().decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result, _err, ctrl) => {
            if (!result || cancelled) return
            cancelled = true
            ctrl.stop()
            lookup(result.getText())
          },
        ),
      )
      .then((c) => {
        controls = c
        if (cancelled) c.stop()
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
        setMessage('No se pudo abrir la cámara. Permite el acceso o escribe el código a mano.')
      })
    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [status])

  const g = parseNum(grams) ?? 0
  const values = product && forGrams(product, g)

  return (
    <Modal open onClose={onClose} title="Escanear código de barras">
      {status === 'scanning' && (
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-accent/80" />
          <p className="absolute inset-x-0 bottom-2 text-center text-xs text-white/80">Apunta al código de barras del envase</p>
        </div>
      )}

      {status === 'loading' && (
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
          <Loader2 size={18} className="animate-spin" /> Buscando producto…
        </p>
      )}

      {status === 'found' && product && (
        <div>
          <p className="font-semibold">{product.name}</p>
          {product.brand && <p className="text-sm text-muted">{product.brand}</p>}
          <p className="mt-1 text-xs text-faint tabular">
            Por 100 g: {formatNumber(Math.round(product.per100.kcal))} kcal · P {formatNumber(product.per100.protein)} · C{' '}
            {formatNumber(product.per100.carbs)} · G {formatNumber(product.per100.fat)}
          </p>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-muted">Cantidad (g)</span>
            <Input inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value.replace(/[^\d.,]/g, ''))} />
          </label>
          <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-surface-2 p-3 text-center text-sm tabular">
            <Macro label="kcal" value={values.kcal} />
            <Macro label="Prot." value={values.protein} />
            <Macro label="Carb." value={values.carbs} />
            <Macro label="Grasa" value={values.fat} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={() => setStatus('scanning')}>Escanear otro</Button>
            <Button
              variant="primary"
              disabled={!g}
              onClick={() => {
                onPick({ name: `${product.name} ${formatNumber(g)} g`, ...values })
                onClose()
              }}
            >
              Usar
            </Button>
          </div>
        </div>
      )}

      {(status === 'notfound' || status === 'error') && (
        <div className="py-2">
          <p className="text-sm text-danger">{message}</p>
          <Button className="mt-3 w-full" onClick={() => setStatus('scanning')}>
            <ScanBarcode size={16} /> Volver a escanear
          </Button>
        </div>
      )}

      {status !== 'found' && status !== 'loading' && (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const code = manualCode.replace(/\D/g, '')
            if (code.length >= 8) lookup(code)
          }}
        >
          <Input
            inputMode="numeric"
            placeholder="O escribe el código: 8410000000000"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
          />
          <Button type="submit" variant="secondary" className="h-12 shrink-0">Buscar</Button>
        </form>
      )}
      <p className="mt-3 text-[11px] text-faint">Datos de Open Food Facts, base de datos libre y colaborativa.</p>
    </Modal>
  )
}

function Macro({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-faint">{label}</p>
      <p className="font-semibold">{formatNumber(value)}</p>
    </div>
  )
}
