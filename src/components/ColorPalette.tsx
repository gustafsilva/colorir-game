import { useCallback } from "react"
import { cn } from "@/lib/utils"

/**
 * Maps each CSS color value to its Portuguese accessibility label.
 * Since toddlers (2-5) can't read, these labels serve screen-reader
 * users and caregivers — visual UI remains icon/color only.
 */
const COLOR_LABELS: Record<string, string> = {
  "var(--color-crayon-red)": "Vermelho",
  "var(--color-crayon-orange)": "Laranja",
  "var(--color-crayon-yellow)": "Amarelo",
  "var(--color-crayon-green)": "Verde",
  "var(--color-crayon-blue)": "Azul",
  "var(--color-crayon-purple)": "Roxo",
  "var(--color-crayon-pink)": "Rosa",
  "var(--color-crayon-brown)": "Marrom",
}

interface ColorPaletteProps {
  /** Array of CSS color values (e.g. "var(--color-crayon-red)") */
  colors: string[]
  /** Currently selected color value */
  selectedColor: string
  /** Callback fired when a child taps a color swatch */
  onSelectColor: (color: string) => void
}

/**
 * ColorPalette — a fixed bottom bar of round color swatches for toddlers.
 *
 * Design decisions for ages 2-5:
 * ─────────────────────────────
 * • Large round buttons (56px) exceed the 48px minimum touch target
 * • 16px gap between swatches prevents accidental neighbor taps
 * • Selected state uses scale + ring + glow — three redundant visual cues
 *   so even very young children notice the active color
 * • No text anywhere — purely visual color selection
 * • Semi-transparent backdrop keeps focus on the drawing canvas above
 * • Respects prefers-reduced-motion: glow pulse and scale transitions
 *   are disabled, replaced with a simple opaque ring
 * • role="radiogroup" / role="radio" for assistive technology
 * • Portuguese aria-labels for Brazilian Portuguese localization
 */
export default function ColorPalette({
  colors,
  selectedColor,
  onSelectColor,
}: ColorPaletteProps) {
  const handleSelect = useCallback(
    (color: string) => {
      onSelectColor(color)
    },
    [onSelectColor],
  )

  return (
    <nav
      role="radiogroup"
      aria-label="Paleta de cores"
      className={cn(
        // Fixed to bottom, above safe area on notched devices
        "fixed right-0 bottom-0 left-0 z-50",
        "pb-[env(safe-area-inset-bottom,8px)]",
        // Soft semi-transparent background — doesn't fight the canvas
        "bg-white/70 backdrop-blur-md",
        // Subtle top border to separate from canvas
        "border-t border-white/50",
        // Shadow for gentle lift
        "shadow-[0_-2px_16px_rgba(0,0,0,0.06)]",
      )}
    >
      <div
        className={cn(
          // Center swatches horizontally with generous padding
          "flex items-center justify-center",
          "gap-3 px-4 py-3",
          // On very small screens, allow horizontal scroll
          "overflow-x-auto",
          // Hide scrollbar for a cleaner kid-friendly look
          "scrollbar-none",
        )}
      >
        {colors.map((color) => {
          const isSelected = color === selectedColor
          const label = COLOR_LABELS[color] ?? color

          return (
            <ColorSwatch
              key={color}
              color={color}
              label={label}
              isSelected={isSelected}
              onSelect={handleSelect}
            />
          )
        })}
      </div>
    </nav>
  )
}

/* ─── Internal Swatch Component ─────────────────────────────────── */

interface ColorSwatchProps {
  color: string
  label: string
  isSelected: boolean
  onSelect: (color: string) => void
}

/**
 * Individual color swatch — a big round "paint pot" button.
 *
 * Touch target: 56×56px (exceeds 48px minimum for toddler motor skills).
 * Three-layer selected indicator:
 *   1. Scale up to 1.25× — size change is the most obvious cue
 *   2. White ring (4px) — creates contrast separation on any color
 *   3. Colored glow shadow — a soft halo reinforces selection
 *
 * Active (pressed) state scales down to 0.85× for tactile "squish" feedback.
 */
function ColorSwatch({ color, label, isSelected, onSelect }: ColorSwatchProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={label}
      onClick={() => onSelect(color)}
      className={cn(
        // Base shape — round, 56px (--spacing-touch-lg)
        "relative flex-shrink-0",
        "h-14 w-14 rounded-full",
        // Remove default button styles
        "border-none outline-none",
        "cursor-pointer",
        // Focus ring for keyboard / switch access
        "focus-visible:ring-3 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
        // ── Motion-safe transitions ──
        // Scale + shadow animate for selected/pressed states
        "motion-safe:transition-[transform,box-shadow]",
        "motion-safe:duration-200",
        "motion-safe:[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
        // Press feedback: satisfying "squish"
        "motion-safe:active:scale-[0.85]",
        "motion-safe:active:duration-100",
        "motion-safe:active:[transition-timing-function:ease-out]",
        // ── Selected state ──
        isSelected && [
          // Scale up so the active color is clearly bigger
          "motion-safe:scale-125",
          // White ring creates contrast against any swatch color
          "ring-[3.5px] ring-white",
          // Outer shadow ring for extra pop
          "shadow-[0_0_0_2.5px_rgba(0,0,0,0.12),0_0_12px_4px_var(--swatch-glow)]",
          // Reduced motion fallback: thicker ring, no scale
          "motion-reduce:scale-100",
          "motion-reduce:ring-[5px]",
        ],
        // ── Unselected state ──
        !isSelected && [
          "scale-100",
          // Subtle inner shadow to look like a paint pot
          "shadow-[inset_0_-3px_6px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)]",
        ],
      )}
      style={
        {
          backgroundColor: color,
          // Expose color as custom property for the glow shadow
          "--swatch-glow": color,
        } as React.CSSProperties
      }
    >
      {/* Inner highlight — gives a 3D "glossy paint pot" look */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full",
          "bg-gradient-to-b from-white/35 via-transparent to-transparent",
          // Top-heavy gradient for the glossy dome effect
          "bg-[length:100%_50%] bg-no-repeat",
        )}
      />

      {/* Selected pulse ring — animated glow that draws the eye */}
      {isSelected && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -inset-1 rounded-full",
            "motion-safe:animate-[swatch-pulse_1.8s_ease-in-out_infinite]",
            "motion-reduce:hidden",
          )}
          style={{
            boxShadow: `0 0 10px 3px ${color}`,
            opacity: 0.5,
          }}
        />
      )}
    </button>
  )
}
