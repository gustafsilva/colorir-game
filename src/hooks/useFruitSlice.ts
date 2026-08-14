import { useCallback, useEffect, useRef, useState } from "react"
import { useSoundEffects } from "./useSoundEffects"

export type GameMode = "playing" | "bombPause" | "phaseComplete" | "finished"

export const TOTAL_PHASES = 3

export interface PhaseConfig {
  /** Frutas a cortar para completar a fase. */
  goal: number
  /** Intervalo entre lançamentos. */
  spawnMs: number
  /** Chance de um lançamento ser bomba (0 na primeira fase). */
  bombChance: number
  /** Duração total do voo (subida + queda) — quanto menor, mais rápido. */
  flightMs: number
}

const PHASE_CONFIGS: PhaseConfig[] = [
  { goal: 6, spawnMs: 2200, bombChance: 0, flightMs: 4600 },
  { goal: 8, spawnMs: 2000, bombChance: 0.15, flightMs: 4200 },
  { goal: 10, spawnMs: 1800, bombChance: 0.18, flightMs: 3800 },
]

/** Pausa após a explosão, antes de a fase recomeçar limpa. */
const BOMB_PAUSE_MS = 1400

/**
 * Estado do Corta-Frutas: 3 fases com meta de frutas cortadas.
 * Bomba cortada não é game over: explode, zera o contador da fase
 * e a fase recomeça depois de uma pausa curta.
 */
export function useFruitSlice() {
  const [mode, setMode] = useState<GameMode>("playing")
  const [phase, setPhase] = useState(0)
  const [cutCount, setCutCount] = useState(0)
  /** Muda sempre que o campo deve descartar as entidades em voo. */
  const [resetSignal, setResetSignal] = useState(0)

  const { playSlice, playBoom, playTada } = useSoundEffects()

  const modeRef = useRef(mode)
  const phaseRef = useRef(phase)
  const cutRef = useRef(cutCount)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const handleFruitSliced = useCallback(() => {
    if (modeRef.current !== "playing") return
    const next = cutRef.current + 1
    cutRef.current = next
    setCutCount(next)
    playSlice()

    if (next >= PHASE_CONFIGS[phaseRef.current].goal) {
      modeRef.current = "phaseComplete"
      setMode("phaseComplete")
      playTada()
    }
  }, [playSlice, playTada])

  const handleBombSliced = useCallback(() => {
    if (modeRef.current !== "playing") return
    modeRef.current = "bombPause"
    setMode("bombPause")
    cutRef.current = 0
    setCutCount(0)
    playBoom()
  }, [playBoom])

  // Fim da pausa da bomba: limpa o campo e recomeça a fase (StrictMode-safe)
  useEffect(() => {
    if (mode !== "bombPause") return
    const timer = window.setTimeout(() => {
      modeRef.current = "playing"
      setMode("playing")
      setResetSignal((s) => s + 1)
    }, BOMB_PAUSE_MS)
    return () => window.clearTimeout(timer)
  }, [mode])

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
      cutRef.current = 0
      setPhase(next)
      setCutCount(0)
      setMode("playing")
      setResetSignal((s) => s + 1)
    } else {
      modeRef.current = "finished"
      setMode("finished")
    }
  }, [])

  const restart = useCallback(() => {
    modeRef.current = "playing"
    phaseRef.current = 0
    cutRef.current = 0
    setPhase(0)
    setCutCount(0)
    setMode("playing")
    setResetSignal((s) => s + 1)
  }, [])

  return {
    mode,
    phase,
    cutCount,
    config: PHASE_CONFIGS[phase],
    resetSignal,
    handleFruitSliced,
    handleBombSliced,
    advancePhase,
    restart,
  }
}
