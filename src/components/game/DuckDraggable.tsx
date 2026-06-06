import { useCallback, useRef, useState } from "react"
import DuckSVG from "./DuckSVG"
import { DUCK_COLOR_VARS, type Duck, type DuckColor } from "@/hooks/useDuckNest"
import { cn } from "@/lib/utils"

interface DuckDraggableProps {
  duck: Duck
  /** Criança pegou o patinho (falar a cor em inglês + som). */
  onGrab: (color: DuckColor) => void
  /** Centro do patinho no soltar → cor do ninho atingido (ou null). */
  hitTest: (x: number, y: number) => DuckColor | null
  /** Resultado decide se o patinho assenta ou volta animado. */
  onDrop: (duckId: string, nestColor: DuckColor | null) => "correct" | "wrong"
  /** Atraso da animação de balanço, para os patinhos não dançarem em uníssono. */
  waddleDelay?: number
  /** Atraso da animação de chegada (patinhos entram nadando um por vez). */
  arriveDelay?: number
}

const DUCK_LABELS: Record<DuckColor, string> = {
  red: "Patinho vermelho",
  blue: "Patinho azul",
  yellow: "Patinho amarelo",
  pink: "Patinho rosa",
  green: "Patinho verde",
  orange: "Patinho laranja",
  purple: "Patinho roxo",
  white: "Patinho branco",
}

const RETURN_MS = 320

/**
 * Patinho arrastável com Pointer Events.
 *
 * A posição durante o arrasto é aplicada DIRETO no DOM via ref
 * (transform translate3d) — nunca setState por frame, para manter 60fps.
 * O React só re-renderiza no início/fim do gesto (flag `dragging`).
 */
export default function DuckDraggable({
  duck,
  onGrab,
  hitTest,
  onDrop,
  waddleDelay = 0,
  arriveDelay = 0,
}: DuckDraggableProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const startRef = useRef({ x: 0, y: 0 })
  const draggingRef = useRef(false)
  const returnTimerRef = useRef<number | null>(null)
  const [dragging, setDragging] = useState(false)

  const animateReturn = useCallback(() => {
    const el = elRef.current
    if (!el) return
    el.style.transition = `transform ${RETURN_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
    el.style.transform = "translate3d(0, 0, 0) scale(1)"
    if (returnTimerRef.current !== null) window.clearTimeout(returnTimerRef.current)
    returnTimerRef.current = window.setTimeout(() => {
      el.style.transition = ""
      el.style.transform = ""
      el.style.willChange = ""
      returnTimerRef.current = null
    }, RETURN_MS + 30)
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (duck.dropped || draggingRef.current) return
      const el = elRef.current
      if (!el) return

      el.setPointerCapture(e.pointerId)
      startRef.current = { x: e.clientX, y: e.clientY }
      draggingRef.current = true
      setDragging(true)

      el.style.transition = ""
      el.style.willChange = "transform"
      el.style.transform = "translate3d(0, 0, 0) scale(1.15)"

      onGrab(duck.color)
    },
    [duck.color, duck.dropped, onGrab],
  )

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    const el = elRef.current
    if (!el) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.15)`
  }, [])

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
      if (!draggingRef.current) return
      draggingRef.current = false
      setDragging(false)

      const el = elRef.current
      if (!el) return
      el.releasePointerCapture(e.pointerId)

      if (cancelled) {
        animateReturn()
        return
      }

      const rect = el.getBoundingClientRect()
      const nestColor = hitTest(rect.left + rect.width / 2, rect.top + rect.height / 2)
      const result = onDrop(duck.id, nestColor)

      if (result === "correct") {
        // O patinho passa a ser renderizado dentro do ninho (NestSlot);
        // limpa o transform para o slot de origem sumir sem rastro.
        el.style.transition = ""
        el.style.transform = ""
        el.style.willChange = ""
      } else {
        animateReturn()
      }
    },
    [animateReturn, duck.id, hitTest, onDrop],
  )

  return (
    <div
      ref={elRef}
      role="button"
      aria-label={DUCK_LABELS[duck.color]}
      aria-disabled={duck.dropped}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => endDrag(e, false)}
      onPointerCancel={(e) => endDrag(e, true)}
      className={cn(
        // touch-none é crítico: sem ele o navegador rouba o gesto p/ scroll
        "relative w-full touch-none select-none",
        dragging ? "z-30 cursor-grabbing" : "cursor-grab",
        duck.dropped && "pointer-events-none opacity-0",
      )}
    >
      {/* Chegada nadando: wrapper próprio — o root recebe o transform do drag */}
      <div
        className="duck-arrive"
        style={{ ["--arrive-delay" as string]: `${arriveDelay}ms` }}
      >
        <div
          className={cn(!dragging && !duck.dropped && "duck-waddle")}
          style={{ ["--waddle-delay" as string]: `${waddleDelay}ms` }}
        >
          <DuckSVG
            color={DUCK_COLOR_VARS[duck.color]}
            className={cn(
              "h-auto w-full",
              dragging && "drop-shadow-[0_10px_16px_rgba(0,0,0,0.25)]",
            )}
          />
        </div>
      </div>
    </div>
  )
}
