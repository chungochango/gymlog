let audioCtx = null

/** Must be called from a user gesture so the browser allows audio later. */
export function primeAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    audioCtx ??= new Ctx()
    if (audioCtx.state === 'suspended') audioCtx.resume()
  } catch {
    audioCtx = null
  }
}

export function beep() {
  if (!audioCtx) return
  const now = audioCtx.currentTime
  ;[0, 0.22, 0.44].forEach((offset, i) => {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = i === 2 ? 1320 : 880
    gain.gain.setValueAtTime(0.0001, now + offset)
    gain.gain.exponentialRampToValueAtTime(0.3, now + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18)
    osc.connect(gain).connect(audioCtx.destination)
    osc.start(now + offset)
    osc.stop(now + offset + 0.2)
  })
}

export function vibrate(pattern = [200, 100, 200]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Not supported (iOS Safari): silently ignore.
  }
}
