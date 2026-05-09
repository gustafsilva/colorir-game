interface BurrowSVGProps {
  className?: string
  /** ID único pra evitar conflito de gradient/clipPath quando há várias tocas */
  uniqueId: string
}

/**
 * Toca (buraco no chão) — gramado verde com tufos e buraco escuro elíptico.
 * O `radialGradient` cria sensação de profundidade.
 */
export default function BurrowSVG({ className, uniqueId }: BurrowSVGProps) {
  const stroke = "var(--color-crayon-black)"
  const grass = "var(--color-crayon-green)"
  const grassDark = "var(--color-crayon-green-dark)"
  const grassLight = "var(--color-crayon-green-light)"
  const gradientId = `burrow-depth-${uniqueId}`

  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="oklch(0.18 0.02 260)" />
          <stop offset="60%" stopColor="oklch(0.30 0.05 50)" />
          <stop offset="100%" stopColor="oklch(0.45 0.08 50)" />
        </radialGradient>
      </defs>

      {/* Monte de terra/grama (base) */}
      <ellipse
        cx="60"
        cy="58"
        rx="56"
        ry="18"
        fill={grass}
        stroke={stroke}
        strokeWidth={2.5}
      />
      {/* Highlight de luz no topo do monte */}
      <ellipse cx="60" cy="48" rx="46" ry="6" fill={grassLight} opacity="0.7" />

      {/* Buraco — elipse com gradient pra profundidade */}
      <ellipse
        cx="60"
        cy="50"
        rx="32"
        ry="12"
        fill={`url(#${gradientId})`}
        stroke={stroke}
        strokeWidth={2.5}
      />

      {/* Sombra interna no fundo do buraco */}
      <ellipse cx="60" cy="55" rx="22" ry="5" fill="black" opacity="0.35" />

      {/* Tufos de grama no topo */}
      <g fill={grassDark} stroke={stroke} strokeWidth={1.5} strokeLinejoin="round">
        <path d="M14 44 L18 36 L22 44 Z" />
        <path d="M30 41 L34 33 L38 41 Z" />
        <path d="M82 41 L86 33 L90 41 Z" />
        <path d="M98 44 L102 36 L106 44 Z" />
      </g>

      {/* Pequenos detalhes de grama mais clara */}
      <g fill={grassLight} opacity="0.8">
        <circle cx="20" cy="60" r="1.5" />
        <circle cx="100" cy="62" r="1.5" />
        <circle cx="50" cy="68" r="1.2" />
        <circle cx="70" cy="68" r="1.2" />
      </g>
    </svg>
  )
}
