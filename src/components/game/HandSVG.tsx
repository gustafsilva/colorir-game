import type { NailDecor, NailId } from "@/hooks/useNailSalon"
import {
  DecoratedNail,
  GlitterPatternDefs,
  NAIL_STROKE,
  SKIN_FILL,
} from "@/components/game/NailParts"

const HAND_NAIL_LABELS: Record<NailId, string> = {
  thumb: "Unha do polegar",
  index: "Unha do dedo indicador",
  middle: "Unha do dedo médio",
  ring: "Unha do dedo anelar",
  pinky: "Unha do dedo mindinho",
}

interface FingerSpec {
  id: NailId
  cx: number
  cy: number
  rx: number
  ry: number
  /** Posição/escala da unha na ponta do dedo */
  nail: { x: number; y: number; scale: number; rotate?: number }
  rotate?: number
}

/** Dedos retos (indicador → mindinho); o polegar é desenhado à parte, por cima da palma. */
const FINGERS: FingerSpec[] = [
  { id: "index", cx: 70, cy: 112, rx: 14, ry: 52, nail: { x: 70, y: 80, scale: 1 } },
  { id: "middle", cx: 102, cy: 104, rx: 14.5, ry: 56, nail: { x: 102, y: 70, scale: 1.05 } },
  { id: "ring", cx: 134, cy: 112, rx: 14, ry: 52, nail: { x: 134, y: 80, scale: 1 } },
  { id: "pinky", cx: 163, cy: 126, rx: 12, ry: 42, nail: { x: 163, y: 102, scale: 0.85 } },
]

const THUMB: FingerSpec = {
  id: "thumb",
  cx: 38,
  cy: 154,
  rx: 15,
  ry: 38,
  rotate: -32,
  nail: { x: 23, y: 130, scale: 1.05, rotate: -32 },
}

interface HandSVGProps {
  className?: string
  nails: Record<NailId, NailDecor>
  /** Quando ausente, o SVG vira ilustração estática (miniatura na home). */
  onNailTap?: (id: NailId) => void
}

function nailTransform(nail: FingerSpec["nail"]): string {
  const rotate = nail.rotate ? ` rotate(${nail.rotate})` : ""
  return `translate(${nail.x} ${nail.y})${rotate} scale(${nail.scale})`
}

/**
 * Mão cartoon vista de cima com 5 unhas grandes e coloríveis.
 *
 * O dedo INTEIRO é o alvo de toque (não só a unha) — proxy generoso para
 * dedinhos de 2-5 anos. Markup JSX estático: o React só atualiza atributos
 * (fill etc.) na reconciliação, sem recriar a subárvore — não há o flash
 * documentado no CLAUDE.md para o caso innerHTML do ColoringSVG.
 */
export default function HandSVG({ className, nails, onNailTap }: HandSVGProps) {
  const interactive = Boolean(onNailTap)

  const renderFinger = (finger: FingerSpec) => {
    const a11yProps = interactive
      ? {
          role: "button" as const,
          tabIndex: 0,
          "aria-label": HAND_NAIL_LABELS[finger.id],
          onClick: () => onNailTap?.(finger.id),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onNailTap?.(finger.id)
            }
          },
        }
      : {}

    return (
      <g key={finger.id} className={interactive ? "nail-finger" : undefined} {...a11yProps}>
        <ellipse
          cx={finger.cx}
          cy={finger.cy}
          rx={finger.rx}
          ry={finger.ry}
          fill={SKIN_FILL}
          stroke={NAIL_STROKE}
          strokeWidth={3}
          transform={finger.rotate ? `rotate(${finger.rotate} ${finger.cx} ${finger.cy})` : undefined}
        />
        <g transform={nailTransform(finger.nail)}>
          <DecoratedNail id={finger.id} decor={nails[finger.id]} />
        </g>
      </g>
    )
  }

  return (
    <svg
      viewBox="0 0 200 250"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={interactive ? "img" : undefined}
      aria-label={interactive ? "Mão para pintar as unhas" : undefined}
      aria-hidden={interactive ? undefined : true}
    >
      <GlitterPatternDefs />

      {/* Dedos retos */}
      {FINGERS.map(renderFinger)}

      {/* Palma (cobre a base dos dedos) */}
      <ellipse
        cx={110}
        cy={192}
        rx={62}
        ry={50}
        fill={SKIN_FILL}
        stroke={NAIL_STROKE}
        strokeWidth={3}
        pointerEvents="none"
      />

      {/* Vincos dos nós dos dedos */}
      <g
        fill="none"
        stroke={NAIL_STROKE}
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.25}
        pointerEvents="none"
      >
        <path d="M 64 132 Q 70 136 76 132" />
        <path d="M 96 126 Q 102 130 108 126" />
        <path d="M 128 132 Q 134 136 140 132" />
        <path d="M 157 142 Q 163 146 169 142" />
      </g>

      {/* Polegar (por cima da borda da palma) */}
      {renderFinger(THUMB)}

      {/* Manguinha da blusa */}
      <rect
        x={72}
        y={226}
        width={76}
        height={22}
        rx={11}
        fill="var(--color-crayon-pink-light)"
        stroke={NAIL_STROKE}
        strokeWidth={3}
        pointerEvents="none"
      />
    </svg>
  )
}
