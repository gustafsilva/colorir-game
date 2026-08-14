import { useCallback, useEffect, useRef, useState } from "react"
import { useSoundEffects } from "./useSoundEffects"
import { PUZZLE_PHASES } from "@/data/puzzles"

export type GameMode = "playing" | "phaseComplete" | "finished"

export const TOTAL_PHASES = 3

/** Retângulo da peça em unidades do viewBox 0 0 400 400 do desenho. */
export interface ClipRect {
  x: number
  y: number
  w: number
  h: number
}

export interface PuzzlePieceData {
  id: string
  /** Índice do lugar correto no tabuleiro (0-based, linha a linha). */
  slot: number
  clipRect: ClipRect
  placed: boolean
}

const VIEWBOX = 400

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Corta a grade da fase e embaralha a ordem da bandeja. */
function buildPhase(phase: number): PuzzlePieceData[] {
  const { cols, rows } = PUZZLE_PHASES[phase]
  const w = VIEWBOX / cols
  const h = VIEWBOX / rows

  const pieces: PuzzlePieceData[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const slot = r * cols + c
      pieces.push({
        id: `${phase}-${slot}`,
        slot,
        clipRect: { x: c * w, y: r * h, w, h },
        placed: false,
      })
    }
  }

  // Re-embaralha se a permutação sair identidade — fase "já pronta" não diverte
  let shuffled = shuffle(pieces)
  while (shuffled.every((p, i) => p.slot === i)) {
    shuffled = shuffle(shuffled)
  }
  return shuffled
}

/**
 * Quebra-Cabeça: desenhos do catálogo em 2/4/6 peças grandes.
 * Sem fail state — peça no lugar errado só volta para a bandeja.
 */
export function usePuzzle() {
  const [mode, setMode] = useState<GameMode>("playing")
  const [phase, setPhase] = useState(0)
  const [pieces, setPieces] = useState<PuzzlePieceData[]>(() => buildPhase(0))

  const { playPop, playWhoosh, playTada } = useSoundEffects()

  const modeRef = useRef(mode)
  const phaseRef = useRef(phase)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  /**
   * Resultado de soltar uma peça sobre um lugar (ou fora).
   * O componente de drag usa o retorno para animar snap ou volta.
   */
  const placePiece = useCallback(
    (pieceId: string, slot: number | null): "correct" | "wrong" => {
      const piece = pieces.find((p) => p.id === pieceId)
      if (!piece || piece.placed) return "wrong"

      if (slot !== piece.slot) {
        playWhoosh()
        return "wrong"
      }

      playPop()
      const next = pieces.map((p) => (p.id === pieceId ? { ...p, placed: true } : p))
      setPieces(next)

      if (next.every((p) => p.placed)) {
        modeRef.current = "phaseComplete"
        setMode("phaseComplete")
        playTada()
      }
      return "correct"
    },
    [pieces, playPop, playWhoosh, playTada],
  )

  /**
   * Chamado quando a celebração de fase é dispensada.
   * Idempotente via modeRef: tap + auto-dismiss não avançam duas vezes.
   */
  const advancePhase = useCallback(() => {
    if (modeRef.current !== "phaseComplete") return
    const next = phaseRef.current + 1
    if (next < TOTAL_PHASES) {
      phaseRef.current = next
      modeRef.current = "playing"
      setPhase(next)
      setPieces(buildPhase(next))
      setMode("playing")
    } else {
      modeRef.current = "finished"
      setMode("finished")
    }
  }, [])

  const restart = useCallback(() => {
    modeRef.current = "playing"
    phaseRef.current = 0
    setPhase(0)
    setPieces(buildPhase(0))
    setMode("playing")
  }, [])

  return {
    mode,
    phase,
    puzzle: PUZZLE_PHASES[phase],
    pieces,
    placePiece,
    advancePhase,
    restart,
  }
}
