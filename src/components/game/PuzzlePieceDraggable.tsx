import { useCallback, useRef, useState } from "react"
import PuzzleArt from "./PuzzleArt"
import type { PuzzlePieceData } from "@/hooks/usePuzzle"
import type { PuzzlePhaseData } from "@/data/puzzles"
import { cn } from "@/lib/utils"

interface PuzzlePieceDraggableProps {
  piece: PuzzlePieceData
  puzzle: PuzzlePhaseData
  /** Criança pegou a peça (sonzinho de pegar). */
  onGrab: () => void
  /** Centro da peça no soltar → lugar atingido (ou null). */
  hitTest: (x: number, y: number) => number | null
  /** Resultado decide se a peça assenta ou volta animada. */
  onDrop: (pieceId: string, slot: number | null) => "correct" | "wrong"
  /** Atrasos das animações de entrada/balanço (peças não dançam em uníssono). */
  wobbleDelay?: number
  arriveDelay?: number
}

const RETURN_MS = 320

/**
 * Peça arrastável com Pointer Events (mesmo mecanismo do ShapeDraggable):
 * transform aplicado DIRETO no DOM via ref — nunca setState por frame.
 */
export default function PuzzlePieceDraggable({
  piece,
  puzzle,
  onGrab,
  hitTest,
  onDrop,
  wobbleDelay = 0,
  arriveDelay = 0,
}: PuzzlePieceDraggableProps) {
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
      if (piece.placed || draggingRef.current) return
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
    [piece.placed, onGrab],
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
      const slot = hitTest(rect.left + rect.width / 2, rect.top + rect.height / 2)
      const result = onDrop(piece.id, slot)

      if (result === "correct") {
        // A peça passa a ser renderizada dentro do lugar (PuzzleSlot);
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
      aria-label={`Peça do quebra-cabeça ${piece.slot + 1}`}
      aria-disabled={piece.placed}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => endDrag(e, false)}
      onPointerCancel={(e) => endDrag(e, true)}
      className={cn(
        // touch-none é crítico: sem ele o navegador rouba o gesto p/ scroll
        "relative w-full touch-none select-none",
        dragging ? "z-30 cursor-grabbing" : "cursor-grab",
        piece.placed && "pointer-events-none opacity-0",
      )}
      style={{ aspectRatio: `${piece.clipRect.w} / ${piece.clipRect.h}` }}
    >
      {/* Entrada com pop: wrapper próprio — o root recebe o transform do drag */}
      <div
        className="shape-arrive h-full w-full"
        style={{ ["--arrive-delay" as string]: `${arriveDelay}ms` }}
      >
        <div
          className={cn(
            "h-full w-full overflow-hidden rounded-xl border-[3px] border-white bg-white shadow-md",
            !dragging && !piece.placed && "shape-wobble",
            dragging && "shadow-[0_10px_16px_rgba(0,0,0,0.25)]",
          )}
          style={{ ["--wobble-delay" as string]: `${wobbleDelay}ms` }}
        >
          <PuzzleArt
            drawingId={puzzle.drawingId}
            fills={puzzle.fills}
            clipRect={piece.clipRect}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  )
}
