export const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core']

const seed = {
  Pecho: ['Press banca', 'Press inclinado con mancuernas', 'Aperturas con mancuernas', 'Cruce de poleas', 'Fondos en paralelas', 'Flexiones'],
  Espalda: ['Dominadas', 'Remo con barra', 'Jalón al pecho', 'Remo con mancuerna', 'Remo en polea baja', 'Peso muerto'],
  Piernas: ['Sentadilla', 'Prensa', 'Peso muerto rumano', 'Zancadas', 'Extensión de cuádriceps', 'Curl femoral', 'Elevación de gemelos'],
  Hombros: ['Press militar', 'Press con mancuernas sentado', 'Elevaciones laterales', 'Pájaros', 'Face pull'],
  'Bíceps': ['Curl con barra', 'Curl con mancuernas', 'Curl martillo', 'Curl en banco Scott'],
  'Tríceps': ['Press francés', 'Extensión en polea', 'Press cerrado', 'Extensión sobre la cabeza'],
  Core: ['Plancha', 'Crunch en polea', 'Elevación de piernas colgado', 'Rueda abdominal'],
}

const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')

export const DEFAULT_EXERCISES = Object.entries(seed).flatMap(([muscle, names]) =>
  names.map((name) => ({ id: `ex-${slug(name)}`, name, muscle, custom: false })),
)

export const DEFAULT_ROUTINES = [
  {
    id: 'rt-push',
    name: 'Empuje',
    builtIn: true,
    exerciseIds: ['ex-press-banca', 'ex-press-inclinado-con-mancuernas', 'ex-press-militar', 'ex-elevaciones-laterales', 'ex-extension-en-polea'],
  },
  {
    id: 'rt-pull',
    name: 'Tirón',
    builtIn: true,
    exerciseIds: ['ex-dominadas', 'ex-remo-con-barra', 'ex-jalon-al-pecho', 'ex-face-pull', 'ex-curl-con-barra'],
  },
  {
    id: 'rt-legs',
    name: 'Pierna',
    builtIn: true,
    exerciseIds: ['ex-sentadilla', 'ex-peso-muerto-rumano', 'ex-prensa', 'ex-curl-femoral', 'ex-elevacion-de-gemelos'],
  },
]

export const DEFAULT_SETTINGS = {
  restSeconds: 90,
  vibrate: true,
  sound: true,
  bodyWeight: 75,
  goals: { kcal: 2200, protein: 140, carbs: 250, fat: 70 },
}

export const REST_PRESETS = [30, 60, 90, 120, 180, 240]
