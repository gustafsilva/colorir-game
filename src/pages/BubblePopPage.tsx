import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft } from "@phosphor-icons/react"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import BubbleField from "@/components/game/BubbleField"
import BubbleSVG from "@/components/game/BubbleSVG"
import {
  useBubblePop,
  TOTAL_PHASES,
  BUBBLE_COLOR_VARS,
  BUBBLE_COLORS,
  BUBBLE_LABELS_PLURAL,
} from "@/hooks/useBubblePop"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { useSpeech } from "@/hooks/useSpeech"
import { cn } from "@/lib/utils"

const CELEBRATION_AUTO_DISMISS_MS = 3000

export default function BubblePopPage() {
  const navigate = useNavigate()
  const {
    mode,
    phase,
    popCount,
    goal,
    targetColor,
    bubbles,
    popBubble,
    escapeBubble,
    advancePhase,
    restart,
  } = useBubblePop()
  const { playClick } = useSoundEffects()
  const { speak } = useSpeech()
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

  // Anuncia a cor-alvo quando a fase com alvo começa (a transição de fase
  // normalmente segue um toque na celebração; recusas de autoplay são
  // engolidas pelo useSpeech).
  useEffect(() => {
    if (targetColor) speak(targetColor)
  }, [targetColor, speak])

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

  const handleRepeatTarget = useCallback(() => {
    if (targetColor) speak(targetColor)
  }, [speak, targetColor])

  const isFinished = mode === "finished"

  return (
    <div className="relative flex h-svh w-full flex-col items-center bg-gradient-to-b from-sky-100 via-cyan-50 to-blue-50 px-4 py-4 sm:py-6">
      <PaperBackground />
      <AnimatedBackground density="low" />

      <PageTransition className="flex w-full flex-1 flex-col">
        {/* Topo flutuante: voltar + contador + indicador de fase */}
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
            <div className="flex items-center gap-2">
              <div
                aria-label={`${popCount} de ${goal} bolhas estouradas`}
                className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-md"
              >
                <div aria-hidden="true" className="h-6 w-6">
                  <BubbleSVG
                    color={
                      targetColor
                        ? BUBBLE_COLOR_VARS[targetColor]
                        : "var(--color-crayon-blue)"
                    }
                    className="h-full w-full"
                  />
                </div>
                <span className="font-heading text-xl font-extrabold text-[var(--color-crayon-blue)]">
                  {popCount} / {goal}
                </span>
              </div>

              <div
                aria-label={`Fase ${phase + 1} de ${TOTAL_PHASES}`}
                className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-md"
              >
                {Array.from({ length: TOTAL_PHASES }).map((_, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className={cn(
                      "block h-4 w-4 rounded-full border-2 border-white shadow-sm transition-colors",
                      i <= phase
                        ? "bg-[var(--color-crayon-blue)]"
                        : "bg-[var(--color-crayon-gray)]/40",
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Banner da cor-alvo (fases 2–3): toque repete o áudio da cor */}
        {!isFinished && targetColor && (
          <div className="absolute inset-x-0 top-16 z-20 flex justify-center sm:top-20">
            <button
              type="button"
              onClick={handleRepeatTarget}
              aria-label={`Estoure as bolhas ${BUBBLE_LABELS_PLURAL[targetColor]}`}
              className="flex min-h-(--spacing-touch) cursor-pointer items-center gap-3 rounded-full border-[3px] border-white/70 bg-white/85 px-5 py-2 shadow-md outline-none select-none focus-visible:ring-4 focus-visible:ring-white/70"
            >
              <div aria-hidden="true" className="shape-wobble h-10 w-10">
                <BubbleSVG
                  color={BUBBLE_COLOR_VARS[targetColor]}
                  className="h-full w-full"
                />
              </div>
              <span
                aria-hidden="true"
                className="font-heading text-lg font-extrabold text-[var(--color-crayon-blue)]"
              >
                Estoure as bolhas {BUBBLE_LABELS_PLURAL[targetColor]}!
              </span>
            </button>
          </div>
        )}

        {/* Campo de bolhas */}
        {(mode === "playing" || mode === "phaseComplete") && (
          <div className="relative z-10 w-full flex-1">
            <BubbleField bubbles={bubbles} onPop={popBubble} onEscape={escapeBubble} />
          </div>
        )}

        {/* Fim de jogo */}
        {isFinished && (
          <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              {BUBBLE_COLORS.slice(0, 5).map((color, i) => (
                <div
                  key={color}
                  className="shape-wobble h-14 w-14 sm:h-16 sm:w-16"
                  style={{ ["--wobble-delay" as string]: `${i * 200}ms` }}
                >
                  <BubbleSVG
                    color={BUBBLE_COLOR_VARS[color]}
                    className="h-full w-full"
                  />
                </div>
              ))}
            </div>
            <h2 className="text-puffy text-center text-5xl text-[var(--color-crayon-blue)]">
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
              style={{ ["--btn-color" as string]: "var(--color-crayon-turquoise)" }}
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
