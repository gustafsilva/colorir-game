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
import dogSvg from "@/assets/svg/dog.svg?url"
import lionSvg from "@/assets/svg/lion.svg?url"
import fishSvg from "@/assets/svg/fish.svg?url"
import rabbitSvg from "@/assets/svg/rabbit.svg?url"
import heartSvg from "@/assets/svg/heart.svg?url"
import moonSvg from "@/assets/svg/moon.svg?url"
import cloudSvg from "@/assets/svg/cloud.svg?url"
import bananaSvg from "@/assets/svg/banana.svg?url"
import watermelonSvg from "@/assets/svg/watermelon.svg?url"
import number2Svg from "@/assets/svg/number-2.svg?url"

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
  { id: "dog", name: "cachorro", svgPath: dogSvg },
  { id: "lion", name: "leão", svgPath: lionSvg },
  { id: "fish", name: "peixe", svgPath: fishSvg },
  { id: "rabbit", name: "coelho", svgPath: rabbitSvg },
  { id: "heart", name: "coração", svgPath: heartSvg },
  { id: "moon", name: "lua", svgPath: moonSvg },
  { id: "cloud", name: "nuvem", svgPath: cloudSvg },
  { id: "banana", name: "banana", svgPath: bananaSvg },
  { id: "watermelon", name: "melancia", svgPath: watermelonSvg },
  { id: "number-2", name: "número 2", svgPath: number2Svg },
]

/**
 * Categoria de cada desenho — usada pela galeria para agrupar visualmente.
 * Os ids canônicos vêm de src/data/categories.ts (CATEGORY_ORDER).
 */
export const drawingCategories: Record<string, string> = {
  cat: "animais",
  rainbow: "natureza",
  star: "natureza",
  butterfly: "natureza",
  apple: "frutas",
  sunflower: "natureza",
  parrot: "animais",
  turtle: "animais",
  "letter-a": "letras",
  tree: "natureza",
  "number-1": "numeros",
  "number-2": "numeros",
  bear: "animais",
  dog: "animais",
  lion: "animais",
  fish: "animais",
  rabbit: "animais",
  heart: "formas",
  moon: "formas",
  cloud: "formas",
  banana: "frutas",
  watermelon: "frutas",
  "peppa-pig": "personagens",
  "rebecca-rabbit": "personagens",
  "papai-pig": "personagens",
  "george-pig": "personagens",
  "mamae-pig": "personagens",
  "maria-clara": "personagens",
  "galinha-pintadinha": "personagens",
  jp: "personagens",
}

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
  dog: "crayon-orange",
  lion: "crayon-yellow",
  fish: "crayon-blue",
  rabbit: "crayon-purple",
  heart: "crayon-red",
  moon: "crayon-purple",
  cloud: "crayon-blue",
  banana: "crayon-yellow",
  watermelon: "crayon-green",
  "number-2": "crayon-green",
}
