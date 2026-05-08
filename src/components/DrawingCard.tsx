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
 * - Colorful glow shadow matching accent color for visual delight
 * - Continuous wobble animation gives cards a "living" personality
 * - Dramatic bounce-back on tap so toddlers see their tap registered
 * - No text — only visual SVG preview
 * - Debounced navigation prevents double-tap issues common with small children
 * - Staggered entrance + wobble delay creates organic motion
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
  const accentColor = colorVarMap[color] ?? "var(--color-crayon-blue)"

  return (
    <Link
      to={`/coloring/${drawing.id}`}
      aria-label={label}
      onClick={handleClick}
      className={cn(
        "group relative block aspect-square w-full max-w-[220px] justify-self-center overflow-hidden",
        "rounded-3xl",
        "border-2 border-white/60",
        "shadow-[0_4px_20px_-4px_var(--card-glow)]",
        "outline-none focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_var(--card-glow)]",
        "active:scale-[0.94] active:duration-100 active:ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "cursor-pointer",
        "drawing-card card-wobble",
      )}
      style={{
        "--entrance-delay": `${index * 80}ms`,
        "--card-glow": accentColor,
        "--wobble-delay": `${index * 200}ms`,
        backgroundColor: `color-mix(in srgb, ${accentColor} 18%, white)`,
      } as React.CSSProperties}
    >
      {/* Inner pastel panel with subtle pattern */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-2xl border border-black/6 bg-[radial-gradient(circle_at_2px_2px,rgba(0,0,0,0.04)_1px,transparent_0)] bg-[size:10px_10px]"
        style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 12%, white)` }}
      />

      {/* Thick rounded accent bar */}
      <span
        className="pointer-events-none absolute right-2 bottom-0 left-2 h-[6px] rounded-t-full"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      {/* Emoji fallback/preview so card remains identifiable even if SVG is hard to see */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl opacity-20 transition-opacity duration-300 group-hover:opacity-12"
      >
        {drawing.name}
      </span>

      <img
        src={drawing.svgPath}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 m-auto h-[72%] w-[72%] object-contain select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out group-hover:scale-[1.06]"
      />
    </Link>
  )
}
