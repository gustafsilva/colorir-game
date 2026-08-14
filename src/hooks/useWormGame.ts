import { useCallback, useEffect, useRef, useState } from "react"
import { useSoundEffects } from "./useSoundEffects"
import { FRUIT_KINDS, type FruitKind } from "@/components/game/FruitSVG"

export type GameMode = "playing" | "phaseComplete" | "finished"

export type Direction = "up" | "down" | "left" | "right"

export interface Cell {
  x: number
  y: number
}

export interface FruitData {
  cell: Cell
  kind: FruitKind
}

export const GRID_COLS = 6
export const GRID_ROWS = 8
export const TOTAL_PHASES = 3

/** Frutas para comer por fase. */
export const PHASE_FRUITS = [4, 6, 8]

/** Uma célula por passo — lento o bastante para a criança acompanhar. */
export const STEP_MS = 260

/** Duração do pulso de "nhac" na cabeça (classe .worm-chomp + StarBurst). */
const CHOMP_PULSE_MS = 450

/** [0] é a cabeça. Começa no meio-esquerda, olhando para a direita. */
const INITIAL_WORM: Cell[] = [
  { x: 2, y: 4 },
  { x: 1, y: 4 },
  { x: 0, y: 4 },
]

function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y
}

function manhattan(a: Cell, b: Cell): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

/**
 * Sorteia a célula da próxima fruta: nunca sob a minhoca e a pelo menos
 * 2 células da cabeça (garante movimento visível). O tipo da fruta cicla
 * deterministicamente — variedade sem sorteio.
 */
function spawnFruit(worm: Cell[], totalEaten: number): FruitData {
  const head = worm[0]
  const free: Cell[] = []
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const cell = { x, y }
      if (worm.some((seg) => sameCell(seg, cell))) continue
      if (manhattan(cell, head) < 2) continue
      free.push(cell)
    }
  }
  const cell = free[Math.floor(Math.random() * free.length)]
  return { cell, kind: FRUIT_KINDS[totalEaten % FRUIT_KINDS.length] }
}

/**
 * Minhoca Comilona: a criança toca na fruta e a minhoca anda sozinha até
 * ela, célula a célula, crescendo um segmento a cada fruta. Sem morte,
 * sem obstáculos — passar por cima do próprio corpo é permitido.
 */
