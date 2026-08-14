import { useCallback, useRef, useState } from "react"
import ShapeSVG from "./ShapeSVG"
import { SHAPE_LABELS, type ShapeId, type ShapePiece } from "@/hooks/useShapeFit"
import { cn } from "@/lib/utils"

interface ShapeDraggableProps {
  piece: ShapePiece
  /** Criança pegou a peça (sonzinho de pegar). */
  onGrab: () => void
  /** Centro da peça no soltar → forma do buraco atingido (ou null). */
  hitTest: (x: number, y: number) => ShapeId | null
  /** Resultado decide se a peça assenta ou volta animada. */
  onDrop: (pieceId: string, holeShape: ShapeId | null) => "correct" | "wrong"
  /** Atraso da animação de balanço, para as peças não dançarem em uníssono. */
  wobbleDelay?: number
  /** Atraso da animação de entrada (peças aparecem uma por vez). */
  arriveDelay?: number
}

const RETURN_MS = 320

/**
 * Peça arrastável com Pointer Events.
 *
 * A posição durante o arrasto é aplicada DIRETO no DOM via ref
 * (transform translate3d) — nunca setState por frame, para manter 60fps.
 * O React só re-renderiza no início/fim do gesto (flag `dragging`).
 */
export default function ShapeDraggable({
  piece,
  onGrab,
  hitTest,
  onDrop,
  wobbleDelay = 0,
  arriveDelay = 0,
}: ShapeDraggableProps) {
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
      if (piece.dropped || draggingRef.current) return
      const el = elRef.current
      if (!el) return

      el.setPointerCapture(e.pointerId)
      startRef.current = { x: e.clientX, y: e.clientY }
      draggingRef.current = true
      setDragging(true)

      el.style.transition = ""
      el.style.willChange = "transform"
      el.style.transform = "translate3d(0, 0, 0) scale(1.15)"

      onGrab()
    },
    [piece.dropped, onGrab],
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
      const holeShape = hitTest(rect.left + rect.width / 2, rect.top + rect.height / 2)
      const result = onDrop(piece.id, holeShape)

      if (result === "correct") {
        // A peça passa a ser renderizada dentro do buraco (ShapeSlot);
        // limpa o transform para o slot de origem sumir sem rastro.
        el.style.transition = ""
        el.style.transform = ""
        el.style.willChange = ""
      } else {
        animateReturn()
      }
    },
    [animateReturn, piece.id, hitTest, onDrop],
  )

  return (
    <div
      ref={elRef}
      role="button"
      aria-label={`Peça em forma de ${SHAPE_LABELS[piece.shape]}`}
      aria-disabled={piece.dropped}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => endDrag(e, false)}
      onPointerCancel={(e) => endDrag(e, true)}
      className={cn(
        // touch-none é crítico: sem ele o navegador rouba o gesto p/ scroll
        "relative w-full touch-none select-none",
        dragging ? "z-30 cursor-grabbing" : "cursor-grab",
        piece.dropped && "pointer-events-none opacity-0",
      )}
    >
      {/* Entrada com pop: wrapper próprio — o root recebe o transform do drag */}
      <div
        className="shape-arrive"
        style={{ ["--arrive-delay" as string]: `${arriveDelay}ms` }}
      >
        <div
          className={cn(!dragging && !piece.dropped && "shape-wobble")}
          style={{ ["--wobble-delay" as string]: `${wobbleDelay}ms` }}
        >
          <ShapeSVG
            shape={piece.shape}
            color={piece.color}
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
