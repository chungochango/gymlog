import { useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDate } from '../lib/format'
import { shareReport, weekStart, weeklyFileName, weeklyReport } from '../lib/report'
import { Button, Card, cn } from './ui'

/** Picks a Monday–Sunday week and sends its full report to Claude. */
export default function WeeklyReportCard({ className }) {
  const { state, exerciseById } = useApp()
  const [offset, setOffset] = useState(0) // 0 = this week, -1 = last week…
  const [sent, setSent] = useState(null)

  const start = weekStart(offset)
  const end = weekStart(offset + 1) - 1
  const count = [...state.workouts, ...state.cardio].filter((x) => x.startedAt >= start && x.startedAt <= end).length
  const label = offset === 0 ? 'Esta semana' : offset === -1 ? 'Semana pasada' : 'Semana'
  const range = `${formatDate(start, { day: 'numeric', month: 'short' })} – ${formatDate(end, { day: 'numeric', month: 'short' })}`

  const send = async () => setSent(await shareReport(weeklyReport(state, exerciseById, start), weeklyFileName(start)))
  const move = (d) => {
    setOffset((o) => Math.min(0, o + d))
    setSent(null)
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center gap-2">
        <CalendarRange size={18} className="shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Resumen semanal</p>
          <p className="text-xs text-muted tabular">{label} · {range} · {count} {count === 1 ? 'sesión' : 'sesiones'}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Semana anterior" onClick={() => move(-1)}>
          <ChevronLeft size={20} />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Semana siguiente" disabled={offset === 0} onClick={() => move(1)}>
          <ChevronRight size={20} />
        </Button>
      </div>
      <Button variant="primary" className="mt-3 w-full" disabled={!count} onClick={send}>
        <Send size={16} /> Enviar la semana a Claude
      </Button>
      {sent && sent !== 'cancelled' && (
        <p className="mt-2 text-xs text-muted">
          {sent === 'shared' ? 'Listo.' : 'Informe descargado.'} En el ordenador dile a Claude «analiza la semana».
        </p>
      )}
    </Card>
  )
}
