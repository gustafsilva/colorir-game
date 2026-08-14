import { useCallback, useEffect, useRef, useState } from "react"
import { useSoundEffects } from "./useSoundEffects"
import { MEMORY_FACE_IDS, type FaceId } from "@/components/game/MemoryFaces"

export type GameMode = "playing" | "phaseComplete" | "finished"

export type CardState = "down" | "up" | "matched"

export interface MemoryCardData {
  id: string
  face: FaceId
  state: CardState
}

export const TOTAL_PHASES = 3

/** Pares por fase: 4 cartas → 6 → 8. */
export const PHASE_PAIRS = [2, 3, 4]

/** Tempo que o par errado fica visível antes de desvirar — toddler
 * precisa de tempo para VER as duas cartas e formar a memória. */
const MISMATCH_VISIBLE_MS = 900

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Sorteia as faces da fase e embaralha os pares. */
function buildPhase(phase: number): MemoryCardData[] {
  const faces = shuffle(MEMORY_FACE_IDS).slice(0, PHASE_PAIRS[phase])
  return shuffle(
    faces.flatMap((face) =>
      (["a", "b"] as const).map((half) => ({
        id: `${phase}-${face}-${half}`,
        face,
        state: "down" as CardState,
      })),
    ),
  )
}

/**
 * Jogo da memória: 3 fases com pares crescentes.
 * Sem contagem de erros nem timer — errar só desvira as cartas.
 */
export function useMemoryGame() {
  const [mode, setMode] = useState<GameMode>("playing")
  const [phase, setPhase] = useState(0)
  const [cards, setCards] = useState<MemoryCardData[]>(() => buildPhase(0))

  const { playClick, playSparkle, playWhoosh, playTada } = useSoundEffects()

  const modeRef = useRef(mode)
  const phaseRef = useRef(phase)
  /** Espelho de `cards` para o handler ler estado fresco mesmo antes
   * do re-render (cliques rápidos em sequência). */
  const cardsRef = useRef(cards)
  /** Ids das cartas viradas para cima aguardando comparação (0–2). */
  const openRef = useRef<string[]>([])
  /** true enquanto o par errado está visível — cliques são ignorados. */
  const lockRef = useRef(false)
  const mismatchTimerRef = useRef<number | null>(null)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    return () => {
      if (mismatchTimerRef.current !== null) {
        window.clearTimeout(mismatchTimerRef.current)
      }
    }
  }, [])

  const clearMismatchTimer = useCallback(() => {
    if (mismatchTimerRef.current !== null) {
      window.clearTimeout(mismatchTimerRef.current)
      mismatchTimerRef.current = null
    }
  }, [])

  /** Aplica o novo array de cartas ao state E ao espelho de uma vez. */
  const commitCards = useCallback((next: MemoryCardData[]) => {
    cardsRef.current = next
    setCards(next)
  }, [])

  // Toda a lógica vive no handler (setState updaters precisam ser puros —
  // no StrictMode rodam 2x e dobrariam sons e timers).
  const flipCard = useCallback(
    (cardId: string) => {
      if (modeRef.current !== "playing") return
      if (lockRef.current) return
      if (openRef.current.length >= 2) return
      if (openRef.current.includes(cardId)) return

      const card = cardsRef.current.find((c) => c.id === cardId)
      // Carta já aberta/combinada não vira de novo
      if (!card || card.state !== "down") return

      playClick()
      openRef.current = [...openRef.current, cardId]
      const flipped = cardsRef.current.map((c) =>
        c.id === cardId ? { ...c, state: "up" as CardState } : c,
      )

      if (openRef.current.length < 2) {
        commitCards(flipped)
        return
      }

      // Segunda carta aberta: compara o par
      const [firstId, secondId] = openRef.current
      const first = flipped.find((c) => c.id === firstId)!
      const second = flipped.find((c) => c.id === secondId)!

      if (first.face === second.face) {
        openRef.current = []
        playSparkle()
        const matched = flipped.map((c) =>
          c.id === firstId || c.id === secondId
            ? { ...c, state: "matched" as CardState }
            : c,
        )
        commitCards(matched)
        if (matched.every((c) => c.state === "matched")) {
          modeRef.current = "phaseComplete"
          setMode("phaseComplete")
          playTada()
        }
        return
      }

      // Par errado: fica visível um instante e desvira
      commitCards(flipped)
      lockRef.current = true
      mismatchTimerRef.current = window.setTimeout(() => {
        mismatchTimerRef.current = null
        lockRef.current = false
        openRef.current = []
        playWhoosh()
        commitCards(
          cardsRef.current.map((c) =>
            c.id === firstId || c.id === secondId
              ? { ...c, state: "down" as CardState }
              : c,
          ),
        )
      }, MISMATCH_VISIBLE_MS)
    },
    [commitCards, playClick, playSparkle, playWhoosh, playTada],
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
      openRef.current = []
      lockRef.current = false
      setPhase(next)
      commitCards(buildPhase(next))
      setMode("playing")
    } else {
      modeRef.current = "finished"
      setMode("finished")
    }
  }, [commitCards])

  const restart = useCallback(() => {
    clearMismatchTimer()
    modeRef.current = "playing"
    phaseRef.current = 0
    openRef.current = []
    lockRef.current = false
    setPhase(0)
    commitCards(buildPhase(0))
    setMode("playing")
  }, [clearMismatchTimer, commitCards])

  return {
    mode,
    phase,
    cards,
    flipCard,
    advancePhase,
    restart,
  }
}
