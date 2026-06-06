import type { NailDecor, NailId } from "@/hooks/useNailSalon"
import NailSticker from "@/components/game/NailStickers"

/** Tons de pele e contorno compartilhados entre HandSVG e FootSVG. */
export const SKIN_FILL = "oklch(0.86 0.06 60)"
export const NAIL_STROKE = "var(--color-crayon-black)"
export const EMPTY_NAIL_FILL = "oklch(0.97 0.015 60)"

/**
 * Forma da unha centrada na origem: 22×26 unidades, topo bem arredondado
 * (meia-lua) e cantos inferiores suaves. Posicionada/escalada pelo chamador.
 */
export const NAIL_PATH =
  "M -11 9 L -11 -2 Q -11 -13 0 -13 Q 11 -13 11 -2 L 11 9 Q 11 13 7 13 L -7 13 Q -11 13 -11 9 Z"

/**
 * Pattern de glitter aplicado por cima do esmalte. `userSpaceOnUse` mantém
 * os brilhos pequenos independentemente da escala da unha.
 */
export function GlitterPatternDefs() {
  return (
    <defs>
      <pattern id="glitter-pattern" patternUnits="userSpaceOnUse" width="9" height="9">
        <circle cx="2" cy="2.5" r="1" fill="white" opacity="0.95" />
        <circle cx="6.5" cy="1.2" r="0.7" fill="oklch(0.95 0.08 95)" opacity="0.9" />
        <circle cx="7.2" cy="6.4" r="1.1" fill="white" opacity="0.8" />
        <circle cx="3.4" cy="7" r="0.6" fill="oklch(0.95 0.08 95)" opacity="0.85" />
      </pattern>
    </defs>
  )
}

interface DecoratedNailProps {
  id: NailId
  decor: NailDecor
}

/**
 * Unha decorada: esmalte (fill), brilho de laca, camada de glitter e adesivo.
 *
 * A key derivada da decoração força um remount do grupo a cada mudança, o que
 * re-dispara a animação CSS `.nail-pop` — feedback tátil sem estado extra.
 */
export function DecoratedNail({ id, decor }: DecoratedNailProps) {
  const decorKey = `${decor.color ?? ""}|${decor.glitter}|${decor.sticker ?? ""}`

  return (
    <g key={decorKey} className="nail-pop">
      <path
        id={`nail-${id}`}
        d={NAIL_PATH}
        fill={decor.color ?? EMPTY_NAIL_FILL}
        stroke={NAIL_STROKE}
        strokeWidth={2.5}
      />
      {/* Brilho de esmalte (laca) quando pintada */}
      {decor.color && (
        <path
          d="M -5.5 -7 Q -7.5 -2 -5.5 3"
          fill="none"
          stroke="white"
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.65}
          pointerEvents="none"
        />
      )}
      {decor.glitter && (
        <path
          d={NAIL_PATH}
          fill="url(#glitter-pattern)"
          className="glitter-layer"
          pointerEvents="none"
        />
      )}
      {decor.sticker && <NailSticker kind={decor.sticker} />}
    </g>
  )
}
