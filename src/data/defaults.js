export const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core']

// [id, name]: ids stay fixed so renaming never breaks history or routines.
const seed = {
  Pecho: [
    ['press-banca', 'Press de banca con barra'],
    ['press-inclinado-con-mancuernas', 'Press inclinado con mancuernas'],
    ['aperturas-con-mancuernas', 'Aperturas con mancuernas'],
    ['cruce-de-poleas', 'Cruce de poleas'],
    ['fondos-en-paralelas', 'Fondos en paralelas'],
    ['flexiones', 'Flexiones'],
  ],
  Espalda: [
    ['dominadas', 'Dominadas'],
    ['remo-con-barra', 'Remo con barra'],
    ['jalon-al-pecho', 'Jalón al pecho'],
    ['remo-con-mancuerna', 'Remo con mancuerna a una mano'],
    ['remo-en-polea-baja', 'Remo sentado en polea baja'],
    ['peso-muerto', 'Peso muerto'],
  ],
  Piernas: [
    ['sentadilla', 'Sentadilla con barra'],
    ['prensa', 'Prensa de piernas'],
    ['peso-muerto-rumano', 'Peso muerto rumano'],
    ['zancadas', 'Zancadas'],
    ['extension-de-cuadriceps', 'Extensión de cuádriceps en máquina'],
    ['curl-femoral', 'Curl femoral en máquina'],
    ['elevacion-de-gemelos', 'Elevación de gemelos'],
  ],
  Hombros: [
    ['press-militar', 'Press militar con barra'],
    ['press-con-mancuernas-sentado', 'Press de hombros con mancuernas'],
    ['elevaciones-laterales', 'Elevaciones laterales'],
    ['pajaros', 'Elevaciones posteriores con mancuernas'],
    ['face-pull', 'Face pull en polea (tirón a la cara)'],
  ],
  'Bíceps': [
    ['curl-con-barra', 'Curl con barra'],
    ['curl-con-mancuernas', 'Curl con mancuernas'],
    ['curl-martillo', 'Curl martillo'],
    ['curl-en-banco-scott', 'Curl en banco Scott'],
  ],
  'Tríceps': [
    ['press-frances', 'Press francés con barra Z'],
    ['extension-en-polea', 'Extensión de tríceps en polea'],
    ['press-cerrado', 'Press de banca con agarre cerrado'],
    ['extension-sobre-la-cabeza', 'Extensión de tríceps tras nuca'],
  ],
  Core: [
    ['plancha', 'Plancha abdominal'],
    ['crunch-en-polea', 'Crunch abdominal en polea'],
    ['elevacion-de-piernas-colgado', 'Elevación de piernas colgado'],
    ['rueda-abdominal', 'Rueda abdominal'],
  ],
}

export const DEFAULT_EXERCISES = Object.entries(seed).flatMap(([muscle, names]) =>
  names.map(([id, name]) => ({ id: `ex-${id}`, name, muscle, custom: false })),
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
  weeklyGoal: 3, // sessions (strength + cardio) per week, drives the streak
  goals: { kcal: 2200, protein: 140, carbs: 250, fat: 70 },
  profile: { sex: null, age: null, height: null, activity: 'sedentary' }, // for the BMR
}

export const REST_PRESETS = [30, 60, 90, 120, 180, 240]
