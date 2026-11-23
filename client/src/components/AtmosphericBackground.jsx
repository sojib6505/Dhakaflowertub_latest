import { useEffect, useState } from 'react'

export default function AtmosphericBackground() {
  const [scrollY, setScrollY] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }

    const handleMouseMove = (e) => {
      // Normalize mouse between -0.5 and 0.5
      const x = (e.clientX / window.innerWidth) - 0.5
      const y = (e.clientY / window.innerHeight) - 0.5
      setMousePos({ x, y })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Parallax offsets
  const parallaxFog1 = scrollY * 0.08
  const parallaxFog2 = scrollY * 0.04
  const mouseX = mousePos.x * 20
  const mouseY = mousePos.y * 15

  return (
    <div className="atmospheric-canvas" aria-hidden="true">
      {/* Base ambient gradient */}
      <div className="atmospheric-base" />

      {/* Layer 1: Deep ambient botanical mist */}
      <div
        className="mist-layer mist-deep"
        style={{
          transform: `translate3d(${mouseX * -0.5}px, ${mouseY * -0.5 - parallaxFog2}px, 0)`
        }}
      />

      {/* Layer 2: Drifting cloud fog with soft radial masking */}
      <div
        className="mist-layer mist-drifting"
        style={{
          transform: `translate3d(${mouseX * 0.8}px, ${mouseY * 0.8 - parallaxFog1}px, 0)`
        }}
      />

      {/* Layer 3: Organic floating accent aura */}
      <div
        className="organic-aura aura-top-right"
        style={{
          transform: `translate3d(${mouseX * -1.2}px, ${mouseY * -1.2 - parallaxFog2 * 0.8}px, 0)`
        }}
      />
      <div
        className="organic-aura aura-bottom-left"
        style={{
          transform: `translate3d(${mouseX * 1.4}px, ${mouseY * 1.4 - parallaxFog1 * 0.5}px, 0)`
        }}
      />

      {/* Layer 4: Floating botanical micro-elements / glowing spores */}
      <div className="floating-particles">
        <span className="particle p-1" style={{ transform: `translate3d(${mouseX * 2}px, ${mouseY * 1.5 - scrollY * 0.12}px, 0)` }} />
        <span className="particle p-2" style={{ transform: `translate3d(${mouseX * -1.8}px, ${mouseY * -1.2 - scrollY * 0.09}px, 0)` }} />
        <span className="particle p-3" style={{ transform: `translate3d(${mouseX * 1.2}px, ${mouseY * 2 - scrollY * 0.15}px, 0)` }} />
        <span className="particle p-4" style={{ transform: `translate3d(${mouseX * -2.2}px, ${mouseY * 1.8 - scrollY * 0.06}px, 0)` }} />
        <span className="particle p-5" style={{ transform: `translate3d(${mouseX * 0.9}px, ${mouseY * -1.6 - scrollY * 0.11}px, 0)` }} />
      </div>

      {/* Layer 5: Fine subtle architectural grid line accents */}
      <div className="ambient-grid-overlay" />
    </div>
  )
}
