import type { Drawing } from "@/types"

import catSvg from "@/assets/svg/cat.svg?url"
import rainbowSvg from "@/assets/svg/rainbow.svg?url"
import starSvg from "@/assets/svg/star.svg?url"
import butterflySvg from "@/assets/svg/butterfly.svg?url"
import appleSvg from "@/assets/svg/apple.svg?url"
import sunflowerSvg from "@/assets/svg/sunflower.svg?url"
import parrotSvg from "@/assets/svg/parrot.svg?url"
import turtleSvg from "@/assets/svg/turtle.svg?url"

export const drawings: Drawing[] = [
  { id: "cat", name: "gato", svgPath: catSvg },
  { id: "rainbow", name: "arco-íris", svgPath: rainbowSvg },
  { id: "star", name: "estrela", svgPath: starSvg },
  { id: "butterfly", name: "borboleta", svgPath: butterflySvg },
  { id: "apple", name: "maçã", svgPath: appleSvg },
  { id: "sunflower", name: "girassol", svgPath: sunflowerSvg },
  { id: "parrot", name: "papagaio", svgPath: parrotSvg },
  { id: "turtle", name: "tartaruga", svgPath: turtleSvg },
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
  parrot: "crayon-yellow",
  turtle: "crayon-green",
}
