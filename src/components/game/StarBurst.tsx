import { Sparkle } from "@phosphor-icons/react"

const COLORS = [
  "var(--color-crayon-yellow)",
  "var(--color-crayon-orange)",
  "var(--color-crayon-pink)",
  "var(--color-crayon-purple)",
  "var(--color-crayon-blue)",
  "var(--color-crayon-green)",
]

const ANGLE_STEP = 60

export default function StarBurst() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
    >
      {Array.from({ length: 6 }).map((_, i) => (
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
          <Sparkle size={20} weight="fill" color={COLORS[i % COLORS.length]} />
        </span>
      ))}
    </div>
  )
}
