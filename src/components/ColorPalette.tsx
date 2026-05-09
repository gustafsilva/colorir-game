import { useCallback, useEffect, useRef, useState } from "react"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

/**
 * Maps each CSS color value to its Portuguese accessibility label.
 * Since toddlers (2-5) can't read, these labels serve screen-reader
 * users and caregivers — visual UI remains icon/color only.
 */
const COLOR_LABELS: Record<string, string> = {
  "var(--color-crayon-white)": "Branco",
  "var(--color-crayon-gray)": "Cinza",
  "var(--color-crayon-black)": "Preto",
  "var(--color-crayon-red-light)": "Vermelho Claro",
  "var(--color-crayon-red)": "Vermelho",
  "var(--color-crayon-red-dark)": "Vermelho Escuro",
  "var(--color-crayon-orange)": "Laranja",
  "var(--color-crayon-orange-dark)": "Laranja Escuro",
  "var(--color-crayon-yellow-light)": "Amarelo Claro",
  "var(--color-crayon-yellow)": "Amarelo",
  "var(--color-crayon-green-light)": "Verde Claro",
  "var(--color-crayon-green)": "Verde",
  "var(--color-crayon-green-dark)": "Verde Escuro",
  "var(--color-crayon-turquoise)": "Turquesa",
  "var(--color-crayon-blue-light)": "Azul Claro",
  "var(--color-crayon-blue)": "Azul",
  "var(--color-crayon-blue-dark)": "Azul Escuro",
  "var(--color-crayon-purple-light)": "Roxo Claro",
  "var(--color-crayon-purple)": "Roxo",
  "var(--color-crayon-purple-dark)": "Roxo Escuro",
  "var(--color-crayon-pink-light)": "Rosa Claro",
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

const SCROLL_STEP_PX = 240

/**
 * ColorPalette — a fixed bottom bar of round color swatches for toddlers.
 *
 * Design decisions for ages 2-5:
 * ─────────────────────────────
 * • Large round buttons (64px mobile / 72px tablet+) far exceed 48px minimum
 * • 12px gap between swatches prevents accidental neighbor taps
 * • Bounce animation on select provides delightful tactile feedback
 * • Slow pulse on selected swatch draws attention to current color
 * • Vibrant pastel rainbow gradient bar feels playful and inviting
 * • Pop sparkle on tap rewards interaction without overstimulating
 * • Side chevrons + wiggle + auto-peek explicitly hint scrollability —
 *   toddlers don't infer "swipe for more" by themselves
 * • Tapping a chevron scrolls ~3 swatches for kids who can't swipe yet
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
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const handleSelect = useCallback(
    (color: string) => {
      onSelectColor(color)
    },
    [onSelectColor],
  )

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  // Track scroll position so we can hide chevrons at the extremes
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [updateScrollState])

  // Auto-peek on mount: nudge right then back, demonstrating the scroll
  // gesture for toddlers who don't yet know they can swipe.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }
    const nudge = window.setTimeout(() => {
      el.scrollTo({ left: 100, behavior: "smooth" })
    }, 700)
    const back = window.setTimeout(() => {
      el.scrollTo({ left: 0, behavior: "smooth" })
    }, 1500)
    return () => {
      window.clearTimeout(nudge)
      window.clearTimeout(back)
    }
  }, [])

  const scrollBy = useCallback((delta: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: delta, behavior: "smooth" })
  }, [])

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
      {/* Scroll container with fade indicators + chevrons */}
      <div className="relative">
        {/* Left fade — passive scrollability hint */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-14",
            "bg-gradient-to-r from-rose-200/95 to-transparent",
            "transition-opacity duration-200",
            canScrollLeft ? "opacity-100" : "opacity-0",
          )}
        />
        {/* Right fade — passive scrollability hint */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-14",
            "bg-gradient-to-l from-sky-200/95 to-transparent",
            "transition-opacity duration-200",
            canScrollRight ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Left chevron — active scrollability hint, also tap-to-scroll */}
        <button
          type="button"
          aria-label="Rolar para a esquerda"
          onClick={() => scrollBy(-SCROLL_STEP_PX)}
          tabIndex={canScrollLeft ? 0 : -1}
          aria-hidden={!canScrollLeft}
          className={cn(
            "absolute top-1/2 left-1.5 z-20 -translate-y-1/2",
            "flex h-10 w-10 items-center justify-center",
            "rounded-full bg-white/90 backdrop-blur-sm",
            "shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
            "border border-white",
            "text-slate-700",
            "focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:outline-none",
            "transition-opacity duration-200",
            "motion-safe:animate-[chevron-wiggle-left_1.4s_ease-in-out_infinite]",
            "motion-safe:active:scale-90",
            canScrollLeft
              ? "opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          <CaretLeft size={22} weight="bold" />
        </button>

        {/* Right chevron — active scrollability hint, also tap-to-scroll */}
        <button
          type="button"
          aria-label="Rolar para a direita"
          onClick={() => scrollBy(SCROLL_STEP_PX)}
          tabIndex={canScrollRight ? 0 : -1}
          aria-hidden={!canScrollRight}
          className={cn(
            "absolute top-1/2 right-1.5 z-20 -translate-y-1/2",
            "flex h-10 w-10 items-center justify-center",
            "rounded-full bg-white/90 backdrop-blur-sm",
            "shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
            "border border-white",
            "text-slate-700",
            "focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:outline-none",
            "transition-opacity duration-200",
            "motion-safe:animate-[chevron-wiggle-right_1.4s_ease-in-out_infinite]",
            "motion-safe:active:scale-90",
            canScrollRight
              ? "opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          <CaretRight size={22} weight="bold" />
        </button>

        <div
          ref={scrollRef}
          className={cn(
            "flex items-center",
            "gap-3 px-14 py-5",
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
 * Touch target: 64×64px (mobile) / 72×72px (tablet+) — far exceeds 48px minimum.
 * Animations (motion-safe only):
 *   • Bounce on select: scale 1→1.25→1.1→1.18 plays once
 *   • Pulse on selected: gentle 1.18→1.22→1.18 loops continuously
 * Selected visual indicator layers:
 *   1. Scale up via animation — size change is most obvious cue
 *   2. White ring (3.5px) — contrast separation on any color
 *   3. Colored glow shadow — soft halo reinforces selection
 *
 * Active (pressed) state scales down to 0.85× for tactile "squish" feedback.
 */
function ColorSwatch({ color, label, isSelected, onSelect }: ColorSwatchProps) {
  const handleClick = useCallback(() => {
    onSelect(color)
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
        // 64px on mobile (toddler-friendly), 72px on larger screens
        "h-16 w-16 sm:h-[72px] sm:w-[72px]",
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
