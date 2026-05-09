import { useCallback, useRef } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft, ArrowCounterClockwise, Eraser } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface ActionBarProps {
  onUndo: () => void
  onClear: () => void
  canUndo: boolean
  canClear: boolean
}

/**
 * Child-friendly ActionBar for ages 2-5.
 *
 * Layout: [Back] ·················· [Undo] [Clear]
 *
 * Design decisions for toddlers & preschoolers:
 * - 56px minimum touch targets (--spacing-touch-lg)
 * - Fully rounded pill shapes — no sharp corners
 * - Puffy 3D buttons via .btn-puffy utility (gradient + multi-shadow)
 * - Phosphor Duotone icons at 32px for high visibility & playful feel
 * - Bounce-tap animation combined with "sink" via :active
 */

const buttonBase = cn(
  "btn-puffy",
  "relative flex items-center justify-center",
  "min-h-(--spacing-touch-lg) min-w-(--spacing-touch-lg) px-4",
  "rounded-full",
  "border-[3px] border-white/60",
  "outline-none focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:ring-offset-2",
  "active:animate-[bounce-tap_300ms_ease-out]",
  "motion-reduce:active:animate-none",
  "cursor-pointer select-none",
  "text-white",
)

const ICON_SIZE = 32

export default function ActionBar({
  onUndo,
  onClear,
  canUndo,
  canClear,
}: ActionBarProps) {
  const navigate = useNavigate()

  // Debounce back navigation to prevent double-tap (common with toddlers)
  const isNavigating = useRef(false)
  const handleBack = useCallback(() => {
    if (isNavigating.current) return
    isNavigating.current = true
    navigate("/coloring")
    setTimeout(() => {
      isNavigating.current = false
    }, 500)
  }, [navigate])

  return (
    <>
      <style>{`
        @keyframes bounce-tap {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.1); }
          65%  { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
      `}</style>

      <nav
        aria-label="Ações do desenho"
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label="Voltar para galeria"
          className={buttonBase}
          style={{ ["--btn-color" as string]: "var(--color-crayon-blue)" }}
        >
          <ArrowLeft
            size={ICON_SIZE}
            weight="duotone"
            color="white"
            aria-hidden="true"
          />
        </button>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Desfazer"
            aria-disabled={!canUndo}
            className={buttonBase}
            style={{ ["--btn-color" as string]: "var(--color-crayon-orange)" }}
          >
            <ArrowCounterClockwise
              size={ICON_SIZE}
              weight="duotone"
              color="white"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={!canClear}
            aria-label="Limpar tudo"
            aria-disabled={!canClear}
            className={buttonBase}
            style={{ ["--btn-color" as string]: "var(--color-crayon-pink)" }}
          >
            <Eraser
              size={ICON_SIZE}
              weight="duotone"
              color="white"
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>
    </>
  )
}
