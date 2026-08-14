import { useCallback, useEffect, useRef, useState } from "react"
import { useSoundEffects } from "./useSoundEffects"

export type ShapeId =
  | "circle"
  | "square"
  | "triangle"
  | "rectangle"
  | "star"
  | "heart"
  | "diamond"
  | "oval"

export type GameMode = "playing" | "phaseComplete" | "finished"

export interface ShapePiece {
  id: string
  shape: ShapeId
  /** CSS var da paleta crayon, sorteada por fase (não é critério do jogo). */
  color: string
  dropped: boolean
}

export const SHAPE_LABELS: Record<ShapeId, string> = {
  circle: "círculo",
  square: "quadrado",
  triangle: "triângulo",
  rectangle: "retângulo",
  star: "estrela",
  heart: "coração",
  diamond: "losango",
  oval: "oval",
}

export const TOTAL_PHASES = 3

const ALL_SHAPES: ShapeId[] = [
  "circle",
  "square",
  "triangle",
  "rectangle",
  "star",
  "heart",
  "diamond",
  "oval",
]

// Silhuetas bem distintas entre si — a primeira fase não pode frustrar.
const EASY_POOL: ShapeId[] = ["circle", "square", "triangle", "star", "heart"]

// Pares que se confundem pela silhueta; a fase final garante um deles.
const CONFUSABLE_PAIRS: [ShapeId, ShapeId][] = [
  ["circle", "oval"],
  ["square", "rectangle"],
  ["triangle", "diamond"],
]

// Sem marrom (cor da prancha) e sem branco (pareceria buraco vazio iluminado).
// As cores rotacionam entre fases de propósito: se cada forma tivesse cor
// fixa, a criança poderia decorar "estrela = amarela" e parear pela cor.
const PIECE_COLOR_POOL = [
  "var(--color-crayon-red)",
  "var(--color-crayon-blue)",
  "var(--color-crayon-yellow)",
  "var(--color-crayon-green)",
  "var(--color-crayon-orange)",
  "var(--color-crayon-purple)",
  "var(--color-crayon-pink)",
  "var(--color-crayon-turquoise)",
]

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

interface PhaseSetup {
  pieces: ShapePiece[]
  holeOrder: ShapeId[]
}

/** Dificuldade progressiva: 3 fáceis → 4 quaisquer → 4 com par confusável. */
function pickShapes(phase: number): ShapeId[] {
  if (phase === 0) return shuffle(EASY_POOL).slice(0, 3)
  if (phase === 1) return shuffle(ALL_SHAPES).slice(0, 4)
  const pair = CONFUSABLE_PAIRS[Math.floor(Math.random() * CONFUSABLE_PAIRS.length)]
  const rest = shuffle(ALL_SHAPES.filter((s) => !pair.includes(s))).slice(0, 2)
  return [...pair, ...rest]
}

/** Sorteia as formas da fase e embaralha peças e buracos de forma independente. */
function buildPhase(phase: number): PhaseSetup {
  const shapes = pickShapes(phase)
  const colors = shuffle(PIECE_COLOR_POOL)
  return {
    pieces: shuffle(shapes).map((shape, i) => ({
      id: `${phase}-${shape}`,
      shape,
      color: colors[i],
      dropped: false,
    })),
    holeOrder: shuffle(shapes),
  }
}

export function useShapeFit() {
  const [mode, setMode] = useState<GameMode>("playing")
  const [phase, setPhase] = useState(0)
  const [setup, setSetup] = useState<PhaseSetup>(() => buildPhase(0))

  const { playPop, playWhoosh, playTada } = useSoundEffects()

  const phaseRef = useRef(phase)
  const modeRef = useRef(mode)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  /**
   * Resultado de soltar uma peça sobre um buraco (ou fora).
   * O componente de drag usa o retorno para animar snap ou volta.
   */
  const dropPiece = useCallback(
    (pieceId: string, holeShape: ShapeId | null): "correct" | "wrong" => {
      const piece = setup.pieces.find((p) => p.id === pieceId)
      if (!piece || piece.dropped) return "wrong"

      if (holeShape !== piece.shape) {
        playWhoosh()
        return "wrong"
      }

      playPop()
      const pieces = setup.pieces.map((p) =>
        p.id === pieceId ? { ...p, dropped: true } : p,
      )
      setSetup({ ...setup, pieces })

      if (pieces.every((p) => p.dropped)) {
        setMode("phaseComplete")
        playTada()
      }
      return "correct"
    },
    [setup, playPop, playWhoosh, playTada],
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
      setSetup(buildPhase(next))
      setMode("playing")
    } else {
      modeRef.current = "finished"
      setMode("finished")
    }
  }, [])

  const restart = useCallback(() => {
    setPhase(0)
    setSetup(buildPhase(0))
    setMode("playing")
  }, [])

  return {
    mode,
    phase,
    pieces: setup.pieces,
    holeOrder: setup.holeOrder,
    dropPiece,
    advancePhase,
    restart,
  }
}
