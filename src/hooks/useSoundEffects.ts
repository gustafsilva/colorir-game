import { useCallback, useEffect, useMemo, useRef } from "react"

type Waveform = OscillatorType

interface SoundEffects {
  playPop: () => void
  playSplash: () => void
  playWhoosh: () => void
  playSparkle: () => void
  playTada: () => void
  playClick: () => void
  playHop: () => void
  playQuack: () => void
  playSlice: () => void
  playBoom: () => void
}

function getReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function useSoundEffects(): SoundEffects {
  const ctxRef = useRef<AudioContext | null>(null)
  const reducedMotionRef = useRef(getReducedMotion())

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches
    }
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    return () => {
      ctxRef.current?.close()
      ctxRef.current = null
    }
  }, [])

  const getContext = useCallback(async (): Promise<AudioContext | null> => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === "suspended") {
      try {
        await ctxRef.current.resume()
      } catch {
        return null
      }
    }
    return ctxRef.current
  }, [])

  const playTone = useCallback(
    (
      frequency: number,
      duration: number,
      waveform: Waveform,
      gain: number,
      ctx: AudioContext,
      startOffset = 0,
      detune = 0,
    ) => {
      const now = ctx.currentTime + startOffset
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = waveform
      osc.frequency.setValueAtTime(frequency, now)
      if (detune) osc.detune.setValueAtTime(detune, now)

      // Gentle envelope: quick attack, natural decay
      const attack = Math.min(0.01, duration * 0.1)
      const release = duration * 0.3

      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(gain, now + attack)
      gainNode.gain.setValueAtTime(gain, now + duration - release)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + duration)
    },
    [],
  )

  const playPop = useCallback(async () => {
    if (reducedMotionRef.current) return
    const ctx = await getContext()
    if (!ctx) return

    // High-pitched xylophone-like pop with quick pitch drop
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = "triangle"
    osc.frequency.setValueAtTime(1200, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.005)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.1)
  }, [getContext])

  const playSplash = useCallback(async () => {
    const ctx = await getContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Noise-like swoosh using multiple detuned oscillators
    const frequencies = [300, 450, 600]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq + i * 20, now)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.2)

      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.2)
    })
  }, [getContext])

  const playWhoosh = useCallback(async () => {
    if (reducedMotionRef.current) return
    const ctx = await getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    // Soft descending sweep
    osc.type = "sine"
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.15)
  }, [getContext])

  const playSparkle = useCallback(async () => {
    if (reducedMotionRef.current) return
    const ctx = await getContext()
    if (!ctx) return

    // Ascending chime notes like a tiny glockenspiel
    const notes = [1047, 1319, 1568, 2093] // C6, E6, G6, C7
    notes.forEach((freq, i) => {
      playTone(freq, 0.15, "sine", 0.15, ctx, i * 0.08, i * 5)
    })
  }, [getContext, playTone])

  const playTada = useCallback(async () => {
    const ctx = await getContext()
    if (!ctx) return

    // Celebratory ascending fanfare — pentatonic scale
    const notes = [523, 659, 784, 880, 1047, 1319] // C5, E5, G5, A5, C6, E6
    const noteDuration = 0.12

    notes.forEach((freq, i) => {
      // Main tone (triangle for warmth)
      playTone(freq, noteDuration + 0.05, "triangle", 0.2, ctx, i * noteDuration)
      // Octave shimmer on top
      playTone(
        freq * 2,
        noteDuration,
        "sine",
        0.08,
        ctx,
        i * noteDuration + 0.01,
      )
    })

    // Final sustain chord
    const chordStart = notes.length * noteDuration
    const chordNotes = [1047, 1319, 1568] // C6, E6, G6
    chordNotes.forEach((freq) => {
      playTone(freq, 0.3, "sine", 0.12, ctx, chordStart)
    })
  }, [getContext, playTone])

  const playHop = useCallback(async () => {
    if (reducedMotionRef.current) return
    const ctx = await getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    // Ascending boing — coelho saindo da toca
    osc.type = "triangle"
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.08)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.005)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.12)
  }, [getContext])

  const playQuack = useCallback(async () => {
    if (reducedMotionRef.current) return
    const ctx = await getContext()
    if (!ctx) return

    const now = ctx.currentTime

    // "Quá-quá" — dois pulsos curtos nasais (sawtooth) com queda de pitch
    const pulses = [0, 0.14]
    pulses.forEach((offset) => {
      const start = now + offset
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(320, start)
      osc.frequency.exponentialRampToValueAtTime(200, start + 0.1)

      gainNode.gain.setValueAtTime(0, start)
      gainNode.gain.linearRampToValueAtTime(0.14, start + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.12)

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.12)
    })
  }, [getContext])

  const playSlice = useCallback(async () => {
    if (reducedMotionRef.current) return
    const ctx = await getContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Swish ascendente rápido — a "lâmina" passando
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(500, now)
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.09)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.16, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.12)

    // "Toc" suculento logo atrás — a fruta abrindo
    playTone(900, 0.08, "triangle", 0.14, ctx, 0.05)
  }, [getContext, playTone])

  // Sem gate de reduced-motion: é o feedback essencial de ter cortado a bomba.
  const playBoom = useCallback(async () => {
    const ctx = await getContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Slide-whistle descendente — explosão cômica, não assustadora
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc.type = "triangle"
    osc.frequency.setValueAtTime(900, now)
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.32)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.35)

    // Thump grave abafado no chão…
    const thump = ctx.createOscillator()
    const thumpGain = ctx.createGain()

    thump.type = "sine"
    thump.frequency.setValueAtTime(100, now + 0.3)
    thump.frequency.exponentialRampToValueAtTime(55, now + 0.48)

    thumpGain.gain.setValueAtTime(0, now + 0.3)
    thumpGain.gain.linearRampToValueAtTime(0.22, now + 0.32)
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    thump.connect(thumpGain)
    thumpGain.connect(ctx.destination)
    thump.start(now + 0.3)
    thump.stop(now + 0.5)

    // …e um "plop" bobinho para fechar com graça
    playTone(320, 0.09, "triangle", 0.15, ctx, 0.5)
  }, [getContext, playTone])

  const playClick = useCallback(async () => {
    if (reducedMotionRef.current) return
    const ctx = await getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    // Very short, subtle tick
    osc.type = "square"
    osc.frequency.setValueAtTime(800, now)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.002)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.05)
  }, [getContext])

  return useMemo(
    () => ({
      playPop,
      playSplash,
      playWhoosh,
      playSparkle,
      playTada,
      playClick,
      playHop,
      playQuack,
      playSlice,
      playBoom,
    }),
    [playPop, playSplash, playWhoosh, playSparkle, playTada, playClick, playHop, playQuack, playSlice, playBoom],
  )
}
