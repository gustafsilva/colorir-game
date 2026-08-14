import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft } from "@phosphor-icons/react"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import FruitSVG from "@/components/game/FruitSVG"
import WormBoard from "@/components/game/WormBoard"
import { WormHeadSVG, WormSegmentSVG } from "@/components/game/WormSVG"
import { useWormGame, TOTAL_PHASES } from "@/hooks/useWormGame"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { cn } from "@/lib/utils"

const CELEBRATION_AUTO_DISMISS_MS = 3000

export default function WormGamePage() {
  const navigate = useNavigate()
  const {
    mode,
    phase,
    eaten,
    goal,
    worm,
    fruit,
    dir,
    justAte,
    goToFruit,
    advancePhase,
    restart,
  } = useWormGame()
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

  return (
    <div className="relative flex h-svh w-full flex-col items-center bg-gradient-to-b from-lime-50 via-green-50/50 to-emerald-50 px-4 py-4 sm:py-6">
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
            style={{ ["--btn-color" as string]: "var(--color-crayon-green)" }}
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
                      ? "bg-[var(--color-crayon-green)]"
                      : "bg-[var(--color-crayon-gray)]/40",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tabuleiro + contador */}
        {(mode === "playing" || mode === "phaseComplete") && (
          <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-3 pt-16 sm:pt-20">
            <div
              aria-label={`${eaten} de ${goal} frutas comidas`}
              className="flex items-center gap-2 rounded-full bg-white/80 px-5 py-2 shadow-md"
            >
              {fruit && (
                <div aria-hidden="true" className="h-7 w-7">
                  <FruitSVG kind={fruit.kind} className="h-full w-full" />
                </div>
              )}
              <span className="font-heading text-xl font-extrabold text-[var(--color-crayon-green)]">
                {eaten} / {goal}
              </span>
            </div>

            <WormBoard
              worm={worm}
              fruit={fruit}
              dir={dir}
              justAte={justAte}
              onFruitTap={goToFruit}
            />
          </div>
        )}

        {/* Fim de jogo */}
        {isFinished && (
          <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-6">
            <div className="flex items-center">
              <div
                className="shape-wobble h-16 w-16 sm:h-20 sm:w-20"
                style={{ ["--wobble-delay" as string]: "0ms" }}
              >
                <WormHeadSVG dir="right" className="h-full w-full" />
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="shape-wobble -ml-3 h-14 w-14 sm:h-16 sm:w-16"
                  style={{ ["--wobble-delay" as string]: `${i * 200}ms` }}
                >
                  <WormSegmentSVG tone={(i % 2) as 0 | 1} className="h-full w-full" />
                </div>
              ))}
            </div>
            <p className="font-heading text-2xl font-extrabold text-[var(--color-crayon-green)]">
              {worm.length} segmentos!
            </p>
            <h2 className="text-puffy text-center text-5xl text-[var(--color-crayon-green)]">
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
              style={{ ["--btn-color" as string]: "var(--color-crayon-orange)" }}
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
