const ANGLE_STEP = 45

interface BalloonPopProps {
  /** Cor do balão estourado — os pedacinhos voam na mesma cor. */
  color: string
}

/**
 * Partículas de estouro de balão — pedacinhos voando em 8 direções.
 * Reusa o keyframe `sparkle-fly-out` (StarBurst) via --burst-angle.
 * O componente pai remove após ~700ms.
 */
export default function BalloonPop({ color }: BalloonPopProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-20 flex items-center justify-center"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="sparkle-fly-out absolute"
          style={
            {
              ["--burst-angle"]: `${i * ANGLE_STEP}deg`,
              transformOrigin: "center",
            } as React.CSSProperties
          }
        >
          <span
            className="block h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
        </span>
      ))}
    </div>
  )
}
