import { useEffect, useRef, useState } from 'react'

export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 600, className = '' }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const rafRef = useRef(null)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    if (from === to) return

    const start = performance.now()

    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(from + (to - from) * eased)
      setDisplay(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevRef.current = to
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, duration])

  const formatted = Math.abs(display).toLocaleString('en-IN')
  const isNeg = display < 0

  return (
    <span className={className}>
      {prefix}{isNeg ? '-' : ''}{suffix}{formatted}
    </span>
  )
}
