import { useCallback, useEffect, useRef, useState } from "react"
import BalloonSVG from "./BalloonSVG"
import BalloonPop from "./BalloonPop"

const BALLOON_COLORS = [
  "var(--color-crayon-red)",
  "var(--color-crayon-orange)",
  "var(--color-crayon-yellow)",
  "var(--color-crayon-green)",
  "var(--color-crayon-blue)",
  "var(--color-crayon-purple)",
  "var(--color-crayon-pink)",
  "var(--color-crayon-turquoise)",
]

const SPAWN_MS = 480
const POP_LIFETIME_MS = 700

interface Balloon {
  id: number
  color: string
  /** Posição horizontal em % do campo. */
  leftPct: number
  /** Duração da subida (varia o ritmo). */
  durationMs: number
  /** Largura em px (balões de tamanhos variados). */
  widthPx: number
}

interface Pop {
  id: number
  color: string
  x: number
  y: number
}

interface BalloonFieldProps {
  /** Estourou um balão (tocar som de pop). */
  onPop: () => void
}

/**
 * Campo de balões do bônus: spawn contínuo de balões subindo do rodapé.
 * Estouram no pointerDown (resposta imediata ao toque, sem esperar click).
 * O tempo de jogo (60s) é controlado pelo hook useDuckNest — este componente
 * só vive enquanto mode === "balloons".
 */
export default function BalloonField({ onPop }: BalloonFieldProps) {
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [pops, setPops] = useState<Pop[]>([])
  const fieldRef = useRef<HTMLDivElement>(null)
  const nextIdRef = useRef(0)

  // Spawn contínuo. StrictMode dev: cleanup limpa o interval do 1º mount.
  useEffect(() => {
    const spawn = () => {
      setBalloons((prev) => [
        ...prev,
        {
          id: nextIdRef.current++,
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
          leftPct: 4 + Math.random() * 82,
          durationMs: 3800 + Math.random() * 2600,
          widthPx: 64 + Math.random() * 40,
        },
      ])
    }
    spawn() // primeiro balão sem esperar o intervalo
    const timer = window.setInterval(spawn, SPAWN_MS)
    return () => window.clearInterval(timer)
  }, [])

  const removeBalloon = useCallback((id: number) => {
    setBalloons((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const popBalloon = useCallback(
    (balloon: Balloon, e: React.PointerEvent<HTMLButtonElement>) => {
      const field = fieldRef.current
      if (!field) return
      const fieldRect = field.getBoundingClientRect()
      const rect = e.currentTarget.getBoundingClientRect()
      const pop: Pop = {
        id: balloon.id,
        color: balloon.color,
        x: rect.left + rect.width / 2 - fieldRect.left,
        y: rect.top + rect.height / 3 - fieldRect.top,
      }

      setBalloons((prev) => prev.filter((b) => b.id !== balloon.id))
      setPops((prev) => [...prev, pop])
      onPop()

      window.setTimeout(() => {
        setPops((prev) => prev.filter((p) => p.id !== pop.id))
      }, POP_LIFETIME_MS)
    },
    [onPop],
  )

  return (
    <div ref={fieldRef} className="absolute inset-0 overflow-hidden">
      {balloons.map((balloon) => (
        <button
          key={balloon.id}
          type="button"
          aria-label="Estourar balão"
          onPointerDown={(e) => popBalloon(balloon, e)}
          onAnimationEnd={() => removeBalloon(balloon.id)}
          className="balloon-rise absolute top-full cursor-pointer touch-none select-none border-none bg-transparent p-0 outline-none"
          style={
            {
              left: `${balloon.leftPct}%`,
              width: `${balloon.widthPx}px`,
              ["--rise-duration"]: `${balloon.durationMs}ms`,
            } as React.CSSProperties
          }
        >
          <BalloonSVG color={balloon.color} className="h-auto w-full" />
        </button>
      ))}

      {pops.map((pop) => (
        <div key={pop.id} className="absolute" style={{ left: pop.x, top: pop.y }}>
          <BalloonPop color={pop.color} />
        </div>
      ))}
    </div>
  )
}
