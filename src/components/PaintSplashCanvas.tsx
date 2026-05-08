import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

export interface PaintSplashRef {
  triggerSplash: (x: number, y: number, color: string) => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
  life: number
  maxLife: number
}

const GRAVITY = 0.15
const FRICTION = 0.96
const PARTICLE_MIN = 12
const PARTICLE_MAX = 18
const DURATION_MS = 600

function spawnParticles(x: number, y: number, color: string): Particle[] {
  const count =
    PARTICLE_MIN + Math.floor(Math.random() * (PARTICLE_MAX - PARTICLE_MIN + 1))
  const particles: Particle[] = []

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 5
    const radius = 4 + Math.random() * 6
    const life = DURATION_MS + (Math.random() - 0.5) * 100

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      color,
      alpha: 1,
      life,
      maxLife: life,
    })
  }

  return particles
}

const PaintSplashCanvas = forwardRef<PaintSplashRef>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const prefersReducedMotion = useRef(false)
  const [pulse, setPulse] = useState<{
    x: number
    y: number
    color: string
    id: number
  } | null>(null)
  const pulseIdRef = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    prefersReducedMotion.current = mq.matches
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 16.67 : 1
    lastTimeRef.current = time

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const particles = particlesRef.current

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]

      p.vx *= FRICTION
      p.vy *= FRICTION
      p.vy += GRAVITY * dt

      p.x += p.vx * dt
      p.y += p.vy * dt

      p.life -= 16.67 * dt
      const progress = 1 - p.life / p.maxLife
      p.alpha = Math.max(0, 1 - progress)
      const currentRadius = p.radius * (1 - progress * 0.6)

      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0, currentRadius), 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.alpha
      ctx.fill()

      if (p.life <= 0) {
        particles.splice(i, 1)
      }
    }

    ctx.globalAlpha = 1

    if (particles.length > 0) {
      rafRef.current = requestAnimationFrame(animate)
    } else {
      rafRef.current = null
      lastTimeRef.current = 0
    }
  }, [])

  const startLoop = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [animate])

  const triggerSplash = useCallback(
    (x: number, y: number, color: string) => {
      if (prefersReducedMotion.current) {
        pulseIdRef.current += 1
        setPulse({ x, y, color, id: pulseIdRef.current })
        setTimeout(() => setPulse(null), 400)
        return
      }

      const newParticles = spawnParticles(x, y, color)
      particlesRef.current.push(...newParticles)
      startLoop()
    },
    [startLoop],
  )

  useImperativeHandle(ref, () => ({ triggerSplash }), [triggerSplash])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-40"
        aria-hidden="true"
      />
      {pulse && (
        <span
          key={pulse.id}
          className="pointer-events-none fixed z-40 animate-[splash-pulse_400ms_ease-out_forwards] rounded-full"
          style={{
            left: pulse.x - 16,
            top: pulse.y - 16,
            width: 32,
            height: 32,
            backgroundColor: pulse.color,
            opacity: 0.7,
          }}
        />
      )}
    </>
  )
})

PaintSplashCanvas.displayName = "PaintSplashCanvas"

export default PaintSplashCanvas
