import { useEffect, useRef, useCallback } from 'react'

/**
 * AnimatedBackground — A dreamy, magical floating particle canvas for toddlers (ages 2-5).
 *
 * Design decisions for young children:
 * - Soft pastel colors only so particles never compete with coloring content
 * - Slow, gentle movement to avoid overstimulation or motion sickness
 * - Respects prefers-reduced-motion for accessibility
 * - pointer-events: none ensures no accidental interaction
 * - Limited particle count (~20-30) for mobile performance
 */

type Density = 'low' | 'medium' | 'high'

interface AnimatedBackgroundProps {
  /** Controls number of floating particles. Default: 'medium' */
  density?: Density
}

// Emoji shapes that feel magical and safe for toddlers
const PARTICLE_EMOJIS = ['⭐', '🫧', '❤️', '✨'] as const

// Soft pastel colors that won't compete with coloring content
const PASTEL_COLORS = [
  'rgba(255, 182, 193, 0.6)', // soft pink
  'rgba(173, 216, 230, 0.6)', // light blue
  'rgba(255, 218, 185, 0.6)', // peach
  'rgba(221, 160, 221, 0.6)', // plum
  'rgba(176, 224, 230, 0.6)', // powder blue
  'rgba(255, 253, 208, 0.6)', // cream yellow
  'rgba(200, 230, 201, 0.6)', // mint green
] as const

const DENSITY_MAP: Record<Density, number> = {
  low: 12,
  medium: 22,
  high: 30,
}

interface Particle {
  x: number
  y: number
  emoji: string
  size: number
  speed: number
  swayAmplitude: number
  swayFrequency: number
  rotation: number
  rotationSpeed: number
  opacity: number
  opacityDirection: number
  opacityMin: number
  opacityMax: number
  phase: number // offset for sine wave so particles don't all sway in sync
  color: string
}

function createParticle(canvasWidth: number, canvasHeight: number, startAtBottom = false): Particle {
  const emoji = PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)]
  const color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)]

  return {
    x: Math.random() * canvasWidth,
    y: startAtBottom
      ? canvasHeight + Math.random() * 60
      : Math.random() * canvasHeight,
    emoji,
    size: 16 + Math.random() * 14, // 16-30px — large enough for toddlers to notice
    speed: 0.3 + Math.random() * 0.5, // slow upward drift
    swayAmplitude: 15 + Math.random() * 25, // gentle side-to-side
    swayFrequency: 0.005 + Math.random() * 0.01, // slow oscillation
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.01, // very slow rotation
    opacity: 0.3 + Math.random() * 0.4,
    opacityDirection: Math.random() > 0.5 ? 1 : -1,
    opacityMin: 0.15,
    opacityMax: 0.7,
    phase: Math.random() * Math.PI * 2,
    color,
  }
}

export default function AnimatedBackground({ density = 'medium' }: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  const initParticles = useCallback(
    (width: number, height: number) => {
      const count = DENSITY_MAP[density]
      particlesRef.current = Array.from({ length: count }, () =>
        createParticle(width, height, false)
      )
    },
    [density]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Respect prefers-reduced-motion — disable animation entirely
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match window
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Re-initialize particles if none exist yet
      if (particlesRef.current.length === 0) {
        initParticles(window.innerWidth, window.innerHeight)
      }
    }

    resize()
    initParticles(window.innerWidth, window.innerHeight)

    window.addEventListener('resize', resize)

    // Main animation loop
    const animate = () => {
      timeRef.current++
      const width = window.innerWidth
      const height = window.innerHeight

      ctx.clearRect(0, 0, width, height)

      for (const particle of particlesRef.current) {
        // Update position — float upward
        particle.y -= particle.speed

        // Gentle sine-wave sway
        const sway =
          Math.sin(timeRef.current * particle.swayFrequency + particle.phase) *
          particle.swayAmplitude *
          0.02

        particle.x += sway

        // Slow rotation
        particle.rotation += particle.rotationSpeed

        // Fade in/out lifecycle
        particle.opacity += particle.opacityDirection * 0.003
        if (particle.opacity >= particle.opacityMax) {
          particle.opacity = particle.opacityMax
          particle.opacityDirection = -1
        } else if (particle.opacity <= particle.opacityMin) {
          particle.opacity = particle.opacityMin
          particle.opacityDirection = 1
        }

        // Respawn at bottom when drifted off top
        if (particle.y < -particle.size * 2) {
          const respawned = createParticle(width, height, true)
          Object.assign(particle, respawned)
        }

        // Wrap horizontally
        if (particle.x < -particle.size) {
          particle.x = width + particle.size
        } else if (particle.x > width + particle.size) {
          particle.x = -particle.size
        }

        // Draw particle
        ctx.save()
        ctx.globalAlpha = particle.opacity
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)
        ctx.font = `${particle.size}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(particle.emoji, 0, 0)
        ctx.restore()
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    // Handle motion preference changes at runtime
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        cancelAnimationFrame(animationFrameRef.current)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      } else {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    motionQuery.addEventListener('change', handleMotionChange)

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      window.removeEventListener('resize', resize)
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [density, initParticles])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  )
}
