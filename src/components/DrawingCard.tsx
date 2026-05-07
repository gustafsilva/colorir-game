import { useCallback, useRef } from "react"
import { Link } from "react-router"
import type { Drawing } from "@/types"
import { cn } from "@/lib/utils"

interface DrawingCardProps {
  drawing: Drawing
  /** Tailwind crayon color token name, e.g. "crayon-blue" */
  color: string
  /** Card index — used for staggered entrance animation */
  index: number
}

/**
 * Portuguese labels for accessibility — maps drawing id to a human-readable
 * description for screen readers. Emoji-only cards need descriptive alt text.
 */
const ariaLabels: Record<string, string> = {
  cat: "Colorir o gato",
  rainbow: "Colorir o arco-íris",
  star: "Colorir a estrela",
  butterfly: "Colorir a borboleta",
  apple: "Colorir a maçã",
  sunflower: "Colorir o girassol",
}

/** Maps color token names to CSS custom property references */
const colorVarMap: Record<string, string> = {
  "crayon-red": "var(--color-crayon-red)",
  "crayon-orange": "var(--color-crayon-orange)",
  "crayon-yellow": "var(--color-crayon-yellow)",
  "crayon-green": "var(--color-crayon-green)",
  "crayon-blue": "var(--color-crayon-blue)",
  "crayon-purple": "var(--color-crayon-purple)",
}

/**
 * DrawingCard — a tappable card that shows an SVG drawing thumbnail.
 *
 * Design decisions for 2-5 year olds:
 * - Large touch target (entire card is tappable)
 * - Exaggerated press feedback (scale + glow) so toddlers see their tap registered
 * - No text — only visual SVG preview
 * - Debounced navigation prevents double-tap issues common with small children
 * - Staggered entrance animation creates a "magical reveal" moment
 */
export default function DrawingCard({ drawing, color, index }: DrawingCardProps) {
  const isNavigating = useRef(false)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Debounce: prevent double-navigation within 500ms
      if (isNavigating.current) {
        e.preventDefault()
        return
      }
      isNavigating.current = true
      setTimeout(() => {
        isNavigating.current = false
      }, 500)
    },
    [],
  )

  const label = ariaLabels[drawing.id] ?? `Colorir ${drawing.name}`
  const glowColor = colorVarMap[color] ?? "var(--color-crayon-blue)"

  // Vary the float duration slightly per card so they don't all bob in sync
  const floatDuration = 3 + (index % 3) * 0.5

  return (
    <Link
      to={`/coloring/${drawing.id}`}
      aria-label={label}
      onClick={handleClick}
      className={cn(
        // Layout — square card
        "group relative block aspect-square w-full",
        // Background & shape
        "rounded-3xl bg-white",
        // Border — 3px colored, uses dynamic crayon color
        "border-3",
        color === "crayon-red" && "border-crayon-red",
        color === "crayon-orange" && "border-crayon-orange",
        color === "crayon-yellow" && "border-crayon-yellow",
        color === "crayon-green" && "border-crayon-green",
        color === "crayon-blue" && "border-crayon-blue",
        color === "crayon-purple" && "border-crayon-purple",
        // Focus ring for keyboard navigation (accessibility)
        "outline-none focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        // Touch feedback — scale on press with spring bounce back
        "transition-transform duration-300",
        "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
        "active:scale-[0.92] active:duration-[120ms] active:[transition-timing-function:ease-out]",
        // Cursor
        "cursor-pointer",
        // Entrance animation class (keyframes defined below)
        "drawing-card",
      )}
      style={
        {
          "--glow-color": glowColor,
          "--entrance-delay": `${index * 100}ms`,
          "--float-duration": `${floatDuration}s`,
          "--float-delay": `${index * 200}ms`,
          "--pulse-delay": `${index * 333}ms`,
        } as React.CSSProperties
      }
    >
      {/* Active glow layer — visible on press */}
      <span
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-100 group-active:opacity-100"
        style={{ boxShadow: "0 0 16px 4px var(--glow-color)" }}
        aria-hidden="true"
      />

      {/* SVG thumbnail — centered in card, ~75% size */}
      <img
        src={drawing.svgPath}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 m-auto h-[75%] w-[75%] object-contain select-none"
      />
    </Link>
  )
}
