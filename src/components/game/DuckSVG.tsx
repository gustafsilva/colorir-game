interface DuckSVGProps {
  /** Cor do corpo do patinho (CSS var da paleta crayon). */
  color: string
  className?: string
}

/**
 * Patinho ilustrado custom — line art com fill, paleta crayon.
 * O corpo recebe a cor da prop; bico e patas são sempre laranja
 * (patinho clássico), asa em tom mais claro via color-mix.
 */
export default function DuckSVG({ color, className }: DuckSVGProps) {
  const stroke = "var(--color-crayon-black)"
  const beak = "var(--color-crayon-orange)"
  const wing = `color-mix(in srgb, ${color} 65%, white)`
  const cheek = "var(--color-crayon-pink)"

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Rabinho */}
      <path
        d="M14 62 Q4 56 8 48 Q14 54 20 54 Z"
        fill={color}
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* Corpo */}
      <ellipse cx="42" cy="64" rx="30" ry="22" fill={color} stroke={stroke} strokeWidth={2.5} />

      {/* Asa (tom mais claro) */}
      <path
        d="M30 60 Q44 52 52 62 Q46 74 32 70 Q26 66 30 60 Z"
        fill={wing}
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Cabeça */}
      <circle cx="66" cy="36" r="20" fill={color} stroke={stroke} strokeWidth={2.5} />

      {/* Bico */}
      <path
        d="M84 34 Q96 36 95 40 Q94 44 84 42 Z"
        fill={beak}
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Olho com brilho */}
      <ellipse cx="70" cy="32" rx="3.6" ry="4.4" fill={stroke} />
      <circle cx="71.2" cy="30.6" r="1.3" fill="white" />

      {/* Bochecha */}
      <ellipse cx="74" cy="42" rx="4.5" ry="3" fill={cheek} opacity="0.4" />

      {/* Patas */}
      <path
        d="M36 84 L34 92 L28 90 M36 84 L38 93 L44 90"
        fill="none"
        stroke={beak}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M52 84 L50 92 L44 90 M52 84 L54 93 L60 90"
        fill="none"
        stroke={beak}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
