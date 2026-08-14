import type { ReactElement } from "react"
import FruitSVG from "./FruitSVG"
import ShapeSVG from "./ShapeSVG"
import DuckSVG from "./DuckSVG"
import RabbitSVG from "./RabbitSVG"
import BalloonSVG from "./BalloonSVG"

export type FaceId =
  | "apple"
  | "banana"
  | "orange"
  | "watermelon"
  | "strawberry"
  | "rabbit"
  | "duck"
  | "balloon"
  | "star"
  | "heart"

interface MemoryFace {
  /** Rótulo em pt-BR para o aria-label da carta aberta. */
  label: string
  render: () => ReactElement
}

/**
 * Registro das faces do Jogo da Memória — mistura do app inteiro,
 * reusando os SVGs dos outros jogos com cor/kind fixos por face.
 * Único lugar que conhece os componentes de desenho.
 */
export const MEMORY_FACES: Record<FaceId, MemoryFace> = {
  apple: {
    label: "maçã",
    render: () => <FruitSVG kind="apple" className="h-full w-full" />,
  },
  banana: {
    label: "banana",
    render: () => <FruitSVG kind="banana" className="h-full w-full" />,
  },
  orange: {
    label: "laranja",
    render: () => <FruitSVG kind="orange" className="h-full w-full" />,
  },
  watermelon: {
    label: "melancia",
    render: () => <FruitSVG kind="watermelon" className="h-full w-full" />,
  },
  strawberry: {
    label: "morango",
    render: () => <FruitSVG kind="strawberry" className="h-full w-full" />,
  },
  rabbit: {
    label: "coelho",
    render: () => <RabbitSVG className="h-full w-full" />,
  },
  duck: {
    label: "patinho",
    render: () => <DuckSVG color="var(--color-crayon-yellow)" className="h-full w-full" />,
  },
  balloon: {
    label: "balão",
    render: () => <BalloonSVG color="var(--color-crayon-red)" className="h-full w-full" />,
  },
  star: {
    label: "estrela",
    render: () => (
      <ShapeSVG shape="star" color="var(--color-crayon-yellow)" className="h-full w-full" />
    ),
  },
  heart: {
    label: "coração",
    render: () => (
      <ShapeSVG shape="heart" color="var(--color-crayon-pink)" className="h-full w-full" />
    ),
  },
}

export const MEMORY_FACE_IDS = Object.keys(MEMORY_FACES) as FaceId[]
