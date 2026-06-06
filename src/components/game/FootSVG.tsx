import type { NailDecor, NailId } from "@/hooks/useNailSalon"
import {
  DecoratedNail,
  GlitterPatternDefs,
  NAIL_STROKE,
  SKIN_FILL,
} from "@/components/game/NailParts"

const FOOT_NAIL_LABELS: Record<NailId, string> = {
  thumb: "Unha do dedão do pé",
  index: "Unha do segundo dedo do pé",
  middle: "Unha do dedo do meio do pé",
  ring: "Unha do quarto dedo do pé",
  pinky: "Unha do dedinho do pé",
}

interface ToeSpec {
  id: NailId
  cx: number
  cy: number
  rx: number
  ry: number
  nail: { x: number; y: number; scale: number }
}

/** Dedão à esquerda, dedinhos decrescendo à direita. */
const TOES: ToeSpec[] = [
  { id: "thumb", cx: 52, cy: 78, rx: 21, ry: 25, nail: { x: 52, y: 70, scale: 1.05 } },
  { id: "index", cx: 92, cy: 64, rx: 13, ry: 16, nail: { x: 92, y: 59, scale: 0.7 } },
  { id: "middle", cx: 122, cy: 68, rx: 12, ry: 15, nail: { x: 122, y: 63, scale: 0.65 } },
  { id: "ring", cx: 149, cy: 76, rx: 11, ry: 14, nail: { x: 149, y: 71, scale: 0.6 } },
  { id: "pinky", cx: 172, cy: 88, rx: 10, ry: 12, nail: { x: 172, y: 84, scale: 0.55 } },
]

interface FootSVGProps {
  className?: string
  nails: Record<NailId, NailDecor>
  /** Quando ausente, o SVG vira ilustração estática. */
  onNailTap?: (id: NailId) => void
}

/**
 * Pé cartoon visto de cima para a pedicure. Mesma convenção do HandSVG:
 * ids `nail-*` idênticos, dedo inteiro como alvo de toque.
 */
export default function FootSVG({ className, nails, onNailTap }: FootSVGProps) {
  const interactive = Boolean(onNailTap)

  return (
    <svg
      viewBox="0 0 200 250"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={interactive ? "img" : undefined}
      aria-label={interactive ? "Pé para pintar as unhas" : undefined}
      aria-hidden={interactive ? undefined : true}
    >
      <GlitterPatternDefs />

      {/* Corpo do pé (os dedos são desenhados por cima da borda superior) */}
      <path
        d="M 34 96
           C 40 80, 80 68, 110 72
           C 145 76, 172 86, 182 100
           C 178 136, 162 160, 156 196
           C 152 228, 132 242, 108 242
           C 82 242, 62 228, 56 198
           C 50 168, 38 132, 34 96
           Z"
        fill={SKIN_FILL}
        stroke={NAIL_STROKE}
        strokeWidth={3}
        pointerEvents="none"
      />

      {/* Dedos */}
      {TOES.map((toe) => {
        const a11yProps = interactive
          ? {
              role: "button" as const,
              tabIndex: 0,
              "aria-label": FOOT_NAIL_LABELS[toe.id],
              onClick: () => onNailTap?.(toe.id),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onNailTap?.(toe.id)
                }
              },
            }
          : {}

        return (
          <g key={toe.id} className={interactive ? "nail-finger" : undefined} {...a11yProps}>
            <ellipse
              cx={toe.cx}
              cy={toe.cy}
              rx={toe.rx}
              ry={toe.ry}
              fill={SKIN_FILL}
              stroke={NAIL_STROKE}
              strokeWidth={3}
            />
            <g transform={`translate(${toe.nail.x} ${toe.nail.y}) scale(${toe.nail.scale})`}>
              <DecoratedNail id={toe.id} decor={nails[toe.id]} />
            </g>
          </g>
        )
      })}

      {/* Barra da meia */}
      <rect
        x={78}
        y={230}
        width={60}
        height={18}
        rx={9}
        fill="var(--color-crayon-pink-light)"
        stroke={NAIL_STROKE}
        strokeWidth={3}
        pointerEvents="none"
      />
    </svg>
  )
}
