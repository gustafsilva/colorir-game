import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft, Balloon } from "@phosphor-icons/react"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import DuckDraggable from "@/components/game/DuckDraggable"
import NestSlot, { type RegisterNest } from "@/components/game/NestSlot"
import BalloonField from "@/components/game/BalloonField"
import DuckSVG from "@/components/game/DuckSVG"
import {
  useDuckNest,
  DUCK_COLOR_VARS,
  TOTAL_PHASES,
  type DuckColor,
} from "@/hooks/useDuckNest"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { useSpeech } from "@/hooks/useSpeech"
import { cn } from "@/lib/utils"

/** Margem extra ao redor de cada ninho no hit-test — mira generosa p/ 2-5 anos. */
const NEST_HIT_MARGIN = 32

const CELEBRATION_AUTO_DISMISS_MS = 3000

export default function DuckNestPage() {
  const navigate = useNavigate()
  const {
    mode,
    phase,
    ducks,
    nestOrder,
    balloonTimeLeft,
    dropDuck,
    advancePhase,
    restart,
  } = useDuckNest()
  const { playClick, playHop, playPop } = useSoundEffects()
  const { speak } = useSpeech()
  const isNavigating = useRef(false)
  const nestRectsRef = useRef(new Map<DuckColor, () => DOMRect>())

  const handleBack = useCallback(() => {
    if (isNavigating.current) return
    isNavigating.current = true
    playClick()
    navigate("/")
    setTimeout(() => {
      isNavigating.current = false
    }, 500)
  }, [navigate, playClick])

  const registerNest: RegisterNest = useCallback((color, getRect) => {
    if (getRect) nestRectsRef.current.set(color, getRect)
    else nestRectsRef.current.delete(color)
  }, [])

  /** Ninho atingido pelo centro do patinho solto — rects inflados p/ mira generosa. */
  const hitTest = useCallback((x: number, y: number): DuckColor | null => {
    let best: DuckColor | null = null
    let bestDist = Infinity
    for (const [color, getRect] of nestRectsRef.current) {
      const rect = getRect()
      const inside =
        x >= rect.left - NEST_HIT_MARGIN &&
        x <= rect.right + NEST_HIT_MARGIN &&
        y >= rect.top - NEST_HIT_MARGIN &&
        y <= rect.bottom + NEST_HIT_MARGIN
      if (!inside) continue
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = (x - cx) ** 2 + (y - cy) ** 2
      if (dist < bestDist) {
        bestDist = dist
        best = color
      }
    }
    return best
  }, [])

  /** Pegou o patinho: fala a cor em inglês (educativo) + sonzinho de pegar. */
  const handleGrab = useCallback(
    (color: DuckColor) => {
      playHop()
      speak(color)
    },
    [playHop, speak],
  )

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

  const isBalloonMode = mode === "balloons"
  const isFinished = mode === "finished"

  return (
    <div className="relative flex h-svh w-full flex-col items-center bg-gradient-to-b from-sky-50 via-yellow-50/50 to-emerald-50 px-4 py-4 sm:py-6">
      <PaperBackground />
      <AnimatedBackground density="low" />

      <PageTransition className="flex w-full flex-1 flex-col">
        {/* Topo flutuante sobre o lago: voltar + indicador de fase ou timer dos balões */}
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

          {isBalloonMode ? (
            <div
              aria-live="polite"
              className="flex items-center gap-2 rounded-full bg-white/80 px-5 py-2 shadow-md"
            >
              <Balloon
                size={32}
                weight="duotone"
                color="var(--color-crayon-red)"
                aria-hidden="true"
              />
              <span className="text-puffy-sm text-3xl text-[var(--color-crayon-blue)]">
                {balloonTimeLeft}
              </span>
            </div>
          ) : (
            !isFinished && (
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
                        ? "bg-[var(--color-crayon-yellow)]"
                        : "bg-[var(--color-crayon-gray)]/40",
                    )}
                  />
                ))}
              </div>
            )
          )}
        </div>

        {/* Área de jogo */}
        {(mode === "playing" || mode === "phaseComplete") && (
          <div className="relative z-10 flex w-full flex-1 flex-col items-center">
            {/* Lago — grudado no topo e desce até a grama; o cabeçalho flutua sobre a água */}
            <div className="relative left-1/2 -mt-4 flex w-screen flex-1 -translate-x-1/2 flex-col justify-center bg-gradient-to-b from-sky-200/90 via-blue-200/90 to-blue-300/90 pb-7 pt-20 shadow-[inset_0_-6px_14px_rgba(30,100,200,0.22)] sm:-mt-6 sm:pt-24">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <span className="lake-wave absolute left-[4%] top-[16%] w-10 rounded-full border-t-[3px] border-white/60" />
                <span
                  className="lake-wave absolute left-[22%] bottom-[18%] w-12 rounded-full border-t-[3px] border-white/50"
                  style={{ ["--wave-delay" as string]: "0.6s" }}
                />
                <span
                  className="lake-wave absolute left-[46%] top-[24%] w-8 rounded-full border-t-[3px] border-white/50"
                  style={{ ["--wave-delay" as string]: "1.2s" }}
                />
                <span
                  className="lake-wave absolute right-[20%] bottom-[14%] w-12 rounded-full border-t-[3px] border-white/55"
                  style={{ ["--wave-delay" as string]: "1.8s" }}
                />
                <span
                  className="lake-wave absolute right-[5%] top-[30%] w-9 rounded-full border-t-[3px] border-white/50"
                  style={{ ["--wave-delay" as string]: "2.4s" }}
                />
              </div>

              <div className="mx-auto grid w-full max-w-[560px] grid-cols-3 items-center gap-4 px-6 sm:gap-8">
                {ducks.map((duck, i) => (
                  <DuckDraggable
                    key={duck.id}
                    duck={duck}
                    onGrab={handleGrab}
                    hitTest={hitTest}
                    onDrop={dropDuck}
                    waddleDelay={i * 300}
                    arriveDelay={i * 250}
                  />
                ))}
              </div>
            </div>

            {/* Terra — faixa de grama de tela inteira até o rodapé */}
            <div className="relative left-1/2 -mb-4 w-screen -translate-x-1/2 border-t-[6px] border-emerald-400/60 bg-gradient-to-b from-emerald-300/90 via-emerald-200/85 to-amber-200/90 pb-6 pt-6 sm:-mb-6">
              <div className="mx-auto grid w-full max-w-[640px] grid-cols-3 items-end gap-4 px-6 sm:gap-8">
                {nestOrder.map((color) => (
                  <NestSlot
                    key={color}
                    color={color}
                    occupied={ducks.some((d) => d.color === color && d.dropped)}
                    register={registerNest}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bônus: estourar balões por 1 minuto */}
        {isBalloonMode && (
          <div className="relative z-10 w-full flex-1">
            <p className="text-puffy-sm pointer-events-none pt-20 text-center text-xl text-[var(--color-crayon-purple)] sm:pt-24">
              Estoure os balões!
            </p>
            <BalloonField onPop={playPop} />
          </div>
        )}

        {/* Fim de jogo */}
        {isFinished && (
          <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-6">
            <div className="flex items-end gap-2">
              {(["red", "yellow", "blue"] as DuckColor[]).map((color, i) => (
                <div
                  key={color}
                  className="duck-waddle w-20 sm:w-24"
                  style={{ ["--waddle-delay" as string]: `${i * 250}ms` }}
                >
                  <DuckSVG color={DUCK_COLOR_VARS[color]} className="h-auto w-full" />
                </div>
              ))}
            </div>
            <h2 className="text-puffy text-center text-5xl text-[var(--color-crayon-orange)]">
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
