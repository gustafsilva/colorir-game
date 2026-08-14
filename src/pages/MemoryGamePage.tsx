import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft } from "@phosphor-icons/react"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import MemoryCard from "@/components/game/MemoryCard"
import { MEMORY_FACES } from "@/components/game/MemoryFaces"
import { useMemoryGame, TOTAL_PHASES } from "@/hooks/useMemoryGame"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { cn } from "@/lib/utils"

const CELEBRATION_AUTO_DISMISS_MS = 3000

/** Colunas e largura máxima do tabuleiro por fase (4, 6 e 8 cartas). */
const PHASE_GRID = [
  { cols: "grid-cols-2", maxW: "max-w-[340px]" },
  { cols: "grid-cols-3", maxW: "max-w-[460px]" },
  { cols: "grid-cols-4", maxW: "max-w-[560px]" },
]

export default function MemoryGamePage() {
  const navigate = useNavigate()
  const { mode, phase, cards, flipCard, advancePhase, restart } = useMemoryGame()
  const { playClick } = useSoundEffects()
  const isNavigating = useRef(false)

  const handleBack = useCallback(() => {
    if (isNavigating.current) return
    isNavigating.current = true
    playClick()
    navigate("/")
    setTimeout(() => {
      isNavigating.current = false
    }, 500)
  }, [navigate, playClick])

  // Auto-dismiss da celebração de fase (tap também avança; advancePhase é idempotente)
  useEffect(() => {
    if (mode !== "phaseComplete") return
    const timer = window.setTimeout(advancePhase, CELEBRATION_AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [mode, advancePhase])

  const handleRestart = useCallback(() => {
    playClick()
    restart()
  }, [playClick, restart])

  const isFinished = mode === "finished"
  const grid = PHASE_GRID[phase]

  return (
    <div className="relative flex h-svh w-full flex-col items-center bg-gradient-to-b from-cyan-50 via-sky-50/50 to-indigo-50 px-4 py-4 sm:py-6">
      <PaperBackground />
      <AnimatedBackground density="low" />

      <PageTransition className="flex w-full flex-1 flex-col">
        {/* Topo flutuante: voltar + indicador de fase */}
        <div className="absolute inset-x-0 top-0 z-20 flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Voltar para o início"
            className={cn(
              "btn-puffy relative flex min-h-(--spacing-touch-lg) min-w-(--spacing-touch-lg) items-center justify-center rounded-full border-[3px] border-white/60 px-4",
              "outline-none focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:ring-offset-2",
              "cursor-pointer select-none text-white",
            )}
            style={{ ["--btn-color" as string]: "var(--color-crayon-blue)" }}
          >
            <ArrowLeft size={32} weight="duotone" color="white" aria-hidden="true" />
          </button>

          {!isFinished && (
            <div
              aria-label={`Fase ${phase + 1} de ${TOTAL_PHASES}`}
              className="flex items-center gap-2 rounded-full bg-white/80 px-5 py-2 shadow-md"
            >
              {Array.from({ length: TOTAL_PHASES }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={cn(
                    "block h-4 w-4 rounded-full border-2 border-white shadow-sm transition-colors",
                    i <= phase
                      ? "bg-[var(--color-crayon-turquoise)]"
                      : "bg-[var(--color-crayon-gray)]/40",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tabuleiro */}
        {(mode === "playing" || mode === "phaseComplete") && (
          <div className="relative z-10 flex w-full flex-1 items-center justify-center pt-16 sm:pt-20">
            <div
              className={cn("grid w-full gap-3 px-2 sm:gap-4", grid.cols, grid.maxW)}
            >
              {cards.map((card, i) => (
                <MemoryCard
                  key={card.id}
                  face={card.face}
                  state={card.state}
                  onFlip={() => flipCard(card.id)}
                  dealDelay={i * 120}
                />
              ))}
            </div>
          </div>
        )}

        {/* Fim de jogo */}
        {isFinished && (
          <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              {(["rabbit", "strawberry", "duck"] as const).map((face, i) => (
                <div
                  key={face}
                  className="shape-wobble h-20 w-20 sm:h-24 sm:w-24"
                  style={{ ["--wobble-delay" as string]: `${i * 250}ms` }}
                >
                  {MEMORY_FACES[face].render()}
                </div>
              ))}
            </div>
            <h2 className="text-puffy text-center text-5xl text-[var(--color-crayon-turquoise)]">
              Parabéns!
            </h2>
            <button
              type="button"
              onClick={handleRestart}
              className={cn(
                "btn-puffy min-h-(--spacing-touch-lg) rounded-full border-[3px] border-white/60 px-8 py-3",
                "outline-none focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:ring-offset-2",
                "cursor-pointer select-none font-heading text-2xl font-extrabold text-white",
              )}
              style={{ ["--btn-color" as string]: "var(--color-crayon-green)" }}
            >
              Jogar de novo
            </button>
          </div>
        )}
      </PageTransition>

      {/* Celebração de fase: tap ou 3s avançam (advancePhase é idempotente) */}
      <CelebrationOverlay
        milestone={
          mode === "phaseComplete"
            ? phase < TOTAL_PHASES - 1
              ? "three-quarters"
              : "complete"
            : "none"
        }
        onDismiss={advancePhase}
      />
    </div>
  )
}
