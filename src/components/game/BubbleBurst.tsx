interface BubbleBurstProps {
  /** CSS var da cor da bolha estourada. */
  color: string
}

const DROPLETS = 8
const ANGLE_STEP = 360 / DROPLETS

/** Gotículas voando do estouro (reusa o keyframe sparkle-fly-out). */
export default function BubbleBurst({ color }: BubbleBurstProps) {
  return (
    <div aria-hidden="true" className="pointer-events-none relative">
      {Array.from({ length: DROPLETS }).map((_, i) => (
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
            className={`block rounded-full ${i % 2 === 0 ? "h-3 w-3" : "h-2 w-2"}`}
            style={{ background: `color-mix(in srgb, ${color} 60%, white)` }}
          />
        </span>
      ))}
    </div>
  )
}
