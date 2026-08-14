import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft } from "@phosphor-icons/react"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import ShapeDraggable from "@/components/game/ShapeDraggable"
import ShapeSlot, { type RegisterSlot } from "@/components/game/ShapeSlot"
import ShapeSVG from "@/components/game/ShapeSVG"
import { useShapeFit, TOTAL_PHASES, type ShapeId } from "@/hooks/useShapeFit"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { cn } from "@/lib/utils"

/** Margem extra ao redor de cada buraco no hit-test. Menor que a dos ninhos:
 * os buracos ficam lado a lado na prancha e margens grandes se sobreporiam
 * (o desempate por distância ao centro resolve o resto). */
const SLOT_HIT_MARGIN = 24

const CELEBRATION_AUTO_DISMISS_MS = 3000

export default function ShapeFitPage() {
  const navigate = useNavigate()
  const { mode, phase, pieces, holeOrder, dropPiece, advancePhase, restart } =
    useShapeFit()
  const { playClick, playHop } = useSoundEffects()
  const isNavigating = useRef(false)
  const slotRectsRef = useRef(new Map<ShapeId, () => DOMRect>())

  const handleBack = useCallback(() => {
    if (isNavigating.current) return
    isNavigating.current = true
    playClick()
    navigate("/")
    setTimeout(() => {
      isNavigating.current = false
    }, 500)
  }, [navigate, playClick])

  const registerSlot: RegisterSlot = useCallback((shape, getRect) => {
    if (getRect) slotRectsRef.current.set(shape, getRect)
    else slotRectsRef.current.delete(shape)
  }, [])

  /** Buraco atingido pelo centro da peça solta — rects inflados p/ mira generosa. */
  const hitTest = useCallback((x: number, y: number): ShapeId | null => {
    let best: ShapeId | null = null
    let bestDist = Infinity
    for (const [shape, getRect] of slotRectsRef.current) {
      const rect = getRect()
      const inside =
        x >= rect.left - SLOT_HIT_MARGIN &&
        x <= rect.right + SLOT_HIT_MARGIN &&
        y >= rect.top - SLOT_HIT_MARGIN &&
        y <= rect.bottom + SLOT_HIT_MARGIN
      if (!inside) continue
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = (x - cx) ** 2 + (y - cy) ** 2
      if (dist < bestDist) {
        bestDist = dist
        best = shape
      }
    }
    return best
  }, [])

  const handleGrab = useCallback(() => {
    playHop()
  }, [playHop])

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
  const gridCols = holeOrder.length === 3 ? "grid-cols-3" : "grid-cols-4"

  return (
    <div className="relative flex h-svh w-full flex-col items-center bg-gradient-to-b from-amber-50 via-orange-50/50 to-yellow-50 px-4 py-4 sm:py-6">
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
                      ? "bg-[var(--color-crayon-orange)]"
                      : "bg-[var(--color-crayon-gray)]/40",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Área de jogo */}
        {(mode === "playing" || mode === "phaseComplete") && (
          <div className="relative z-10 flex w-full flex-1 flex-col items-center pt-20 sm:pt-24">
            {/* Prancha de madeira com os buracos */}
            <div className="relative mx-auto w-full max-w-[560px] rounded-[2rem] border-b-8 border-amber-900/30 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 p-5 shadow-[0_10px_24px_rgba(120,70,20,0.35),inset_0_2px_6px_rgba(255,255,255,0.45)] sm:p-7">
              {/* Veios da madeira */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-25 [background:repeating-linear-gradient(100deg,transparent_0_18px,rgba(120,60,10,0.25)_18px_20px)]"
              />
              <div className={cn("relative grid items-center gap-4 sm:gap-6", gridCols)}>
                {holeOrder.map((shape) => (
                  <ShapeSlot
                    key={shape}
                    shape={shape}
                    pieceColor={pieces.find((p) => p.shape === shape)!.color}
                    occupied={pieces.some((p) => p.shape === shape && p.dropped)}
                    register={registerSlot}
                  />
                ))}
              </div>
            </div>

            {/* Bandeja de peças embaralhadas */}
            <div className="flex w-full flex-1 items-center justify-center">
              <div
                className={cn(
                  "mx-auto grid w-full max-w-[520px] items-center gap-4 px-6 sm:gap-8",
                  gridCols,
                )}
              >
                {pieces.map((piece, i) => (
                  <ShapeDraggable
                    key={piece.id}
                    piece={piece}
                    onGrab={handleGrab}
                    hitTest={hitTest}
                    onDrop={dropPiece}
                    wobbleDelay={i * 300}
                    arriveDelay={i * 200}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fim de jogo */}
        {isFinished && (
          <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              {(
                [
                  ["star", "var(--color-crayon-yellow)"],
                  ["circle", "var(--color-crayon-red)"],
                  ["triangle", "var(--color-crayon-green)"],
                ] as [ShapeId, string][]
              ).map(([shape, color], i) => (
                <div
                  key={shape}
                  className="shape-wobble w-20 sm:w-24"
                  style={{ ["--wobble-delay" as string]: `${i * 250}ms` }}
                >
                  <ShapeSVG
                    shape={shape}
                    color={color}
                    className="h-auto w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
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
