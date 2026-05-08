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
 * Shared button styles for the action bar.
 *
 * Design decisions for 2-5 year olds:
 * - 48px minimum touch target (--spacing-touch) for small fingers
 * - Soft translucent white background so buttons are visible on any coloring canvas
 * - Bold, rounded icons at 28px — large enough to be instantly recognizable
 * - No text labels — toddlers are pre-literate; icons only
 * - Spring-bounce press feedback mirrors DrawingCard pattern for consistency
 * - Disabled state uses low opacity + pointer-events-none so children
 *   aren't confused by unresponsive buttons
 * - prefers-reduced-motion removes the scale transition for accessibility
 */
const buttonBase = cn(
  // Touch target — at least 48px square
  "flex items-center justify-center",
  "min-h-(--spacing-touch) min-w-(--spacing-touch)",
  // Shape & background — soft frosted pill
  "rounded-2xl bg-white/70 backdrop-blur-sm",
  // Focus ring for keyboard/switch navigation (accessibility)
  "outline-none focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
  // Touch feedback — matches DrawingCard spring pattern
  "transition-transform duration-300",
  "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
  "active:scale-[0.88] active:duration-[120ms] active:[transition-timing-function:ease-out]",
  // Respect prefers-reduced-motion
  "motion-reduce:transition-none motion-reduce:active:scale-100",
  // Cursor
  "cursor-pointer",
)

const disabledClasses = cn(
  "opacity-30 pointer-events-none cursor-default",
  // Override active state so there's zero feedback when disabled
  "active:scale-100",
)

const iconSize = 28
const iconStroke = 2.5

/**
 * ActionBar — top toolbar for the coloring screen.
 *
 * Layout: [Back] ·················· [Undo] [Clear]
 *
 * Positioned at the top of the coloring view with `justify-between` so the
 * back button sits on the left and action buttons group on the right.
 * The bar itself is transparent — only the individual buttons have backgrounds,
 * keeping the canvas area as open and uncluttered as possible for tiny artists.
 */
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
    <nav
      aria-label="Ações do desenho"
      className="flex w-full items-center justify-between px-4 py-3"
    >
      {/* Left — Back to gallery */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Voltar para galeria"
        className={buttonBase}
      >
        <ArrowLeft
          size={iconSize}
          strokeWidth={iconStroke}
          aria-hidden="true"
        />
      </button>

      {/* Right — Undo + Clear grouped together */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Desfazer"
          aria-disabled={!canUndo}
          className={cn(buttonBase, !canUndo && disabledClasses)}
        >
          <Undo2
            size={iconSize}
            strokeWidth={iconStroke}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={onClear}
          disabled={!canClear}
          aria-label="Limpar tudo"
          aria-disabled={!canClear}
          className={cn(buttonBase, !canClear && disabledClasses)}
        >
          <Trash2
            size={iconSize}
            strokeWidth={iconStroke}
            aria-hidden="true"
          />
        </button>
      </div>
    </nav>
  )
}
