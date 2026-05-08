import { Palette, Pencil, Drop, Star, Sparkle } from "@phosphor-icons/react"

/**
 * GalleryHeader — playful intro to the gallery, designed for ages 2-5.
 *
 * Layered composition:
 *   1. Soft radial backdrop (peach → transparent) — gives the title a "stage"
 *   2. Big Palette icon with continuous wobble — visual anchor in lieu of emoji
 *   3. "Vamos Colorir!" in puffy 3D bicolor type
 *   4. Floating Phosphor decorations orbiting the title (desyncs via delay)
 *
 * On narrow screens (≤700px) we reduce floaters and tighten spacing.
 */
export default function GalleryHeader() {
  return (
    <header className="relative mb-8 flex w-full max-w-[640px] flex-col items-center gap-2 select-none sm:mb-12 max-[700px]:mb-4">
      {/* Soft stage backdrop */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[180px] w-[110%] rounded-[50%]"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-crayon-orange) 30%, transparent) 0%, transparent 65%)",
          filter: "blur(6px)",
        }}
      />

      {/* Floating decorations */}
      <span
        aria-hidden="true"
        className="header-floater pointer-events-none absolute -top-2 left-[8%] max-[700px]:hidden"
        style={{ animationDelay: "0ms" }}
      >
        <Pencil
          size={36}
          weight="duotone"
          color="var(--color-crayon-purple)"
        />
      </span>
      <span
        aria-hidden="true"
        className="header-floater pointer-events-none absolute top-6 right-[10%]"
        style={{ animationDelay: "800ms" }}
      >
        <Drop
          size={32}
          weight="duotone"
          color="var(--color-crayon-blue)"
        />
      </span>
      <span
        aria-hidden="true"
        className="header-floater pointer-events-none absolute bottom-[10%] left-[14%]"
        style={{ animationDelay: "1600ms" }}
      >
        <Star
          size={28}
          weight="duotone"
          color="var(--color-crayon-yellow)"
        />
      </span>
      <span
        aria-hidden="true"
        className="header-floater pointer-events-none absolute -top-1 right-[18%] max-[700px]:hidden"
        style={{ animationDelay: "2400ms" }}
      >
        <Sparkle
          size={26}
          weight="duotone"
          color="var(--color-crayon-pink)"
        />
      </span>

      {/* Palette anchor */}
      <span
        aria-hidden="true"
        className="bounce-title relative z-10 inline-flex items-center justify-center"
      >
        <Palette
          size={84}
          weight="duotone"
          color="var(--color-crayon-purple)"
          className="drop-shadow-[0_4px_10px_rgba(120,80,180,0.25)] max-[700px]:size-[64px]"
        />
      </span>

      {/* Puffy bicolor title */}
      <h1 className="relative z-10 flex flex-wrap items-baseline justify-center gap-x-3 text-4xl tracking-tight sm:text-5xl max-[700px]:text-3xl">
        <span
          className="text-puffy"
          style={{ color: "var(--color-crayon-orange)" }}
        >
          Vamos
        </span>
        <span
          className="text-puffy"
          style={{ color: "var(--color-crayon-pink)" }}
        >
          Colorir!
        </span>
      </h1>

      <style>{`
        @keyframes header-float {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50%      { transform: translateY(-10px) rotate(4deg); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .header-floater {
            animation: header-float 4s ease-in-out infinite;
          }
        }
      `}</style>
    </header>
  )
}
