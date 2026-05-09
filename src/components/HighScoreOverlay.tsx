import { useEffect, useRef, useState } from "react"
import { Trophy } from "@phosphor-icons/react"

interface HighScoreOverlayProps {
  visible: boolean
  score: number
  onDismiss: () => void
}

const CONFETTI_COLORS = [
  "oklch(0.63 0.26 25)",
  "oklch(0.75 0.18 55)",
  "oklch(0.88 0.17 90)",
  "oklch(0.72 0.19 145)",
  "oklch(0.55 0.22 260)",
  "oklch(0.55 0.22 300)",
  "oklch(0.7 0.2 350)",
]

const PARTICLE_COUNT = 50

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  width: number
  height: number
  color: string
  isCircle: boolean
  opacity: number
}

function createParticles(canvasWidth: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * canvasWidth,
    y: -20 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 3,
    vy: Math.random() * 2 + 2,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    width: Math.random() * 8 + 4,
    height: Math.random() * 8 + 4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    isCircle: Math.random() > 0.5,
    opacity: 1,
  }))
}

export default function HighScoreOverlay({
  visible,
  score,
  onDismiss,
}: HighScoreOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const [reducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )

  useEffect(() => {
    if (!visible || reducedMotion) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    particlesRef.current = createParticles(canvas.width)

    const gravity = 0.12
    const drift = 0.02

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particlesRef.current) {
        p.vy += gravity
        p.vx += (Math.random() - 0.5) * drift
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed
        if (p.y > canvas.height * 0.7) {
          p.opacity = Math.max(
            0,
            1 - (p.y - canvas.height * 0.7) / (canvas.height * 0.3),
          )
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        if (p.isCircle) {
          ctx.beginPath()
          ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
        }
        ctx.restore()
      }
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [visible, reducedMotion])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black/15 backdrop-blur-[1px]"
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onDismiss()
      }}
      role="button"
      tabIndex={0}
      aria-label="Novo recorde — toque para continuar"
    >
      {!reducedMotion && (
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />
      )}
      <Trophy
        weight="duotone"
        size={128}
        color="var(--color-crayon-yellow)"
        aria-hidden="true"
        className="drop-shadow-[0_4px_18px_rgba(0,0,0,0.2)] motion-safe:animate-[celebration-pulse_0.6s_ease-in-out_infinite_alternate]"
      />
      <h2
        className="text-puffy text-4xl sm:text-5xl"
        style={{ color: "var(--color-crayon-orange)" }}
      >
        Novo recorde!
      </h2>
      <p
        className="text-puffy-sm text-2xl sm:text-3xl"
        style={{ color: "var(--color-crayon-pink)" }}
      >
        {score} coelhos!
      </p>
      <style>{`
        @keyframes celebration-pulse {
          from { transform: scale(1); }
          to { transform: scale(1.18); }
        }
      `}</style>
    </div>
  )
}
