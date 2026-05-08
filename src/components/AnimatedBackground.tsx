import { useEffect, useRef, useCallback } from 'react'

/**
 * AnimatedBackground — A dreamy, magical floating particle canvas for toddlers (ages 2-5).
 *
 * Particles are hand-drawn canvas paths that mimic Phosphor Duotone shapes
 * (Star, Drop, Heart, Sparkle). Drawing paths instead of rasterizing SVG keeps
 * the animation cheap and lets each particle pick a vivid crayon palette color.
 */

type Density = 'low' | 'medium' | 'high'

interface AnimatedBackgroundProps {
  density?: Density
}

type Shape = 'star' | 'drop' | 'heart' | 'sparkle'

const SHAPES: Shape[] = ['star', 'drop', 'heart', 'sparkle']

const CRAYON_PALETTE = [
  'oklch(0.63 0.26 25)',
  'oklch(0.75 0.18 55)',
  'oklch(0.88 0.17 90)',
  'oklch(0.72 0.19 145)',
  'oklch(0.55 0.22 260)',
  'oklch(0.55 0.22 300)',
  'oklch(0.7 0.2 350)',
] as const

const DENSITY_MAP: Record<Density, number> = {
  low: 12,
  medium: 22,
  high: 30,
}

interface Particle {
  x: number
  y: number
  shape: Shape
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
  phase: number
  color: string
}

function createParticle(canvasWidth: number, canvasHeight: number, startAtBottom = false): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: startAtBottom
      ? canvasHeight + Math.random() * 60
      : Math.random() * canvasHeight,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    size: 14 + Math.random() * 14,
    speed: 0.3 + Math.random() * 0.5,
    swayAmplitude: 15 + Math.random() * 25,
    swayFrequency: 0.005 + Math.random() * 0.01,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.01,
    opacity: 0.3 + Math.random() * 0.4,
    opacityDirection: Math.random() > 0.5 ? 1 : -1,
    opacityMin: 0.18,
    opacityMax: 0.7,
    phase: Math.random() * Math.PI * 2,
    color: CRAYON_PALETTE[Math.floor(Math.random() * CRAYON_PALETTE.length)],
  }
}

function drawStar(ctx: CanvasRenderingContext2D, size: number) {
  const outer = size / 2
  const inner = outer * 0.45
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI / 5) * i - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

function drawDrop(ctx: CanvasRenderingContext2D, size: number) {
  const half = size / 2
  ctx.beginPath()
  ctx.moveTo(0, -half)
  ctx.bezierCurveTo(half, -half * 0.2, half * 0.9, half, 0, half)
  ctx.bezierCurveTo(-half * 0.9, half, -half, -half * 0.2, 0, -half)
  ctx.closePath()
  ctx.fill()
}

function drawHeart(ctx: CanvasRenderingContext2D, size: number) {
  const s = size / 2
  ctx.beginPath()
  ctx.moveTo(0, s * 0.85)
  ctx.bezierCurveTo(-s * 1.4, s * 0.05, -s * 0.7, -s * 1.05, 0, -s * 0.3)
  ctx.bezierCurveTo(s * 0.7, -s * 1.05, s * 1.4, s * 0.05, 0, s * 0.85)
  ctx.closePath()
  ctx.fill()
}

function drawSparkle(ctx: CanvasRenderingContext2D, size: number) {
  const s = size / 2
  const thin = s * 0.22
  ctx.beginPath()
  // 4-point sparkle (vertical + horizontal diamond)
  ctx.moveTo(0, -s)
  ctx.lineTo(thin, -thin)
  ctx.lineTo(s, 0)
  ctx.lineTo(thin, thin)
  ctx.lineTo(0, s)
  ctx.lineTo(-thin, thin)
  ctx.lineTo(-s, 0)
  ctx.lineTo(-thin, -thin)
  ctx.closePath()
  ctx.fill()
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, size: number) {
  switch (shape) {
    case 'star':
      drawStar(ctx, size)
      break
    case 'drop':
      drawDrop(ctx, size)
      break
    case 'heart':
      drawHeart(ctx, size)
      break
    case 'sparkle':
      drawSparkle(ctx, size)
      break
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
        createParticle(width, height, false),
      )
    },
    [density],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (particlesRef.current.length === 0) {
        initParticles(window.innerWidth, window.innerHeight)
      }
    }

    resize()
    initParticles(window.innerWidth, window.innerHeight)

    window.addEventListener('resize', resize)

    const animate = () => {
      timeRef.current++
      const width = window.innerWidth
      const height = window.innerHeight

      ctx.clearRect(0, 0, width, height)

      for (const particle of particlesRef.current) {
        particle.y -= particle.speed

        const sway =
          Math.sin(timeRef.current * particle.swayFrequency + particle.phase) *
          particle.swayAmplitude *
          0.02

        particle.x += sway
        particle.rotation += particle.rotationSpeed

        particle.opacity += particle.opacityDirection * 0.003
        if (particle.opacity >= particle.opacityMax) {
          particle.opacity = particle.opacityMax
          particle.opacityDirection = -1
        } else if (particle.opacity <= particle.opacityMin) {
          particle.opacity = particle.opacityMin
          particle.opacityDirection = 1
        }

        if (particle.y < -particle.size * 2) {
          const respawned = createParticle(width, height, true)
          Object.assign(particle, respawned)
        }

        if (particle.x < -particle.size) {
          particle.x = width + particle.size
        } else if (particle.x > width + particle.size) {
          particle.x = -particle.size
        }

        ctx.save()
        ctx.globalAlpha = particle.opacity
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)
        ctx.fillStyle = particle.color
        drawShape(ctx, particle.shape, particle.size)
        ctx.restore()
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        cancelAnimationFrame(animationFrameRef.current)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      } else {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    motionQuery.addEventListener('change', handleMotionChange)

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
