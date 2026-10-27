import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { MACROS } from '../data/nutrition'
import { formatNumber, parseNum } from '../lib/format'
import { ACTIVITY_LEVELS, DEFICITS, baseBurn } from '../lib/metabolism'
import Modal from './Modal'
import { Button, Input, cn } from './ui'

const onlyNum = (e) => e.target.value.replace(/[^\d.,]/g, '')
const strOrEmpty = (v) => (v != null ? String(v) : '')

/** Body profile (for the BMR) and daily nutrition goals. Rendered only while open. */
export default function GoalsForm({ onClose }) {
  const { state, actions } = useApp()
  const { goals, bodyWeight } = state.settings
  const saved = state.settings.profile ?? {}
  const [weight, setWeight] = useState(String(bodyWeight))
  const [weeklyGoal, setWeeklyGoal] = useState(state.settings.weeklyGoal ?? 3)
  const [profile, setProfile] = useState({
    sex: saved.sex ?? null,
    age: strOrEmpty(saved.age),
    height: strOrEmpty(saved.height),
    activity: saved.activity ?? 'sedentary',
  })
  const [values, setValues] = useState({
    kcal: String(goals.kcal),
    protein: String(goals.protein),
    carbs: String(goals.carbs),
    fat: String(goals.fat),
  })

  const w = parseNum(weight) ?? 0
  const profileOut = { ...profile, age: parseNum(profile.age), height: parseNum(profile.height) }
  const burn = baseBurn({ bodyWeight: w, profile: profileOut })
  const kcalGoal = parseNum(values.kcal) ?? 0
  const macroKcal = Math.round(
    (parseNum(values.protein) ?? 0) * 4 + (parseNum(values.carbs) ?? 0) * 4 + (parseNum(values.fat) ?? 0) * 9,
  )
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: onlyNum(e) }))
  const setP = (key) => (e) => setProfile((p) => ({ ...p, [key]: onlyNum(e) }))

  const save = () => {
    actions.updateSettings({
      bodyWeight: w || bodyWeight,
      weeklyGoal,
      profile: profileOut,
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
      <div className="grid grid-cols-2 gap-1.5">
        {[['male', 'Hombre'], ['female', 'Mujer']].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setProfile((p) => ({ ...p, sex: id }))}
            className={cn(
              'h-11 rounded-xl text-sm font-semibold transition-colors',
              profile.sex === id ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Peso (kg)</span>
          <Input inputMode="decimal" value={weight} onChange={(e) => setWeight(onlyNum(e))} className="px-3 text-center" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Altura (cm)</span>
          <Input inputMode="numeric" value={profile.height} onChange={setP('height')} placeholder="175" className="px-3 text-center" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-muted">Edad</span>
          <Input inputMode="numeric" value={profile.age} onChange={setP('age')} placeholder="25" className="px-3 text-center" />
        </label>
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-sm font-medium text-muted">Tu día a día (sin contar entrenos)</span>
        <div className="space-y-1.5">
          {ACTIVITY_LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setProfile((p) => ({ ...p, activity: l.id }))}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                profile.activity === l.id ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2',
              )}
            >
              <span className="font-semibold">{l.name}</span>
              <span className="text-xs text-faint">{l.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {burn ? (
        <div className="mt-4 rounded-xl bg-surface-2 p-3 text-sm tabular">
          <div className="flex justify-between"><span className="text-muted">Metabolismo basal (TMB)</span><span className="font-semibold">{formatNumber(burn.basal)} kcal</span></div>
          <div className="mt-1 flex justify-between"><span className="text-muted">Gasto diario sin ejercicio</span><span className="font-semibold">{formatNumber(burn.total)} kcal</span></div>
          <p className="mt-2 text-xs text-faint">Lo que quemas en el día sin hacer nada especial. El ejercicio que registres se suma aparte.</p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-faint">Rellena sexo, altura y edad para calcular tu metabolismo basal.</p>
      )}

      <div className="mt-5">
        <span className="mb-1.5 block text-sm font-medium text-muted">Objetivo semanal (sesiones de fuerza + cardio)</span>
        <div className="grid grid-cols-6 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setWeeklyGoal(n)}
              className={cn(
                'h-11 rounded-xl text-sm font-semibold tabular transition-colors',
                weeklyGoal === n ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted',
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="mt-1.5 block text-xs text-faint">Cumplirlo cada semana mantiene tu racha.</span>
      </div>

      <div className="my-5 h-px bg-line" />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-muted">Calorías que quieres comer al día (kcal)</span>
        <Input inputMode="numeric" value={values.kcal} onChange={set('kcal')} />
      </label>
      {burn && (
        <>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {DEFICITS.map((d) => {
              const target = burn.total - d.kcal
              return (
                <button
                  key={d.kcal}
                  type="button"
                  onClick={() => setValues((v) => ({ ...v, kcal: String(target) }))}
                  className={cn(
                    'rounded-xl px-1 py-2 text-center transition-colors',
                    kcalGoal === target ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted',
                  )}
                >
                  <span className="block text-[11px] leading-tight">{d.name}</span>
                  <span className="block text-sm font-semibold tabular">{formatNumber(target)}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-xs text-faint tabular">
            {kcalGoal > 0 && kcalGoal < burn.total
              ? `Con ${formatNumber(kcalGoal)} kcal tendrás un déficit de ${formatNumber(burn.total - kcalGoal)} kcal al día (≈ ${formatNumber(Math.round(((burn.total - kcalGoal) * 7) / 7700 * 10) / 10)} kg de grasa por semana), más lo que quemes entrenando.`
              : 'Toca una opción para calcular tu objetivo a partir de tu gasto.'}
          </p>
        </>
      )}

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
