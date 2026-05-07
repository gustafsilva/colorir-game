import type { Drawing } from "@/types"

import catSvg from "@/assets/svg/cat.svg?url"
import rainbowSvg from "@/assets/svg/rainbow.svg?url"
import starSvg from "@/assets/svg/star.svg?url"
import butterflySvg from "@/assets/svg/butterfly.svg?url"
import appleSvg from "@/assets/svg/apple.svg?url"
import sunflowerSvg from "@/assets/svg/sunflower.svg?url"

export const drawings: Drawing[] = [
  { id: "cat", name: "🐱", svgPath: catSvg },
  { id: "rainbow", name: "🌈", svgPath: rainbowSvg },
  { id: "star", name: "⭐", svgPath: starSvg },
  { id: "butterfly", name: "🦋", svgPath: butterflySvg },
  { id: "apple", name: "🍎", svgPath: appleSvg },
  { id: "sunflower", name: "🌻", svgPath: sunflowerSvg },
]

/**
 * Crayon color mapping — each drawing gets a unique border color
 * from the app's crayon palette defined in index.css.
 */
export const drawingColors: Record<string, string> = {
  cat: "crayon-blue",
  rainbow: "crayon-red",
  star: "crayon-yellow",
  butterfly: "crayon-purple",
  apple: "crayon-green",
  sunflower: "crayon-orange",
}
