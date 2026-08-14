import { useEffect, useState } from "react"
import { HandPointing } from "@phosphor-icons/react"

interface ColoringHintProps {
  /** Whether the hint is currently visible */
  visible: boolean
}

interface HintPosition {
  x: number
  y: number
}

/**
 * ColoringHint — animated pointer that nudges first-time users to tap a path.
 *
 * Locates the first `.colorable-path` in the document and floats a pulsing
 * hand pointer over its bounding-box center. Uses a SVG icon (not an emoji)
 * so it renders identically across platforms. `pointer-events: none` keeps
 * real taps flowing to the underlying path.
 */
export default function ColoringHint({ visible }: ColoringHintProps) {
  const [position, setPosition] = useState<HintPosition | null>(null)

  useEffect(() => {
    if (!visible) return

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motionQuery.matches) return

    const computePosition = () => {
      const path = document.querySelector(".colorable-path")
      if (!path) return
      const rect = path.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    }

    // SVG paint may complete after first effect tick — try a couple of times
    const t1 = window.setTimeout(computePosition, 120)
    const t2 = window.setTimeout(computePosition, 400)
    window.addEventListener("resize", computePosition)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener("resize", computePosition)
    }
  }, [visible])

  if (!visible || !position) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2 motion-reduce:hidden"
      style={{ left: position.x, top: position.y }}
    >
      <span className="relative flex items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute h-20 w-20 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-crayon-yellow) 50%, transparent) 0%, transparent 70%)",
            animation: "hint-halo 1.6s ease-in-out infinite",
          }}
        />
        <HandPointing
          size={64}
          weight="duotone"
          color="var(--color-crayon-yellow)"
          className="relative drop-shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
          style={{ animation: "hint-tap 1.2s ease-in-out infinite" }}
        />
      </span>

      <style>{`
        @keyframes hint-tap {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-12px) scale(0.92); }
        }
        @keyframes hint-halo {
          0%, 100% { transform: scale(0.85); opacity: 0.55; }
          50%      { transform: scale(1.15); opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}
