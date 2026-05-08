import { useCallback, useRef } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft, Undo2, Trash2 } from "lucide-react"
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
 * Layout: [👈 Back] ·················· [↩️ Undo] [🗑️ Clear]
 *
 * Design decisions for toddlers & preschoolers:
 * - 56px minimum touch targets (--spacing-touch-lg) for imprecise motor skills
 * - Fully rounded pill shapes — friendly, no sharp corners
 * - Vibrant crayon-colored backgrounds with matching colored shadows
 * - Bounce animation on tap — playful positive feedback
 * - Emoji secondary indicators for pre-literate recognition
 * - Bold 2.5 stroke icons at 28px for high visibility
 */

const buttonBase = cn(
  "relative flex items-center justify-center gap-1.5",
  "min-h-(--spacing-touch-lg) min-w-(--spacing-touch-lg) px-4",
  "rounded-full",
  "border-2 border-white/50",
  "outline-none focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:ring-offset-2",
  "transition-transform duration-200 ease-out",
  "active:animate-[bounce-tap_300ms_ease-out]",
  "motion-reduce:active:animate-none motion-reduce:transition-none",
  "cursor-pointer select-none",
)

const disabledClasses = cn(
  "opacity-30 pointer-events-none cursor-default saturate-50",
  "active:animate-none",
)

const iconSize = 28
const iconStroke = 2.5

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
    navigate("/")
    setTimeout(() => {
      isNavigating.current = false
    }, 500)
  }, [navigate])

  return (
    <>
      {/* Bounce-tap keyframe: scale up then settle back */}
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
        {/* Left — Back to gallery (soft blue) */}
        <button
          type="button"
          onClick={handleBack}
          aria-label="Voltar para galeria"
          className={cn(
            buttonBase,
            "bg-(--color-crayon-blue) text-white",
            "shadow-[0_4px_14px_color-mix(in_srgb,var(--color-crayon-blue)_50%,transparent)]",
          )}
        >
          <ArrowLeft
            size={iconSize}
            strokeWidth={iconStroke}
            aria-hidden="true"
          />
          <span className="text-base leading-none" aria-hidden="true">
            👈
          </span>
        </button>

        {/* Right — Undo + Clear grouped together */}
        <div className="flex items-center gap-4">
          {/* Undo (soft orange/amber) */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Desfazer"
            aria-disabled={!canUndo}
            className={cn(
              buttonBase,
              "bg-(--color-crayon-orange) text-white",
              "shadow-[0_4px_14px_color-mix(in_srgb,var(--color-crayon-orange)_50%,transparent)]",
              !canUndo && disabledClasses,
            )}
          >
            <Undo2
              size={iconSize}
              strokeWidth={iconStroke}
              aria-hidden="true"
            />
            <span className="text-base leading-none" aria-hidden="true">
              ↩️
            </span>
          </button>

          {/* Clear (soft pink/red) */}
          <button
            type="button"
            onClick={onClear}
            disabled={!canClear}
            aria-label="Limpar tudo"
            aria-disabled={!canClear}
            className={cn(
              buttonBase,
              "bg-(--color-crayon-pink) text-white",
              "shadow-[0_4px_14px_color-mix(in_srgb,var(--color-crayon-pink)_50%,transparent)]",
              !canClear && disabledClasses,
            )}
          >
            <Trash2
              size={iconSize}
              strokeWidth={iconStroke}
              aria-hidden="true"
            />
            <span className="text-base leading-none" aria-hidden="true">
              🗑️
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
