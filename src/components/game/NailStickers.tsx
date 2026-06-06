import type { StickerKind } from "@/hooks/useNailSalon"

const STROKE = "var(--color-crayon-black)"

/** Posições das 5 pétalas da florzinha (distância 5.5 do centro). */
const PETALS = [
  [0, -5.5],
  [5.23, -1.7],
  [3.23, 4.45],
  [-3.23, 4.45],
  [-5.23, -1.7],
] as const

interface NailStickerProps {
  kind: StickerKind
}

/**
 * Adesivo de unha desenhado centrado na origem (raio ~7.5 em unidades do
 * viewBox da mão/pé). O chamador posiciona via transform no grupo pai.
 */
export default function NailSticker({ kind }: NailStickerProps) {
  return (
    <g transform="scale(0.75)" pointerEvents="none" aria-hidden="true">
      {kind === "star" && (
        <path
          d="M0 -10 L2.5 -3.4 L9.5 -3.1 L4 1.3 L5.9 8.1 L0 4.2 L-5.9 8.1 L-4 1.3 L-9.5 -3.1 L-2.5 -3.4 Z"
          fill="var(--color-crayon-yellow)"
          stroke={STROKE}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      )}
      {kind === "heart" && (
        <path
          d="M0 8.5 C-5 4.5 -9 1.5 -9 -2.5 C-9 -5.5 -6.8 -7.5 -4.2 -7.5 C-2.5 -7.5 -1 -6.6 0 -5 C1 -6.6 2.5 -7.5 4.2 -7.5 C6.8 -7.5 9 -5.5 9 -2.5 C9 1.5 5 4.5 0 8.5 Z"
          fill="var(--color-crayon-red)"
          stroke={STROKE}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      )}
      {kind === "flower" && (
        <>
          {PETALS.map(([x, y]) => (
            <circle
              key={`${x},${y}`}
              cx={x}
              cy={y}
              r={4}
              fill="var(--color-crayon-white)"
              stroke={STROKE}
              strokeWidth={1}
            />
          ))}
          <circle cx={0} cy={0} r={3.2} fill="var(--color-crayon-yellow)" stroke={STROKE} strokeWidth={1} />
        </>
      )}
    </g>
  )
}
