interface BalloonSVGProps {
  /** Cor do balão (CSS var da paleta crayon). */
  color: string
  className?: string
}

/**
 * Balão de festa — elipse com brilho, nó e cordinha curva.
 */
export default function BalloonSVG({ color, className }: BalloonSVGProps) {
  const stroke = "var(--color-crayon-black)"

  return (
    <svg
      viewBox="0 0 60 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Corpo */}
      <ellipse cx="30" cy="32" rx="24" ry="29" fill={color} stroke={stroke} strokeWidth={2.5} />

      {/* Brilho */}
      <ellipse
        cx="21"
        cy="22"
        rx="7"
        ry="10"
        fill="white"
        opacity="0.45"
        transform="rotate(-20 21 22)"
      />

      {/* Nó */}
      <path
        d="M26 60 L30 65 L34 60 Z"
        fill={color}
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Cordinha */}
      <path
        d="M30 65 Q24 75 30 84 Q36 92 31 99"
        fill="none"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  )
}
