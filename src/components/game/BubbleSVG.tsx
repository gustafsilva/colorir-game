interface BubbleSVGProps {
  /** CSS var da paleta crayon. */
  color: string
  className?: string
}

/** Bolha de sabão translúcida com aro colorido e reflexo de brilho. */
export default function BubbleSVG({ color, className }: BubbleSVGProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <circle
        cx={50}
        cy={50}
        r={44}
        fill={`color-mix(in srgb, ${color} 45%, white)`}
        fillOpacity={0.75}
        stroke={color}
        strokeWidth={5}
      />
      <circle
        cx={50}
        cy={50}
        r={34}
        fill={`color-mix(in srgb, ${color} 25%, white)`}
        fillOpacity={0.5}
      />
      {/* Reflexos de bolha de sabão */}
      <ellipse
        cx={34}
        cy={30}
        rx={13}
        ry={7}
        fill="rgba(255,255,255,0.85)"
        transform="rotate(-32 34 30)"
      />
      <circle cx={64} cy={70} r={5} fill="rgba(255,255,255,0.55)" />
    </svg>
  )
}
