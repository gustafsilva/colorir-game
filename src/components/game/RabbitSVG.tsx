interface RabbitSVGProps {
  className?: string
}

/**
 * Coelho ilustrado custom — line art com fill, paleta crayon.
 * Grupos com classes específicas permitem animar partes individualmente
 * (orelhas balançando, olhos piscando) via CSS @keyframes.
 */
export default function RabbitSVG({ className }: RabbitSVGProps) {
  const stroke = "var(--color-crayon-black)"
  const body = "var(--color-crayon-white)"
  const inner = "var(--color-crayon-pink-light)"
  const cheek = "var(--color-crayon-pink)"

  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Orelhas (atrás do corpo) */}
      <g className="rabbit-ear rabbit-ear--left" style={{ transformOrigin: "38px 40px" }}>
        <ellipse cx="36" cy="22" rx="8" ry="22" fill={body} stroke={stroke} strokeWidth={2.5} />
        <ellipse cx="36" cy="24" rx="3.5" ry="14" fill={inner} />
      </g>
      <g className="rabbit-ear rabbit-ear--right" style={{ transformOrigin: "62px 40px" }}>
        <ellipse cx="64" cy="22" rx="8" ry="22" fill={body} stroke={stroke} strokeWidth={2.5} />
        <ellipse cx="64" cy="24" rx="3.5" ry="14" fill={inner} />
      </g>

      {/* Cabeça/Corpo */}
      <ellipse cx="50" cy="68" rx="32" ry="34" fill={body} stroke={stroke} strokeWidth={2.5} />

      {/* Bochechas */}
      <ellipse cx="32" cy="78" rx="6" ry="4" fill={cheek} opacity="0.45" />
      <ellipse cx="68" cy="78" rx="6" ry="4" fill={cheek} opacity="0.45" />

      {/* Olhos */}
      <g className="rabbit-eye rabbit-eye--left" style={{ transformOrigin: "40px 65px" }}>
        <ellipse cx="40" cy="65" rx="4" ry="5" fill={stroke} />
        <circle cx="41.5" cy="63.5" r="1.4" fill="white" />
      </g>
      <g className="rabbit-eye rabbit-eye--right" style={{ transformOrigin: "60px 65px" }}>
        <ellipse cx="60" cy="65" rx="4" ry="5" fill={stroke} />
        <circle cx="61.5" cy="63.5" r="1.4" fill="white" />
      </g>

      {/* Focinho */}
      <path
        d="M50 76 L46 80 L54 80 Z"
        fill={cheek}
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />

      {/* Boca sorridente */}
      <path
        d="M50 80 Q47 84 44 82"
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M50 80 Q53 84 56 82"
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Bigodes */}
      <g stroke={stroke} strokeWidth={1.2} strokeLinecap="round" opacity="0.7">
        <line x1="20" y1="78" x2="32" y2="80" />
        <line x1="20" y1="83" x2="32" y2="83" />
        <line x1="68" y1="80" x2="80" y2="78" />
        <line x1="68" y1="83" x2="80" y2="83" />
      </g>

      {/* Patinhas frontais */}
      <ellipse
        cx="38"
        cy="100"
        rx="6"
        ry="4"
        fill={body}
        stroke={stroke}
        strokeWidth={2}
      />
      <ellipse
        cx="62"
        cy="100"
        rx="6"
        ry="4"
        fill={body}
        stroke={stroke}
        strokeWidth={2}
      />
    </svg>
  )
}
