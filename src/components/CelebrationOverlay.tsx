import { useEffect, useRef, useState, useCallback } from "react"

type Milestone = "none" | "half" | "three-quarters" | "complete"

interface CelebrationOverlayProps {
  milestone: Milestone
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

const MILESTONE_EMOJI: Record<Exclude<Milestone, "none">, string> = {
  half: "⭐",
  "three-quarters": "🌟",
  complete: "🎉",
}

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

export default function CelebrationOverlay({ milestone, onDismiss }: CelebrationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const [reducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )

  const handleDismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  useEffect(() => {
    if (milestone === "none") return
    if (reducedMotion) return

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

        // Fade out as particles reach bottom third
        if (p.y > canvas.height * 0.7) {
          p.opacity = Math.max(0, 1 - (p.y - canvas.height * 0.7) / (canvas.height * 0.3))
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
  }, [milestone, reducedMotion])

  if (milestone === "none") return null

  const emoji = MILESTONE_EMOJI[milestone]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      onClick={handleDismiss}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleDismiss()
      }}
      role="button"
      tabIndex={0}
      aria-label="Celebration! Tap to dismiss"
    >
      {!reducedMotion && (
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      )}
      <span
        className="text-7xl select-none animate-[celebration-pulse_0.6s_ease-in-out_infinite_alternate]"
        aria-hidden="true"
      >
        {emoji}
      </span>
      <style>{`
        @keyframes celebration-pulse {
          from { transform: scale(1); }
          to { transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
