import { useEffect, useRef } from "react"
import PuzzleArt from "./PuzzleArt"
import type { PuzzlePieceData } from "@/hooks/usePuzzle"
import type { PuzzlePhaseData } from "@/data/puzzles"
import { cn } from "@/lib/utils"

export type RegisterSlot = (slot: number, getRect: (() => DOMRect) | null) => void

interface PuzzleSlotProps {
  piece: PuzzlePieceData
  puzzle: PuzzlePhaseData
  /** Registra o rect do lugar para o hit-test do drag (null = desregistrar). */
  register: RegisterSlot
  /** Posição absoluta em % do tabuleiro, calculada do clipRect. */
  style: React.CSSProperties
}

/**
 * Lugar de uma peça no tabuleiro. Expõe o próprio bounding rect via
 * callback de registro (lido na hora do pointerUp — robusto a resize)
 * e renderiza a peça encaixada quando a criança acerta.
 */
export default function PuzzleSlot({ piece, puzzle, register, style }: PuzzleSlotProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { slot, placed } = piece

  useEffect(() => {
    register(slot, () => ref.current!.getBoundingClientRect())
    return () => register(slot, null)
  }, [slot, register])

  return (
    <div
      ref={ref}
      role="img"
      aria-label={
        placed ? `Lugar da peça ${slot + 1} com peça encaixada` : `Lugar da peça ${slot + 1}`
      }
      className={cn(
        "absolute",
        !placed && "rounded-xl border-2 border-dashed border-black/15",
      )}
      style={style}
    >
      {placed && (
        <div className="shape-settle absolute inset-0">
          <PuzzleArt
            drawingId={puzzle.drawingId}
            fills={puzzle.fills}
            clipRect={piece.clipRect}
            className="h-full w-full"
          />
        </div>
      )}
    </div>
  )
}