export function useWormGame() {
  const [mode, setMode] = useState<GameMode>("playing")
  const [phase, setPhase] = useState(0)
  const [eaten, setEaten] = useState(0)
  const [worm, setWorm] = useState<Cell[]>(INITIAL_WORM)
  const [fruit, setFruit] = useState<FruitData | null>(() =>
    spawnFruit(INITIAL_WORM, 0),
  )
  const [dir, setDir] = useState<Direction>("right")
  const [isMoving, setIsMoving] = useState(false)
  const [justAte, setJustAte] = useState(false)

  const { playPop, playTada, playChomp } = useSoundEffects()

  const modeRef = useRef(mode)
  const phaseRef = useRef(phase)
  const eatenRef = useRef(eaten)
  /** Espelhos para o interval ler estado fresco sem depender de re-render. */
  const wormRef = useRef(worm)
  const fruitRef = useRef(fruit)
  const totalEatenRef = useRef(0)
  const movingRef = useRef(false)
  const moveTimerRef = useRef<number | null>(null)
  const chompTimerRef = useRef<number | null>(null)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const commitWorm = useCallback((next: Cell[]) => {
    wormRef.current = next
    setWorm(next)
  }, [])

  const commitFruit = useCallback((next: FruitData | null) => {
    fruitRef.current = next
    setFruit(next)
  }, [])

  const stopMoving = useCallback(() => {
    if (moveTimerRef.current !== null) {
      window.clearInterval(moveTimerRef.current)
      moveTimerRef.current = null
    }
    movingRef.current = false
    setIsMoving(false)
  }, [])

  useEffect(() => {
    return () => {
      if (moveTimerRef.current !== null) {
        window.clearInterval(moveTimerRef.current)
      }
      if (chompTimerRef.current !== null) {
        window.clearTimeout(chompTimerRef.current)
      }
    }
  }, [])

  // Toda a lógica vive no tick do interval (setState updaters precisam ser
  // puros — no StrictMode rodam 2x e dobrariam sons e crescimento).
  const step = useCallback(() => {
    const currentWorm = wormRef.current
    const target = fruitRef.current
    if (!target) {
      stopMoving()
      return
    }

    const head = currentWorm[0]
    const dx = target.cell.x - head.x
    const dy = target.cell.y - head.y

    // Pathfinding trivial: anda no eixo de maior |delta| (empate → x)
    let next: Cell
    if (dx !== 0 && Math.abs(dx) >= Math.abs(dy)) {
      next = { x: head.x + Math.sign(dx), y: head.y }
      setDir(dx > 0 ? "right" : "left")
    } else {
      next = { x: head.x, y: head.y + Math.sign(dy) }
      setDir(dy > 0 ? "down" : "up")
    }

    const ate = sameCell(next, target.cell)
    const nextWorm = [next, ...currentWorm]
    // Comer não faz pop do rabo: a minhoca cresce 1 segmento
    if (!ate) nextWorm.pop()
    commitWorm(nextWorm)

    if (!ate) return

    stopMoving()
    playChomp()

    setJustAte(true)
    if (chompTimerRef.current !== null) {
      window.clearTimeout(chompTimerRef.current)
    }
    chompTimerRef.current = window.setTimeout(() => {
      chompTimerRef.current = null
      setJustAte(false)
    }, CHOMP_PULSE_MS)

    totalEatenRef.current += 1
    const nextEaten = eatenRef.current + 1
    eatenRef.current = nextEaten
    setEaten(nextEaten)

    if (nextEaten >= PHASE_FRUITS[phaseRef.current]) {
      commitFruit(null)
      modeRef.current = "phaseComplete"
      setMode("phaseComplete")
      playTada()
      return
    }

    // A minhoca para e só volta a andar quando a criança tocar na nova fruta
    commitFruit(spawnFruit(nextWorm, totalEatenRef.current))
  }, [commitFruit, commitWorm, playChomp, playTada, stopMoving])

  /** Handler do toque na fruta. Toques durante o movimento são no-op. */
  const goToFruit = useCallback(() => {
    if (modeRef.current !== "playing") return
    if (movingRef.current) return
    if (!fruitRef.current) return

    playPop()
    movingRef.current = true
    setIsMoving(true)
    moveTimerRef.current = window.setInterval(step, STEP_MS)
  }, [playPop, step])

  /**
   * Chamado quando a celebração de fase é dispensada.
   * Idempotente via modeRef: tap + auto-dismiss não avançam duas vezes.
   * O comprimento da minhoca persiste — crescer é a recompensa do jogo.
   */
  const advancePhase = useCallback(() => {
    if (modeRef.current !== "phaseComplete") return
    const next = phaseRef.current + 1
    if (next < TOTAL_PHASES) {
      phaseRef.current = next
      modeRef.current = "playing"
      eatenRef.current = 0
      setPhase(next)
      setEaten(0)
      commitFruit(spawnFruit(wormRef.current, totalEatenRef.current))
      setMode("playing")
    } else {
      modeRef.current = "finished"
      setMode("finished")
    }
  }, [commitFruit])

  const restart = useCallback(() => {
    stopMoving()
    if (chompTimerRef.current !== null) {
      window.clearTimeout(chompTimerRef.current)
      chompTimerRef.current = null
    }
    modeRef.current = "playing"
    phaseRef.current = 0
    eatenRef.current = 0
    totalEatenRef.current = 0
    setMode("playing")
    setPhase(0)
    setEaten(0)
    setJustAte(false)
    setDir("right")
    commitWorm(INITIAL_WORM)
    commitFruit(spawnFruit(INITIAL_WORM, 0))
  }, [commitFruit, commitWorm, stopMoving])

  return {
    mode,
    phase,
    eaten,
    goal: PHASE_FRUITS[phase],
    worm,
    fruit,
    dir,
    isMoving,
    justAte,
    goToFruit,
    advancePhase,
    restart,
  }
}
