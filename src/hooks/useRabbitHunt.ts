import { useCallback, useEffect, useRef, useState } from "react"
import { useHighScore } from "./useHighScore"
import { useSoundEffects } from "./useSoundEffects"

const HIGH_SCORE_KEY = "rabbit-hunt-highscore"

const VISIBLE_INITIAL = 1500
const VISIBLE_MIN = 700
const VISIBLE_DECAY = 50

const INTERVAL_INITIAL = 800
const INTERVAL_MIN = 300
const INTERVAL_DECAY = 25

const LEVEL_STEP = 3
const NEW_RECORD_FLASH_MS = 3000

function levelFromScore(score: number) {
  return Math.min(16, Math.floor(score / LEVEL_STEP))
}

function visibleMs(level: number) {
  return Math.max(VISIBLE_MIN, VISIBLE_INITIAL - level * VISIBLE_DECAY)
}

function intervalMs(level: number) {
  return Math.max(INTERVAL_MIN, INTERVAL_INITIAL - level * INTERVAL_DECAY)
}

function pickIndex(previous: number | null): number {
  let next = Math.floor(Math.random() * 9)
  if (previous !== null && next === previous) {
    next = (next + 1 + Math.floor(Math.random() * 8)) % 9
  }
  return next
}

export function useRabbitHunt() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)

  const { highScore, submit } = useHighScore(HIGH_SCORE_KEY)
  const { playHop, playSparkle, playTada } = useSoundEffects()

  const appearTimerRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const recordTimerRef = useRef<number | null>(null)
  const lastIndexRef = useRef<number | null>(null)
  const activeRef = useRef<number | null>(null)
  const scoreRef = useRef(0)
  const caughtRef = useRef(false)
  const scheduleRef = useRef<(delayMs: number) => void>(() => {})
  const playHopRef = useRef(playHop)

  useEffect(() => {
    activeRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    playHopRef.current = playHop
  }, [playHop])

  // Define a função de agendamento (com auto-referência via ref).
  // Mantém estável para o ciclo de vida do hook — evita reset do loop a cada render.
  useEffect(() => {
    scheduleRef.current = (delayMs: number) => {
      appearTimerRef.current = window.setTimeout(() => {
        const level = levelFromScore(scoreRef.current)
        const index = pickIndex(lastIndexRef.current)
        lastIndexRef.current = index
        caughtRef.current = false
        setActiveIndex(index)
        playHopRef.current()

        hideTimerRef.current = window.setTimeout(() => {
          setActiveIndex(null)
          scheduleRef.current(intervalMs(levelFromScore(scoreRef.current)))
        }, visibleMs(level))
      }, delayMs)
    }
  }, [])

  const clearTimers = useCallback(() => {
    if (appearTimerRef.current !== null) {
      window.clearTimeout(appearTimerRef.current)
      appearTimerRef.current = null
    }
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  // Inicia o loop. Em StrictMode dev o effect roda 2x (mount/unmount/mount):
  // o cleanup limpa os timers do primeiro mount e o segundo mount reagenda.
  useEffect(() => {
    scheduleRef.current(intervalMs(0))
    return () => {
      clearTimers()
      if (recordTimerRef.current !== null) {
        window.clearTimeout(recordTimerRef.current)
        recordTimerRef.current = null
      }
    }
  }, [clearTimers])

  const catchRabbit = useCallback(
    (index: number) => {
      if (caughtRef.current) return
      if (activeRef.current === null || index !== activeRef.current) return

      caughtRef.current = true
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }

      setActiveIndex(null)
      const next = scoreRef.current + 1
      scoreRef.current = next
      setScore(next)
      playSparkle()

      const isRecord = submit(next)
      if (isRecord && next > 0) {
        setIsNewRecord(true)
        playTada()
        if (recordTimerRef.current !== null) {
          window.clearTimeout(recordTimerRef.current)
        }
        recordTimerRef.current = window.setTimeout(() => {
          setIsNewRecord(false)
          recordTimerRef.current = null
        }, NEW_RECORD_FLASH_MS)
      }

      scheduleRef.current(intervalMs(levelFromScore(next)))
    },
    [playSparkle, playTada, submit],
  )

  const reset = useCallback(() => {
    clearTimers()
    setActiveIndex(null)
    setScore(0)
    scoreRef.current = 0
    lastIndexRef.current = null
    caughtRef.current = false
    setIsNewRecord(false)
    scheduleRef.current(intervalMs(0))
  }, [clearTimers])

  return {
    activeIndex,
    score,
    highScore,
    isNewRecord,
    catchRabbit,
    reset,
  }
}
