import { useCallback, useRef, useState } from "react"
import { Sparkle } from "@phosphor-icons/react"
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
 * • Large round buttons (52px mobile / 56px tablet+) exceed 48px minimum
 * • 16px gap between swatches prevents accidental neighbor taps
 * • Bounce animation on select provides delightful tactile feedback
 * • Slow pulse on selected swatch draws attention to current color
 * • Vibrant pastel rainbow gradient bar feels playful and inviting
 * • Pop sparkle on tap rewards interaction without overstimulating
 * • Gradient fade edges hint at scrollability without confusing toddlers
 * • No text anywhere — purely visual color selection
 * • Respects prefers-reduced-motion: animations disabled, opaque ring only
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
        "fixed right-0 bottom-0 left-0 z-50",
        "pb-[env(safe-area-inset-bottom,8px)]",
        // Fun pastel rainbow gradient — playful & inviting for toddlers
        "bg-gradient-to-r from-rose-200/90 via-amber-100/90 via-40% to-sky-200/90",
        "backdrop-blur-xl",
        "border-t-2 border-white/50",
        "shadow-[0_-2px_20px_rgba(0,0,0,0.06)]",
      )}
    >
      {/* Scroll container with fade indicators */}
      <div className="relative">
        {/* Left fade — hints scrollability */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-8",
            "bg-gradient-to-r from-rose-200/80 to-transparent",
          )}
        />
        {/* Right fade — hints scrollability */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8",
            "bg-gradient-to-l from-sky-200/80 to-transparent",
          )}
        />

        <div
          className={cn(
            "flex items-center justify-center",
            "gap-4 px-10 py-4",
            "overflow-x-auto",
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
 * Touch target: 52×52px (mobile) / 56×56px (tablet+) — exceeds 48px minimum.
 * Animations (motion-safe only):
 *   • Bounce on select: scale 1→1.25→1.1→1.18 plays once
 *   • Pulse on selected: gentle 1.18→1.22→1.18 loops continuously
 *   • Pop sparkle: Phosphor icon floats up & fades on tap for delight feedback
 * Selected visual indicator layers:
 *   1. Scale up via animation — size change is most obvious cue
 *   2. White ring (3.5px) — contrast separation on any color
 *   3. Colored glow shadow — soft halo reinforces selection
 *
 * Active (pressed) state scales down to 0.85× for tactile "squish" feedback.
 */
function ColorSwatch({ color, label, isSelected, onSelect }: ColorSwatchProps) {
  const [showPop, setShowPop] = useState(false)
  const popTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = useCallback(() => {
    onSelect(color)

    // Trigger the pop sparkle effect
    setShowPop(true)
    if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current)
    popTimeoutRef.current = setTimeout(() => setShowPop(false), 500)
  }, [color, onSelect])

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={label}
      onClick={handleClick}
      className={cn(
        "relative flex-shrink-0",
        // 52px on mobile (toddler-friendly), 56px on larger screens
        "h-[52px] w-[52px] sm:h-14 sm:w-14",
        "rounded-full",
        "border-none outline-none",
        "cursor-pointer",
        "focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        // Active press squish
        "motion-safe:active:scale-[0.85]",
        "swatch-paintpot",
        isSelected && [
          // Bounce plays once (400ms), then pulse loops continuously after
          "motion-safe:animate-[swatch-bounce_400ms_cubic-bezier(0.34,1.56,0.64,1)_1_forwards,swatch-pulse_1.8s_ease-in-out_400ms_infinite]",
          "ring-[3.5px] ring-white",
          "swatch-paintpot--selected",
          "motion-reduce:scale-100 motion-reduce:ring-[5px] motion-reduce:animate-none",
        ],
        !isSelected && [
          "scale-100",
          "motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:ease-out",
        ],
      )}
      style={{
        "--swatch-color": color,
        "--swatch-glow": color,
      } as React.CSSProperties}
    >
      {/* Pop sparkle on tap — rewards interaction with brief delight */}
      {showPop && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2",
            "select-none",
            "motion-safe:animate-[swatch-pop_500ms_ease-out_forwards]",
            "motion-reduce:hidden",
          )}
        >
          <Sparkle
            size={18}
            weight="duotone"
            color="var(--color-crayon-yellow)"
          />
        </span>
      )}

      <style>{`
        .swatch-paintpot {
          background: radial-gradient(
            circle at 30% 25%,
            color-mix(in srgb, var(--swatch-color) 70%, white) 0%,
            var(--swatch-color) 45%,
            color-mix(in srgb, var(--swatch-color) 80%, black) 100%
          );
          box-shadow:
            inset 0 3px 6px rgba(255, 255, 255, 0.5),
            inset 0 -4px 8px rgba(0, 0, 0, 0.25),
            0 3px 0 color-mix(in srgb, var(--swatch-color) 50%, black),
            0 8px 14px -2px color-mix(in srgb, var(--swatch-color) 40%, transparent),
            0 1px 2px rgba(0, 0, 0, 0.15);
        }
        .swatch-paintpot--selected {
          box-shadow:
            inset 0 3px 6px rgba(255, 255, 255, 0.6),
            inset 0 -4px 8px rgba(0, 0, 0, 0.25),
            0 0 0 2px rgba(0, 0, 0, 0.06),
            0 4px 0 color-mix(in srgb, var(--swatch-color) 50%, black),
            0 10px 22px 4px var(--swatch-glow);
        }
      `}</style>
    </button>
  )
}
