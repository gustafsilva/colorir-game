import { useCallback, useRef, useState } from "react"
import BubbleSVG from "./BubbleSVG"
import BubbleBurst from "./BubbleBurst"
import {
  BUBBLE_COLOR_VARS,
  BUBBLE_LABELS,
  type Bubble,
} from "@/hooks/useBubblePop"

const POP_LIFETIME_MS = 700
const WOBBLE_MS = 500

interface Pop {
  id: number
  colorVar: string
  x: number
  y: number
}

interface BubbleFieldProps {
  bubbles: Bubble[]
  /** Toque numa bolha — o hook decide o resultado. */
  onPop: (bubble: Bubble) => "popped" | "wrong" | "ignored"
  /** Bolha chegou ao topo (sem penalidade). */
  onEscape: (id: number) => void
}

/**
 * Campo de bolhas (generaliza o BalloonField do bônus dos Patinhos):
 * subida por CSS keyframe (o transform animado participa do hit-testing),
 * estouro no pointerDown — resposta imediata, sem esperar click (que o
 * navegador suprime quando o elemento se move entre down e up).
 */
export default function BubbleField({ bubbles, onPop, onEscape }: BubbleFieldProps) {
  const [pops, setPops] = useState<Pop[]>([])
  const [wobblingIds, setWobblingIds] = useState<Set<number>>(new Set())
  const fieldRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = useCallback(
    (bubble: Bubble, e: React.PointerEvent<HTMLButtonElement>) => {
      const field = fieldRef.current
      if (!field) return
      const result = onPop(bubble)

      if (result === "popped") {
        const fieldRect = field.getBoundingClientRect()
        const rect = e.currentTarget.getBoundingClientRect()
        const pop: Pop = {
          id: bubble.id,
          colorVar: BUBBLE_COLOR_VARS[bubble.color],
          x: rect.left + rect.width / 2 - fieldRect.left,
          y: rect.top + rect.height / 2 - fieldRect.top,
        }
        setPops((prev) => [...prev, pop])
        window.setTimeout(() => {
          setPops((prev) => prev.filter((p) => p.id !== pop.id))
        }, POP_LIFETIME_MS)
        return
      }

      if (result === "wrong") {
        setWobblingIds((prev) => new Set(prev).add(bubble.id))
        window.setTimeout(() => {
          setWobblingIds((prev) => {
            const next = new Set(prev)
            next.delete(bubble.id)
            return next
          })
        }, WOBBLE_MS)
      }
    },
    [onPop],
  )

  return (
    <div ref={fieldRef} className="absolute inset-0 overflow-hidden">
      {bubbles.map((bubble) => (
        <button
          key={bubble.id}
          type="button"
          aria-label={`Bolha ${BUBBLE_LABELS[bubble.color]}`}
          onPointerDown={(e) => handlePointerDown(bubble, e)}
          // A subida anima o transform do BOTÃO; o wobble fica no div
          // interno — transforms concorrentes se sobrescreveriam.
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) onEscape(bubble.id)
          }}
          className="bubble-rise absolute top-full cursor-pointer touch-none select-none border-none bg-transparent p-2 outline-none"
          style={
            {
              left: `${bubble.leftPct}%`,
              width: `${bubble.sizePx}px`,
              ["--rise-duration"]: `${bubble.durationMs}ms`,
            } as React.CSSProperties
          }
        >
          <div className={wobblingIds.has(bubble.id) ? "bubble-wobble-once" : undefined}>
            <BubbleSVG color={BUBBLE_COLOR_VARS[bubble.color]} className="h-auto w-full" />
          </div>
        </button>
      ))}

      {pops.map((pop) => (
        <div key={pop.id} className="absolute" style={{ left: pop.x, top: pop.y }}>
          <BubbleBurst color={pop.colorVar} />
        </div>
      ))}
    </div>
  )
}
