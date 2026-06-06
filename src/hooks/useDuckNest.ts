import { useCallback, useEffect, useRef, useState } from "react"
import { useSoundEffects } from "./useSoundEffects"

/** A própria string é a palavra em inglês falada ao pegar o patinho. */
export type DuckColor =
  | "red"
  | "blue"
  | "yellow"
  | "pink"
  | "green"
  | "orange"
  | "purple"
  | "white"

export type GameMode = "playing" | "phaseComplete" | "balloons" | "finished"

export interface Duck {
  id: string
  color: DuckColor
  dropped: boolean
}

export const DUCK_COLOR_VARS: Record<DuckColor, string> = {
  red: "var(--color-crayon-red)",
  blue: "var(--color-crayon-blue)",
  yellow: "var(--color-crayon-yellow)",
  pink: "var(--color-crayon-pink)",
  green: "var(--color-crayon-green)",
  orange: "var(--color-crayon-orange)",
  purple: "var(--color-crayon-purple)",
  white: "var(--color-crayon-white)",
}

// Sem marrom (confunde com a palha do ninho) e sem preto (esconderia
// os olhos/contorno do patinho).
const COLOR_POOL: DuckColor[] = [
  "red",
  "blue",
  "yellow",
  "pink",
  "green",
  "orange",
  "purple",
  "white",
]

export const TOTAL_PHASES = 3
export const DUCKS_PER_PHASE = 3
const BALLOON_SECONDS = 60

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

interface PhaseSetup {
  ducks: Duck[]
  nestOrder: DuckColor[]
}

/** Sorteia 3 cores do pool e embaralha patos e ninhos de forma independente. */
function buildPhase(phase: number): PhaseSetup {
  const colors = shuffle(COLOR_POOL).slice(0, DUCKS_PER_PHASE)
  return {
    ducks: shuffle(colors).map((color) => ({
      id: `${phase}-${color}`,
      color,
      dropped: false,
    })),
    nestOrder: shuffle(colors),
  }
}

export function useDuckNest() {
  const [mode, setMode] = useState<GameMode>("playing")
  const [phase, setPhase] = useState(0)
  const [setup, setSetup] = useState<PhaseSetup>(() => buildPhase(0))
  const [balloonTimeLeft, setBalloonTimeLeft] = useState(BALLOON_SECONDS)

  const { playQuack, playWhoosh, playTada } = useSoundEffects()

  const balloonTimerRef = useRef<number | null>(null)
  const phaseRef = useRef(phase)
  const modeRef = useRef(mode)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const clearBalloonTimer = useCallback(() => {
    if (balloonTimerRef.current !== null) {
      window.clearInterval(balloonTimerRef.current)
      balloonTimerRef.current = null
    }
  }, [])

  // Timer do modo balões. Em StrictMode dev o effect roda 2x:
  // o cleanup limpa o interval do primeiro mount e o segundo reinicia.
  // O reset do contador acontece em advancePhase/restart (não aqui) para
  // evitar setState síncrono no corpo do effect.
  useEffect(() => {
    if (mode !== "balloons") return
    balloonTimerRef.current = window.setInterval(() => {
      setBalloonTimeLeft((prev) => {
        if (prev <= 1) {
          clearBalloonTimer()
          setMode("finished")
          playTada()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return clearBalloonTimer
  }, [mode, clearBalloonTimer, playTada])

  /**
   * Resultado de soltar um patinho sobre um ninho (ou fora).
   * O componente de drag usa o retorno para animar snap ou volta.
   */
  const dropDuck = useCallback(
    (duckId: string, nestColor: DuckColor | null): "correct" | "wrong" => {
      const duck = setup.ducks.find((d) => d.id === duckId)
      if (!duck || duck.dropped) return "wrong"

      if (nestColor !== duck.color) {
        playWhoosh()
        return "wrong"
      }

      playQuack()
      const ducks = setup.ducks.map((d) =>
        d.id === duckId ? { ...d, dropped: true } : d,
      )
      setSetup({ ...setup, ducks })

      if (ducks.every((d) => d.dropped)) {
        setMode("phaseComplete")
        playTada()
      }
      return "correct"
    },
    [setup, playQuack, playWhoosh, playTada],
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
      modeRef.current = "balloons"
      setBalloonTimeLeft(BALLOON_SECONDS)
      setMode("balloons")
    }
  }, [])

  const restart = useCallback(() => {
    clearBalloonTimer()
    setPhase(0)
    setSetup(buildPhase(0))
    setBalloonTimeLeft(BALLOON_SECONDS)
    setMode("playing")
  }, [clearBalloonTimer])

  return {
    mode,
    phase,
    ducks: setup.ducks,
    nestOrder: setup.nestOrder,
    balloonTimeLeft,
    dropDuck,
    advancePhase,
    restart,
  }
}
