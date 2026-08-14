import { useId } from "react"
import type { ReactElement } from "react"
import type { ShapeId } from "@/hooks/useShapeFit"

interface ShapeSVGProps {
  shape: ShapeId
  /** Fill da peça; ignorado no variant "hole". */
  color?: string
  /** "piece" = peça colorida glossy; "hole" = buraco escuro na prancha. */
  variant?: "piece" | "hole"
  className?: string
}

interface ShapeRenderProps {
  fill: string
  stroke?: string
  strokeWidth?: number
  transform?: string
}

/**
 * Geometria das 8 formas num viewBox comum 0 0 100 100.
 * Retângulo e oval são deitados de propósito, para a silhueta não se
 * confundir com quadrado e círculo à primeira vista.
 */
function renderShape(shape: ShapeId, props: ShapeRenderProps): ReactElement {
  switch (shape) {
    case "circle":
      return <circle cx={50} cy={50} r={42} {...props} />
    case "square":
      return <rect x={10} y={10} width={80} height={80} rx={10} strokeLinejoin="round" {...props} />
    case "triangle":
      return <path d="M50 8 L92 88 L8 88 Z" strokeLinejoin="round" {...props} />
    case "rectangle":
      return <rect x={6} y={26} width={88} height={48} rx={10} strokeLinejoin="round" {...props} />
    case "star":
      return (
        <path
          d="M50 4 L63.5 31.4 L93.8 35.8 L71.9 57.1 L77 87.2 L50 73 L23 87.2 L28.1 57.1 L6.2 35.8 L36.5 31.4 Z"
          strokeLinejoin="round"
          {...props}
        />
      )
    case "heart":
      return (
        <path
          d="M50 88 C24 66 8 50 8 33 C8 18 19 8 31 8 C39 8 46 12 50 19 C54 12 61 8 69 8 C81 8 92 18 92 33 C92 50 76 66 50 88 Z"
          strokeLinejoin="round"
          {...props}
        />
      )
    case "diamond":
      return <path d="M50 5 L84 50 L50 95 L16 50 Z" strokeLinejoin="round" {...props} />
    case "oval":
      return <ellipse cx={50} cy={50} rx={46} ry={30} {...props} />
  }
}

/**
 * Uma forma geométrica do jogo de encaixe.
 *
 * O clipPath (id único via useId — o componente aparece várias vezes na
 * mesma página) recorta o brilho da peça e a sombra interna do buraco
 * para dentro da silhueta, qualquer que seja a forma.
 */
export default function ShapeSVG({
  shape,
  color = "var(--color-crayon-blue)",
  variant = "piece",
  className,
}: ShapeSVGProps) {
  const clipId = useId()

  if (variant === "hole") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
        <defs>
          <clipPath id={clipId}>{renderShape(shape, { fill: "black" })}</clipPath>
        </defs>
        {renderShape(shape, { fill: "oklch(0.34 0.07 50)" })}
        {/* Sombra interna no topo: dá a profundidade de buraco entalhado */}
        <g clipPath={`url(#${clipId})`}>
          {renderShape(shape, {
            fill: "none",
            stroke: "rgba(0,0,0,0.45)",
            strokeWidth: 7,
            transform: "translate(0 3)",
          })}
        </g>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <defs>
        <clipPath id={clipId}>{renderShape(shape, { fill: "black" })}</clipPath>
      </defs>
      {renderShape(shape, {
        fill: color,
        stroke: "rgba(0,0,0,0.18)",
        strokeWidth: 4,
      })}
      {/* Brilho de plástico no quadrante superior-esquerdo, recortado pela forma */}
      <g clipPath={`url(#${clipId})`}>
        <ellipse
          cx={34}
          cy={28}
          rx={16}
          ry={9}
          fill="rgba(255,255,255,0.4)"
          transform="rotate(-24 34 28)"
        />
      </g>
    </svg>
  )
}
