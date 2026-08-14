import { useId } from "react"
import type { ReactElement, ReactNode } from "react"

export type FruitKind = "apple" | "banana" | "orange" | "watermelon" | "strawberry"

export const FRUIT_KINDS: FruitKind[] = [
  "apple",
  "banana",
  "orange",
  "watermelon",
  "strawberry",
]

interface FruitSVGProps {
  kind: FruitKind
  /** "whole" = fruta inteira voando; "left"/"right" = metade após o corte. */
  variant?: "whole" | "left" | "right"
  className?: string
}

interface SilhouetteProps {
  fill: string
  stroke?: string
  strokeWidth?: number
}

interface FruitDef {
  /** Silhueta única (também usada como clipPath das decorações e da polpa). */
  silhouette: (props: SilhouetteProps) => ReactElement
  bodyFill: string
  /** Cor da polpa exposta na faixa do corte. */
  fleshFill: string
  /** Decorações recortadas pela silhueta (brilho, listras, sementinhas). */
  inner?: ReactNode
  /** Decorações fora da silhueta (cabinho, folha, coroa). */
  outer?: ReactNode
  /** Sementes desenhadas dentro da faixa de polpa das metades. */
  fleshSeeds?: ReactNode
}

const GLOSS = (
  <ellipse
    cx={36}
    cy={36}
    rx={13}
    ry={7}
    fill="rgba(255,255,255,0.4)"
    transform="rotate(-24 36 36)"
  />
)

const FRUITS: Record<FruitKind, FruitDef> = {
  apple: {
    silhouette: (props) => (
      <path
        d="M50 23 C38 14 15 22 15 48 C15 72 31 89 50 89 C69 89 85 72 85 48 C85 22 62 14 50 23 Z"
        strokeLinejoin="round"
        {...props}
      />
    ),
    bodyFill: "var(--color-crayon-red)",
    fleshFill: "color-mix(in srgb, var(--color-crayon-yellow) 15%, white)",
    inner: GLOSS,
    outer: (
      <>
        <path
          d="M50 22 C49 15 52 10 57 7"
          fill="none"
          stroke="var(--color-crayon-brown)"
          strokeWidth={5}
          strokeLinecap="round"
        />
        <ellipse
          cx={64}
          cy={12}
          rx={9}
          ry={4.5}
          fill="var(--color-crayon-green)"
          transform="rotate(-28 64 12)"
        />
      </>
    ),
    fleshSeeds: (
      <ellipse cx={50} cy={54} rx={2.5} ry={4} fill="var(--color-crayon-brown)" />
    ),
  },
  banana: {
    silhouette: (props) => (
      <path
        d="M25 12 C18 50 42 80 82 83 C89 83.5 90 91 83 92 C38 94 8 58 16 11 C17 4 26 5 25 12 Z"
        strokeLinejoin="round"
        {...props}
      />
    ),
    bodyFill: "var(--color-crayon-yellow)",
    fleshFill: "color-mix(in srgb, var(--color-crayon-yellow) 28%, white)",
    inner: (
      <path
        d="M24 20 C22 48 42 74 74 80"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={6}
        strokeLinecap="round"
      />
    ),
    outer: (
      <>
        <circle cx={21} cy={9} r={4} fill="var(--color-crayon-brown)" />
        <circle cx={85} cy={87} r={4} fill="var(--color-crayon-brown)" />
      </>
    ),
  },
  orange: {
    silhouette: (props) => <circle cx={50} cy={54} r={37} {...props} />,
    bodyFill: "var(--color-crayon-orange)",
    fleshFill: "color-mix(in srgb, var(--color-crayon-orange) 40%, white)",
    inner: GLOSS,
    outer: (
      <>
        <path
          d="M50 18 C50 13 51 10 53 8"
          fill="none"
          stroke="var(--color-crayon-brown)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <ellipse
          cx={61}
          cy={12}
          rx={9}
          ry={4.5}
          fill="var(--color-crayon-green)"
          transform="rotate(-18 61 12)"
        />
      </>
    ),
  },
  watermelon: {
    silhouette: (props) => <circle cx={50} cy={52} r={38} {...props} />,
    bodyFill: "var(--color-crayon-green)",
    fleshFill: "color-mix(in srgb, var(--color-crayon-red) 75%, white)",
    inner: (
      <>
        {[30, 50, 70].map((x) => (
          <path
            key={x}
            d={`M${x} 12 C${x - 3} 40 ${x - 3} 66 ${x} 92`}
            fill="none"
            stroke="color-mix(in srgb, var(--color-crayon-green) 60%, black)"
            strokeWidth={7}
            strokeLinecap="round"
          />
        ))}
        {GLOSS}
      </>
    ),
    fleshSeeds: (
      <>
        <ellipse cx={48} cy={40} rx={2} ry={3.2} fill="var(--color-crayon-black)" />
        <ellipse cx={52} cy={58} rx={2} ry={3.2} fill="var(--color-crayon-black)" />
        <ellipse cx={47} cy={72} rx={2} ry={3.2} fill="var(--color-crayon-black)" />
      </>
    ),
  },
  strawberry: {
    silhouette: (props) => (
      <path
        d="M50 91 C29 79 15 61 17 41 C19 26 33 19 50 24 C67 19 81 26 83 41 C85 61 71 79 50 91 Z"
        strokeLinejoin="round"
        {...props}
      />
    ),
    bodyFill: "var(--color-crayon-red)",
    fleshFill: "color-mix(in srgb, var(--color-crayon-pink) 35%, white)",
    inner: (
      <>
        {(
          [
            [36, 42],
            [52, 38],
            [66, 46],
            [42, 60],
            [58, 62],
            [50, 76],
          ] as [number, number][]
        ).map(([x, y]) => (
          <ellipse
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            rx={2.2}
            ry={3.4}
            fill="color-mix(in srgb, var(--color-crayon-yellow) 70%, white)"
          />
        ))}
      </>
    ),
    outer: (
      <>
        <path
          d="M50 24 C49 17 50 12 52 8"
          fill="none"
          stroke="var(--color-crayon-green)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <path
          d="M32 26 L42 15 L50 25 L58 15 L68 26 L54 31 L46 31 Z"
          fill="var(--color-crayon-green)"
          strokeLinejoin="round"
        />
      </>
    ),
  },
}

