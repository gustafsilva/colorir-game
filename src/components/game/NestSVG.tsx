interface NestSVGProps {
  /** Cor identificadora do ninho (CSS var da paleta crayon) — anel/laço para casar com o patinho. */
  color: string
  className?: string
}

/**
 * Ninho de palha — marrom com gravetos, e um anel colorido na boca
 * para a criança identificar qual patinho mora aqui.
 */
export default function NestSVG({ color, className }: NestSVGProps) {
  const stroke = "var(--color-crayon-black)"
  const straw = "var(--color-crayon-brown)"
  const strawLight = "color-mix(in srgb, var(--color-crayon-brown) 60%, white)"

  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Corpo do ninho (tigela de palha) */}
      <path
        d="M14 34 Q14 70 60 70 Q106 70 106 34 Q84 42 60 42 Q36 42 14 34 Z"
        fill={straw}
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* Gravetos — textura de palha */}
      <g stroke={strawLight} strokeWidth={2} strokeLinecap="round" opacity="0.8">
        <path d="M24 46 Q34 54 30 62" fill="none" />
        <path d="M44 50 Q50 58 46 66" fill="none" />
        <path d="M64 50 Q70 56 66 66" fill="none" />
        <path d="M84 48 Q92 54 88 62" fill="none" />
        <path d="M34 44 Q44 50 56 50" fill="none" />
        <path d="M62 50 Q76 50 86 44" fill="none" />
      </g>

      {/* Anel colorido na boca do ninho — identificador da cor */}
      <ellipse
        cx="60"
        cy="34"
        rx="46"
        ry="12"
        fill={color}
        stroke={stroke}
        strokeWidth={2.5}
      />
      {/* Interior do ninho (sombra) */}
      <ellipse
        cx="60"
        cy="34"
        rx="36"
        ry="8"
        fill="color-mix(in srgb, var(--color-crayon-brown) 70%, black)"
        stroke={stroke}
        strokeWidth={1.5}
      />

      {/* Lacinho na frente, na cor do ninho */}
      <g
        fill={color}
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinejoin="round"
      >
        <path d="M60 56 L50 50 Q46 56 50 61 Z" />
        <path d="M60 56 L70 50 Q74 56 70 61 Z" />
        <circle cx="60" cy="56" r="4" />
      </g>
    </svg>
  )
}
