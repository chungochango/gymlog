import { useId, useState } from 'react'
import { formatDate, formatNumber } from '../lib/format'

const W = 320
const H = 140
const PAD = { top: 16, right: 12, bottom: 22, left: 12 }

/** Minimal SVG line chart of max weight per session. */
export default function ProgressChart({ points }) {
  const [hover, setHover] = useState(null)
  const gradientId = `chart-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  if (points.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">Aún no hay datos para este ejercicio.</p>
  }

  const weights = points.map((p) => p.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const span = max - min || 1
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const xy = points.map((p, i) => ({
    ...p,
    x: PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW),
    // A flat series sits in the middle instead of on the baseline.
    y: max === min ? PAD.top + innerH / 2 : PAD.top + innerH - ((p.weight - min) / span) * innerH,
  }))

  const line = xy.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${xy.at(-1).x},${PAD.top + innerH} L${xy[0].x},${PAD.top + innerH} Z`
  const active = hover !== null ? xy[hover] : xy.at(-1)

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <span className="text-3xl font-bold tabular tracking-tight">{formatNumber(active.weight)}</span>
          <span className="ml-1 text-sm text-muted">kg{active.reps != null && ` × ${active.reps}`}</span>
        </div>
        <span className="text-xs text-faint">{formatDate(active.date)}</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto touch-none select-none"
        role="img"
        aria-label={`Evolución: de ${formatNumber(points[0].weight)} a ${formatNumber(points.at(-1).weight)} kg`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * W
          let nearest = 0
          xy.forEach((p, i) => {
            if (Math.abs(p.x - x) < Math.abs(xy[nearest].x - x)) nearest = i
          })
          setHover(nearest)
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="var(--color-line)" />
        {points.length > 1 && <path d={area} fill={`url(#${gradientId})`} />}
        <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {xy.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p === active ? 5 : 3}
            fill={p === active ? 'var(--color-accent)' : 'var(--color-surface)'}
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
        ))}
        <text x={PAD.left} y={H - 4} fontSize="10" fill="var(--color-faint)">{formatDate(points[0].date, { day: 'numeric', month: 'short' })}</text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 4} fontSize="10" fill="var(--color-faint)" textAnchor="end">
            {formatDate(points.at(-1).date, { day: 'numeric', month: 'short' })}
          </text>
        )}
      </svg>
    </div>
  )
}
