import { HandPointing } from "@phosphor-icons/react"

interface RabbitHintProps {
  visible: boolean
}

export default function RabbitHint({ visible }: RabbitHintProps) {
  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-10 z-30 flex flex-col items-center gap-2"
    >
      <span className="bounce-title">
        <HandPointing
          size={64}
          weight="duotone"
          color="var(--color-crayon-yellow)"
          aria-hidden="true"
          className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
        />
      </span>
      <p
        className="text-puffy-sm rounded-full bg-white/85 px-5 py-2 text-xl"
        style={{ color: "var(--color-crayon-purple)" }}
      >
        Toque no coelho!
      </p>
    </div>
  )
}
