import { useCallback, useEffect, useRef } from "react"
import redMp3 from "@/assets/audio/colors/red.mp3"
import blueMp3 from "@/assets/audio/colors/blue.mp3"
import yellowMp3 from "@/assets/audio/colors/yellow.mp3"
import pinkMp3 from "@/assets/audio/colors/pink.mp3"
import greenMp3 from "@/assets/audio/colors/green.mp3"
import orangeMp3 from "@/assets/audio/colors/orange.mp3"
import purpleMp3 from "@/assets/audio/colors/purple.mp3"
import whiteMp3 from "@/assets/audio/colors/white.mp3"
import type { DuckColor } from "./useDuckNest"

/**
 * Fala o nome da cor em inglês usando gravações de voz humana
 * (Wikimedia Commons/Lingua Libre — ver src/assets/audio/colors/README.md).
 *
 * Trocamos a Web Speech API por áudio gravado: a voz sintetizada variava
 * demais entre dispositivos e soava robótica. MP3 toca igual em todo lugar.
 *
 * A fala NÃO respeita prefers-reduced-motion: é conteúdo educativo
 * (ensinar cores em inglês), não decoração — a media query trata de
 * movimento visual.
 */
const COLOR_AUDIO: Record<DuckColor, string> = {
  red: redMp3,
  blue: blueMp3,
  yellow: yellowMp3,
  pink: pinkMp3,
  green: greenMp3,
  orange: orangeMp3,
  purple: purpleMp3,
  white: whiteMp3,
}

export function useSpeech() {
  const cacheRef = useRef<Map<DuckColor, HTMLAudioElement>>(new Map())
  const currentRef = useRef<HTMLAudioElement | null>(null)

  // Pré-carrega as 5 gravações (~21KB no total) para a primeira fala
  // sair sem atraso; interrompe fala pendente ao sair da página.
  useEffect(() => {
    const cache = cacheRef.current
    for (const [color, src] of Object.entries(COLOR_AUDIO) as [DuckColor, string][]) {
      if (cache.has(color)) continue
      const audio = new Audio(src)
      audio.preload = "auto"
      cache.set(color, audio)
    }
    return () => {
      currentRef.current?.pause()
      currentRef.current = null
    }
  }, [])

  const speak = useCallback((color: DuckColor) => {
    const audio = cacheRef.current.get(color)
    if (!audio) return
    // Cancela fala anterior — criança pode pegar outro pato rapidinho
    if (currentRef.current && currentRef.current !== audio) {
      currentRef.current.pause()
    }
    audio.currentTime = 0
    currentRef.current = audio
    // Autoplay policy: speak() sempre roda em resposta a pointerdown,
    // mas qualquer recusa do navegador é ignorada silenciosamente.
    audio.play().catch(() => {})
  }, [])

  return { speak }
}