/**
 * Frutas do Corta-Frutas num viewBox comum 0 0 100 100, estilo crayon.
 *
 * As metades ("left"/"right") são a fruta inteira recortada por um clipPath
 * de meio-quadro, com uma faixa de polpa ao longo do corte (recortada pela
 * silhueta, qualquer que seja a forma) e a borda do corte fechada por uma
 * linha vertical — o mesmo truque de clip do ShapeSVG.
 */
export default function FruitSVG({ kind, variant = "whole", className }: FruitSVGProps) {
  const bodyId = useId()
  const halfId = useId()
  const def = FRUITS[kind]

  const body = (
    <>
      {def.silhouette({
        fill: def.bodyFill,
        stroke: "rgba(0,0,0,0.18)",
        strokeWidth: 4,
      })}
      {def.inner && <g clipPath={`url(#${bodyId})`}>{def.inner}</g>}
      {def.outer}
    </>
  )

  if (variant === "whole") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
        <defs>
          <clipPath id={bodyId}>{def.silhouette({ fill: "black" })}</clipPath>
        </defs>
        {body}
      </svg>
    )
  }

  const fleshX = variant === "left" ? 38 : 50

  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <defs>
        <clipPath id={bodyId}>{def.silhouette({ fill: "black" })}</clipPath>
        <clipPath id={halfId}>
          <rect x={variant === "left" ? 0 : 50} y={0} width={50} height={100} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${halfId})`}>
        {body}
        <g clipPath={`url(#${bodyId})`}>
          <rect x={fleshX} y={0} width={12} height={100} fill={def.fleshFill} />
          {def.fleshSeeds}
          {/* Fecha o contorno na face plana do corte */}
          <line
            x1={50}
            y1={0}
            x2={50}
            y2={100}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={5}
          />
        </g>
      </g>
    </svg>
  )
}

/** Bomba bobinha: redonda, preta, pavio aceso e carinha — impossível confundir com fruta. */
export function BombSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      {/* Pavio com faísca */}
      <path
        d="M50 22 C52 13 60 11 65 6"
        fill="none"
        stroke="var(--color-crayon-brown)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <g>
        <circle cx={67} cy={6} r={4} fill="var(--color-crayon-orange)" />
        {(
          [
            [67, -2, 67, 0],
            [67, 12, 67, 14],
            [59, 6, 61, 6],
            [73, 6, 75, 6],
          ] as [number, number, number, number][]
        ).map(([x1, y1, x2, y2]) => (
          <line
            key={`${x1}-${y1}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-crayon-yellow)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}
      </g>
      {/* Tampinha */}
      <rect x={42} y={19} width={16} height={11} rx={4} fill="oklch(0.45 0.02 280)" />
      {/* Corpo */}
      <circle
        cx={50}
        cy={60}
        r={33}
        fill="oklch(0.32 0.02 280)"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={4}
      />
      <ellipse
        cx={38}
        cy={48}
        rx={11}
        ry={6}
        fill="rgba(255,255,255,0.25)"
        transform="rotate(-24 38 48)"
      />
      {/* Carinha boba */}
      <circle cx={41} cy={58} r={7} fill="white" />
      <circle cx={59} cy={58} r={7} fill="white" />
      <circle cx={42.5} cy={59.5} r={3} fill="var(--color-crayon-black)" />
      <circle cx={57.5} cy={59.5} r={3} fill="var(--color-crayon-black)" />
      <circle cx={35} cy={70} r={4} fill="var(--color-crayon-pink)" opacity={0.7} />
      <circle cx={65} cy={70} r={4} fill="var(--color-crayon-pink)" opacity={0.7} />
      <path
        d="M43 72 Q50 78 57 72"
        fill="none"
        stroke="white"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Nuvem de explosão cômica (POF!), usada no lugar da bomba cortada. */
export function BoomSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      {(
        [
          [50, 50, 30],
          [26, 56, 16],
          [74, 56, 16],
          [36, 32, 15],
          [64, 34, 14],
          [50, 72, 15],
        ] as [number, number, number][]
      ).map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="var(--color-crayon-orange)" />
      ))}
      {(
        [
          [50, 50, 22],
          [32, 52, 11],
          [68, 52, 11],
          [42, 36, 10],
          [60, 38, 9],
        ] as [number, number, number][]
      ).map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="var(--color-crayon-yellow)" />
      ))}
      <circle cx={50} cy={49} r={11} fill="white" />
      {/* Estrelinhas saltando */}
      {(
        [
          [16, 24],
          [84, 22],
          [88, 74],
          [12, 76],
        ] as [number, number][]
      ).map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x} ${y - 6} L${x + 1.8} ${y - 1.8} L${x + 6} ${y} L${x + 1.8} ${y + 1.8} L${x} ${y + 6} L${x - 1.8} ${y + 1.8} L${x - 6} ${y} L${x - 1.8} ${y - 1.8} Z`}
          fill="var(--color-crayon-yellow)"
        />
      ))}
    </svg>
  )
}
