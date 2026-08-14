import { useCallback, useEffect, useRef, useState } from "react"
import { useSoundEffects } from "./useSoundEffects"
import type { DuckColor } from "./useDuckNest"

export type GameMode = "playing" | "phaseComplete" | "finished"

/** Sem white: bolha branca some no fundo claro. As 7 restantes têm MP3
 * em src/assets/audio/colors/ (o anúncio da cor-alvo reusa useSpeech). */
export type BubbleColor = Exclude<DuckColor, "white">

export const TOTAL_PHASES = 3

export const BUBBLE_COLOR_VARS: Record<BubbleColor, string> = {
  red: "var(--color-crayon-red)",
  blue: "var(--color-crayon-blue)",
  yellow: "var(--color-crayon-yellow)",
  pink: "var(--color-crayon-pink)",
  green: "var(--color-crayon-green)",
  orange: "var(--color-crayon-orange)",
  purple: "var(--color-crayon-purple)",
}

export const BUBBLE_COLORS = Object.keys(BUBBLE_COLOR_VARS) as BubbleColor[]

/** Concordância com "bolha" (feminino); laranja e rosa são invariáveis. */
export const BUBBLE_LABELS: Record<BubbleColor, string> = {
  red: "vermelha",
  blue: "azul",
  yellow: "amarela",
  pink: "rosa",
  green: "verde",
  orange: "laranja",
  purple: "roxa",
}

export const BUBBLE_LABELS_PLURAL: Record<BubbleColor, string> = {
  red: "vermelhas",
  blue: "azuis",
  yellow: "amarelas",
  pink: "rosa",
  green: "verdes",
  orange: "laranja",
  purple: "roxas",
}

export interface Bubble {
  id: number
  color: BubbleColor
  /** Posição horizontal em % do campo. */
  leftPct: number
  /** Duração da subida (varia o ritmo). */
  durationMs: number
  /** Largura em px (bolhas de tamanhos variados, todas ≥ 72px de toque). */
  sizePx: number
}

export interface PhaseConfig {
  /** Bolhas (da cor-alvo, quando houver) a estourar. */
  goal: number
  spawnMs: number
  /** Duração base da subida. */
  riseMs: number
  hasTarget: boolean
}

const PHASE_CONFIGS: PhaseConfig[] = [
  { goal: 8, spawnMs: 1400, riseMs: 9500, hasTarget: false },
  { goal: 5, spawnMs: 1300, riseMs: 8500, hasTarget: true },
  { goal: 6, spawnMs: 1200, riseMs: 7500, hasTarget: true },
]

/** Probabilidade de nascer a cor-alvo — garante fluxo constante de alvos
 * (a fase nunca trava) mantendo maioria de distratoras. */
const TARGET_BIAS = 0.45

const MAX_ALIVE = 6

function pickTarget(exclude: BubbleColor | null): BubbleColor {
  const pool = BUBBLE_COLORS.filter((c) => c !== exclude)
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Estoura Bolhas: bolhas sobem, toque estoura. Sem fail state — bolha que
 * escapa no topo só sai de cena, cor errada só dá um wobble. Fases 2–3
 * pedem uma cor-alvo.
 */
export function useBubblePop() {
  const [mode, setMode] = useState<GameMode>("playing")
  const [phase, setPhase] = useState(0)
  const [popCount, setPopCount] = useState(0)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [targetColor, setTargetColor] = useState<BubbleColor | null>(null)

  const { playPop, playWhoosh, playTada } = useSoundEffects()

  const modeRef = useRef(mode)
  const phaseRef = useRef(phase)
  const countRef = useRef(popCount)
  const targetRef = useRef(targetColor)
  const nextIdRef = useRef(0)
  /** Ids já estourados — dedinhos rápidos não contam a mesma bolha 2×. */
  const poppedRef = useRef(new Set<number>())

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // Spawn contínuo enquanto joga. StrictMode dev: cleanup limpa o interval.
  useEffect(() => {
    if (mode !== "playing") return
    const config = PHASE_CONFIGS[phase]

    const spawn = () => {
      setBubbles((prev) => {
        if (prev.length >= MAX_ALIVE) return prev
        const target = targetRef.current
        const color =
          config.hasTarget && target && Math.random() < TARGET_BIAS
            ? target
            : BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
        return [
          ...prev,
          {
            id: nextIdRef.current++,
            color,
            leftPct: 4 + Math.random() * 74,
            durationMs: config.riseMs + Math.random() * 1500,
            sizePx: 72 + Math.random() * 40,
          },
        ]
      })
    }

    spawn() // primeira bolha sem esperar o intervalo
    const timer = window.setInterval(spawn, config.spawnMs)
    return () => window.clearInterval(timer)
  }, [mode, phase])

  // Aba em background: limpa o campo — evita rajada de animationend/spawns
  // acumulados na volta (o interval já é throttled pelo navegador).
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setBubbles([])
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  /**
   * Toque numa bolha. "popped" remove e conta; "wrong" (cor errada nas
   * fases com alvo) só dá o wobble no componente; "ignored" = já estourada
   * ou fora do modo de jogo.
   */
  const popBubble = useCallback(
    (bubble: Bubble): "popped" | "wrong" | "ignored" => {
      if (modeRef.current !== "playing") return "ignored"
      if (poppedRef.current.has(bubble.id)) return "ignored"

      const config = PHASE_CONFIGS[phaseRef.current]
      const target = targetRef.current
      if (config.hasTarget && target && bubble.color !== target) {
        playWhoosh()
        return "wrong"
      }

      poppedRef.current.add(bubble.id)
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id))
      playPop()

      const next = countRef.current + 1
      countRef.current = next
      setPopCount(next)

      if (next >= config.goal) {
        modeRef.current = "phaseComplete"
        setMode("phaseComplete")
        playTada()
      }
      return "popped"
    },
    [playPop, playWhoosh, playTada],
  )

  /** Bolha chegou ao topo (animationend): sai sem penalidade. */
  const escapeBubble = useCallback((id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id))
  }, [])

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
      countRef.current = 0
      poppedRef.current.clear()
      const target = PHASE_CONFIGS[next].hasTarget
        ? pickTarget(targetRef.current)
        : null
      targetRef.current = target
      setTargetColor(target)
      setPhase(next)
      setPopCount(0)
      setBubbles([])
      setMode("playing")
    } else {
      modeRef.current = "finished"
      setMode("finished")
    }
  }, [])

  const restart = useCallback(() => {
    modeRef.current = "playing"
    phaseRef.current = 0
    countRef.current = 0
    poppedRef.current.clear()
    targetRef.current = null
    setTargetColor(null)
    setPhase(0)
    setPopCount(0)
    setBubbles([])
    setMode("playing")
  }, [])

  return {
    mode,
    phase,
    popCount,
    goal: PHASE_CONFIGS[phase].goal,
    targetColor,
    bubbles,
    popBubble,
    escapeBubble,
    advancePhase,
    restart,
  }
}
