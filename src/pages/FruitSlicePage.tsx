import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft } from "@phosphor-icons/react"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import FruitField from "@/components/game/FruitField"
import FruitSVG, { FRUIT_KINDS } from "@/components/game/FruitSVG"
import { useFruitSlice, TOTAL_PHASES } from "@/hooks/useFruitSlice"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { cn } from "@/lib/utils"

const CELEBRATION_AUTO_DISMISS_MS = 3000

export default function FruitSlicePage() {
  const navigate = useNavigate()
  const {
    mode,
    phase,
    cutCount,
    config,
    resetSignal,
    handleFruitSliced,
    handleBombSliced,
    advancePhase,
    restart,
  } = useFruitSlice()
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
  const inRound = mode === "playing" || mode === "bombPause" || mode === "phaseComplete"

  return (
    <div className="relative flex h-svh w-full flex-col items-center overflow-hidden bg-gradient-to-b from-sky-50 via-emerald-50/50 to-lime-50 px-4 py-4 sm:py-6">
      <PaperBackground />
      <AnimatedBackground density="low" />

      <PageTransition className="flex w-full flex-1 flex-col">
        {/* Campo de jogo em tela cheia, atrás do topo (treme quando a bomba estoura) */}
        {inRound && (
          <div className={cn("absolute inset-0 z-10", mode === "bombPause" && "screen-shake")}>
            <FruitField
              config={config}
              active={mode === "playing"}
              resetSignal={resetSignal}
              onFruitSliced={handleFruitSliced}
              onBombSliced={handleBombSliced}
            />
          </div>
        )}

        {/* Topo flutuante: voltar + contador + indicador de fase */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Voltar para o início"
            className={cn(
              "btn-puffy relative flex min-h-(--spacing-touch-lg) min-w-(--spacing-touch-lg) items-center justify-center rounded-full border-[3px] border-white/60 px-4",
              "outline-none focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:ring-offset-2",
              "pointer-events-auto cursor-pointer select-none text-white",
            )}
            style={{ ["--btn-color" as string]: "var(--color-crayon-blue)" }}
          >
            <ArrowLeft size={32} weight="duotone" color="white" aria-hidden="true" />
          </button>

          {!isFinished && (
            <>
              <div
                aria-label={`${cutCount} de ${config.goal} frutas cortadas`}
                className="flex items-center gap-2 rounded-full bg-white/80 px-5 py-2 shadow-md"
              >
                <div aria-hidden="true" className="h-7 w-7">
                  <FruitSVG kind="apple" className="h-full w-full" />
                </div>
                <span className="font-heading text-xl font-extrabold text-[var(--color-crayon-red)]">
                  {cutCount} / {config.goal}
                </span>
              </div>

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
                        ? "bg-[var(--color-crayon-red)]"
                        : "bg-[var(--color-crayon-gray)]/40",
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Fim de jogo */}
        {isFinished && (
          <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              {FRUIT_KINDS.slice(0, 3).map((kind, i) => (
                <div
                  key={kind}
                  className="shape-wobble w-20 sm:w-24"
                  style={{ ["--wobble-delay" as string]: `${i * 250}ms` }}
                >
                  <FruitSVG
                    kind={kind}
                    className="h-auto w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
                </div>
              ))}
            </div>
            <h2 className="text-puffy text-center text-5xl text-[var(--color-crayon-red)]">
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
