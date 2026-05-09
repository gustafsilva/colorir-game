import type { Drawing } from "@/types"

import catSvg from "@/assets/svg/cat.svg?url"
import rainbowSvg from "@/assets/svg/rainbow.svg?url"
import starSvg from "@/assets/svg/star.svg?url"
import butterflySvg from "@/assets/svg/butterfly.svg?url"
import appleSvg from "@/assets/svg/apple.svg?url"
import sunflowerSvg from "@/assets/svg/sunflower.svg?url"
import parrotSvg from "@/assets/svg/parrot.svg?url"
import turtleSvg from "@/assets/svg/turtle.svg?url"
import letterASvg from "@/assets/svg/letter-a.svg?url"
import treeSvg from "@/assets/svg/tree.svg?url"
import number1Svg from "@/assets/svg/number-1.svg?url"
import bearSvg from "@/assets/svg/bear.svg?url"
import peppaPigSvg from "@/assets/svg/peppa-pig.svg?url"
import rebeccaRabbitSvg from "@/assets/svg/rebecca-rabbit.svg?url"
import papaiPigSvg from "@/assets/svg/papai-pig.svg?url"
import georgePigSvg from "@/assets/svg/george-pig.svg?url"
import mamaePigSvg from "@/assets/svg/mamae-pig.svg?url"
import mariaClaraSvg from "@/assets/svg/maria-clara.svg?url"
import galinhaPintadinhaSvg from "@/assets/svg/galinha-pintadinha.svg?url"
import jpSvg from "@/assets/svg/jp.svg?url"

export const drawings: Drawing[] = [
  { id: "cat", name: "gato", svgPath: catSvg },
  { id: "rainbow", name: "arco-íris", svgPath: rainbowSvg },
  { id: "star", name: "estrela", svgPath: starSvg },
  { id: "butterfly", name: "borboleta", svgPath: butterflySvg },
  { id: "apple", name: "maçã", svgPath: appleSvg },
  { id: "sunflower", name: "girassol", svgPath: sunflowerSvg },
  { id: "parrot", name: "papagaio", svgPath: parrotSvg },
  { id: "turtle", name: "tartaruga", svgPath: turtleSvg },
  { id: "letter-a", name: "letra A", svgPath: letterASvg },
  { id: "tree", name: "árvore", svgPath: treeSvg },
  { id: "number-1", name: "número 1", svgPath: number1Svg },
  { id: "bear", name: "urso", svgPath: bearSvg },
  { id: "peppa-pig", name: "Peppa Pig", svgPath: peppaPigSvg },
  { id: "rebecca-rabbit", name: "Rebecca", svgPath: rebeccaRabbitSvg },
  { id: "papai-pig", name: "Papai Pig", svgPath: papaiPigSvg },
  { id: "george-pig", name: "George", svgPath: georgePigSvg },
  { id: "mamae-pig", name: "Mamãe Pig", svgPath: mamaePigSvg },
  { id: "maria-clara", name: "Maria Clara", svgPath: mariaClaraSvg },
  { id: "galinha-pintadinha", name: "Galinha Pintadinha", svgPath: galinhaPintadinhaSvg },
  { id: "jp", name: "JP", svgPath: jpSvg },
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
  "number-1": "crayon-blue",
  "letter-a": "crayon-red",
  tree: "crayon-green",
  bear: "crayon-orange",
  "peppa-pig": "crayon-purple",
  "rebecca-rabbit": "crayon-yellow",
  "papai-pig": "crayon-orange",
  "george-pig": "crayon-blue",
  "mamae-pig": "crayon-red",
  "maria-clara": "crayon-purple",
  "galinha-pintadinha": "crayon-yellow",
  jp: "crayon-blue",
}
