# GymLog

Registro de entrenamientos de gimnasio (pesos, series, repeticiones, descansos), cardio y deportes (pádel, bici, correr…) y nutrición diaria (calorías y macros).
React 19 + Vite + Tailwind CSS v4 + Lucide. Los datos se guardan en `localStorage` (sin backend).

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # versión de producción en dist/
```

Para probarlo en el móvil dentro de la misma red Wi‑Fi: `npm run dev -- --host` y abre la IP que muestra Vite.

## Publicación (GitHub Pages, gratis)

Cada `git push` a `main` compila y publica la app con `.github/workflows/deploy.yml`.
En el repositorio de GitHub: **Settings → Pages → Source: GitHub Actions** (solo la primera vez).
La app queda en `https://<usuario>.github.io/<repositorio>/`. En el iPhone: Safari → Compartir → Añadir a pantalla de inicio.
Funciona sin conexión gracias a `public/sw.js`, y las rutas usan `#/` para no depender del servidor.

## Apple Watch

Las apps web no pueden leer HealthKit, así que los datos llegan con el Atajo «GymLog Salud»
(guía paso a paso dentro de la app: Ajustes → Apple Watch). La app abre el Atajo con la ventana
de tiempo de la sesión; el Atajo lee Frecuencia cardíaca y Energía activa de Salud y copia
`GYMLOG;media;máx;kcal` al portapapeles; en la app se pulsa «Pegar datos».

## Estructura

```
src/
├── main.jsx                 # Router + proveedor de estado
├── App.jsx                  # Rutas
├── index.css                # Tema Tailwind (tokens de color, animaciones, utilidades móviles)
├── context/
│   ├── store.js             # Reducer puro: todas las acciones sobre el estado
│   └── AppContext.jsx       # Provider, persistencia por slice en localStorage, API de acciones
├── data/
│   ├── defaults.js          # Ejercicios, rutinas y ajustes iniciales
│   ├── activities.js        # Actividades de cardio, METs y estimación de calorías
│   └── nutrition.js         # Comidas del día, macros y sumas
├── lib/
│   ├── storage.js           # Lectura/escritura segura de localStorage
│   ├── stats.js             # Volumen, mejores series, historial de peso máximo, resumen semanal
│   ├── format.js            # Fechas, duraciones, números en es-ES, parseo "62,5"
│   └── alerts.js            # Pitido (Web Audio) y vibración al terminar el descanso
├── lib/watch.js             # Enlace al Atajo y lectura de sus datos (Apple Watch)
├── hooks/useNow.js          # Reloj que re-renderiza cada segundo (cronómetros)
├── components/
│   ├── Layout.jsx           # Contenedor + barra de navegación inferior
│   ├── RestTimer.jsx        # Cuenta atrás de descanso flotante (±15 s, saltar)
│   ├── ExerciseCard.jsx     # Tabla de series de un ejercicio en la sesión
│   ├── ExercisePicker.jsx   # Selector múltiple con búsqueda y filtro por músculo
│   ├── ProgressChart.jsx    # Gráfica SVG de peso máximo por sesión
│   ├── CardioForm.jsx, CardioCard.jsx   # Registrar / mostrar cardio
│   ├── FoodForm.jsx, GoalsForm.jsx      # Añadir alimentos / objetivos y peso
│   ├── WatchImport.jsx      # Tarjeta Apple Watch: importar con Atajos, pegar o a mano
│   ├── WorkoutCard.jsx, SettingsModal.jsx, Modal.jsx, ui.jsx
└── pages/
    ├── Dashboard.jsx        # Resumen, semana, estadísticas, última sesión
    ├── StartWorkout.jsx     # Entrenamiento libre o rutina; crear rutinas
    ├── Workout.jsx          # Sesión en vivo
    ├── Exercises.jsx        # Biblioteca por grupo muscular; ejercicios propios
    ├── WatchGuide.jsx       # Guía para crear el Atajo y probarlo
    ├── Nutrition.jsx        # Diario de comidas, calorías restantes y macros
    ├── History.jsx          # Historial de fuerza y cardio por meses + gráfica de progreso
    └── WorkoutDetail.jsx    # Detalle de una sesión, récords, guardar como rutina
```

## Cómo funciona

- **Sesión en vivo**: la sesión activa se guarda en cada cambio, así que recargar o cerrar la pestaña no la pierde.
  Al marcar una serie arranca el descanso del ejercicio (configurable por ejercicio, por defecto el de Ajustes).
  La columna «Anterior» muestra lo que hiciste la última vez; tócala para copiar esos valores, o marca la serie vacía y se rellena sola.
- **Descanso**: se guarda como hora de fin absoluta, por lo que sigue contando aunque cambies de pantalla.
  Al terminar vibra (Android) y suena un pitido (activable en Ajustes).
- **Al finalizar** solo se guardan las series marcadas; los ejercicios sin series completadas se descartan.
- **Cardio**: si no indicas calorías se estiman con MET × intensidad × peso corporal × horas.
- **Nutrición**: calorías restantes = objetivo − comidas + calorías del cardio de ese día. Si no pones calorías a un alimento se calculan con los macros (4/4/9).
- **Entrenador**: sugiere el peso de hoy con doble progresión (6–10 reps, luego sube 2,5 kg o 5 kg en pierna) y avisa tras 3 sesiones sin mejorar el 1RM estimado (Epley). `src/lib/coach.js`
- **Recuperación muscular**: colorea cada grupo según las horas desde su última serie (< 24 h, 24–48 h, > 48 h) y sugiere qué entrenar. `src/lib/recovery.js`
- **Logros y racha**: medallas calculadas a partir de los datos, racha de semanas cumpliendo el objetivo semanal y resumen mensual/anual. `src/lib/achievements.js`
- **Escáner**: códigos de barras con la cámara (ZXing, cargado bajo demanda) y nutrición de Open Food Facts. `src/lib/openfoodfacts.js`
- **Datos**: claves `gymlog:v1:*` en `localStorage`. Ajustes → Copia de seguridad permite exportar e importar todo en un JSON (hazlo antes de cambiar de dirección o de móvil).
