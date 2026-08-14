import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft } from "@phosphor-icons/react"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import PuzzleArt from "@/components/game/PuzzleArt"
import PuzzlePieceDraggable from "@/components/game/PuzzlePieceDraggable"
import PuzzleSlot, { type RegisterSlot } from "@/components/game/PuzzleSlot"
import { usePuzzle, TOTAL_PHASES } from "@/hooks/usePuzzle"
import { PUZZLE_PHASES } from "@/data/puzzles"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { cn } from "@/lib/utils"

/** Margem extra ao redor de cada lugar no hit-test — mira generosa: só
 * existe UM lugar certo por peça e vizinhos se desempatam pela distância
 * ao centro. */
const SLOT_HIT_MARGIN = 32

const CELEBRATION_AUTO_DISMISS_MS = 3000

const VIEWBOX = 400

/** Colunas da bandeja por fase (2, 4 e 6 peças). */
const TRAY_COLS = ["grid-cols-2", "grid-cols-4", "grid-cols-3"]

export default function PuzzlePage() {
  const navigate = useNavigate()
  const { mode, phase, puzzle, pieces, placePiece, advancePhase, restart } = usePuzzle()
  const { playClick, playHop } = useSoundEffects()
  const isNavigating = useRef(false)
  const slotRectsRef = useRef(new Map<number, () => DOMRect>())

  const handleBack = useCallback(() => {
    if (isNavigating.current) return
    isNavigating.current = true
    playClick()
    navigate("/")
    setTimeout(() => {
      isNavigating.current = false
    }, 500)
  }, [navigate, playClick])

  const registerSlot: RegisterSlot = useCallback((slot, getRect) => {
    if (getRect) slotRectsRef.current.set(slot, getRect)
    else slotRectsRef.current.delete(slot)
  }, [])

  /** Lugar atingido pelo centro da peça solta — rects inflados p/ mira generosa. */
  const hitTest = useCallback((x: number, y: number): number | null => {
    let best: number | null = null
    let bestDist = Infinity
    for (const [slot, getRect] of slotRectsRef.current) {
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
        best = slot
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

  return (
    <div className="relative flex h-svh w-full flex-col items-center bg-gradient-to-b from-emerald-50 via-teal-50/50 to-sky-50 px-4 py-4 sm:py-6">
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
            style={{ ["--btn-color" as string]: "var(--color-crayon-turquoise)" }}
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

        {/* Área de jogo */}
        {(mode === "playing" || mode === "phaseComplete") && (
          <div className="relative z-10 flex w-full flex-1 flex-col items-center gap-4 pt-16 sm:pt-20">
            {/* Tabuleiro: guia esmaecida + lugares das peças */}
            <div
              role="group"
              aria-label={`Quebra-cabeça de ${puzzle.drawingName}`}
              className="relative aspect-square w-full max-w-[400px] rounded-[24px] border-[3px] border-white/80 bg-white/70 shadow-lg"
            >
              <PuzzleArt
                drawingId={puzzle.drawingId}
                fills={puzzle.fills}
                className="absolute inset-0 opacity-25 grayscale-[0.4]"
              />
              {pieces.map((piece) => (
                <PuzzleSlot
                  key={piece.id}
                  piece={piece}
                  puzzle={puzzle}
                  register={registerSlot}
                  style={{
                    left: `${(piece.clipRect.x / VIEWBOX) * 100}%`,
                    top: `${(piece.clipRect.y / VIEWBOX) * 100}%`,
                    width: `${(piece.clipRect.w / VIEWBOX) * 100}%`,
                    height: `${(piece.clipRect.h / VIEWBOX) * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Bandeja de peças embaralhadas */}
            <div className="flex w-full flex-1 items-center justify-center">
              <div
                className={cn(
                  "mx-auto grid w-full max-w-[440px] items-center gap-3 px-4 sm:gap-5",
                  TRAY_COLS[phase],
                )}
              >
                {pieces.map((piece, i) => (
                  <PuzzlePieceDraggable
                    key={piece.id}
                    piece={piece}
                    puzzle={puzzle}
                    onGrab={handleGrab}
                    hitTest={hitTest}
                    onDrop={placePiece}
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
              {PUZZLE_PHASES.map((p, i) => (
                <div
                  key={p.drawingId}
                  className="shape-wobble h-20 w-20 overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-md sm:h-24 sm:w-24"
                  style={{ ["--wobble-delay" as string]: `${i * 250}ms` }}
                >
                  <PuzzleArt
                    drawingId={p.drawingId}
                    fills={p.fills}
                    className="h-full w-full"
                  />
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
