import { useEffect, useState } from 'react'

/** Re-renders every `interval` ms while `active`, returning the current timestamp. */
export function useNow(active = true, interval = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [active, interval])
  return now
}
