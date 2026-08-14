import type { Direction } from "@/hooks/useWormGame"

const BODY_GREEN = "var(--color-crayon-green)"
const BODY_GREEN_LIGHT = "color-mix(in srgb, var(--color-crayon-green) 60%, white)"

/** Deslocamento das pupilas para a cabeça "olhar" na direção do movimento
 * — mais fofo que girar a carinha (de cabeça para baixo assusta). */
const PUPIL_OFFSET: Record<Direction, [number, number]> = {
  right: [3, 0],
  left: [-3, 0],
  up: [0, -3],
  down: [0, 3],
}

interface WormHeadSVGProps {
  dir: Direction
  /** Boca aberta de "nhac" logo após comer. */
  chomp?: boolean
  className?: string
}

export function WormHeadSVG({ dir, chomp = false, className }: WormHeadSVGProps) {
  const [px, py] = PUPIL_OFFSET[dir]

  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      {/* Cabeça */}
      <circle
        cx={50}
        cy={50}
        r={42}
        fill={BODY_GREEN}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth={4}
      />
      <ellipse
        cx={38}
        cy={34}
        rx={12}
        ry={7}
        fill="rgba(255,255,255,0.35)"
        transform="rotate(-24 38 34)"
      />

      {/* Anteninhas */}
      <path
        d="M36 12 C34 6 30 3 26 2"
        fill="none"
        stroke={BODY_GREEN}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d="M64 12 C66 6 70 3 74 2"
        fill="none"
        stroke={BODY_GREEN}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <circle cx={25} cy={2} r={5} fill="var(--color-crayon-yellow)" />
      <circle cx={75} cy={2} r={5} fill="var(--color-crayon-yellow)" />

      {/* Olhos (piscam via .worm-eye) */}
      <g className="worm-eye" style={{ transformOrigin: "35px 44px" }}>
        <circle cx={35} cy={44} r={11} fill="white" />
        <circle cx={35 + px} cy={44 + py} r={5} fill="var(--color-crayon-black)" />
      </g>
      <g className="worm-eye" style={{ transformOrigin: "65px 44px" }}>
        <circle cx={65} cy={44} r={11} fill="white" />
        <circle cx={65 + px} cy={44 + py} r={5} fill="var(--color-crayon-black)" />
      </g>

      {/* Bochechas */}
      <circle cx={22} cy={60} r={6} fill="var(--color-crayon-pink)" opacity={0.7} />
      <circle cx={78} cy={60} r={6} fill="var(--color-crayon-pink)" opacity={0.7} />

      {/* Boca: sorriso, ou "O" aberto no nhac */}
      {chomp ? (
        <ellipse cx={50} cy={70} rx={10} ry={12} fill="var(--color-crayon-brown)" />
      ) : (
        <path
          d="M38 66 Q50 78 62 66"
          fill="none"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth={4}
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

interface WormSegmentSVGProps {
  /** Dois tons de verde alternados ao longo do corpo. */
  tone: 0 | 1
  className?: string
}

export function WormSegmentSVG({ tone, className }: WormSegmentSVGProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <circle
        cx={50}
        cy={50}
        r={38}
        fill={tone === 0 ? BODY_GREEN : BODY_GREEN_LIGHT}
        stroke="rgba(0,0,0,0.14)"
        strokeWidth={4}
      />
      <ellipse
        cx={40}
        cy={38}
        rx={10}
        ry={6}
        fill="rgba(255,255,255,0.3)"
        transform="rotate(-24 40 38)"
      />
    </svg>
  )
}
