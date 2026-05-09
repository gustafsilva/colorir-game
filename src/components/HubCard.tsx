import { useCallback, useRef, type ReactNode } from "react"
import { Link } from "react-router"
import { cn } from "@/lib/utils"
import { useSoundEffects } from "@/hooks/useSoundEffects"

interface HubCardProps {
  to: string
  title: string
  badge?: string
  accentColor: string
  icon: ReactNode
  index: number
}

/**
 * Card grande do hub. Estilo "puffy" coerente com `DrawingCard`,
 * mas com slot livre pra ilustração custom (ícone, SVG, etc).
 */
export default function HubCard({
  to,
  title,
  badge,
  accentColor,
  icon,
  index,
}: HubCardProps) {
  const isNavigating = useRef(false)
  const { playPop } = useSoundEffects()

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isNavigating.current) {
        e.preventDefault()
        return
      }
      isNavigating.current = true
      playPop()
      setTimeout(() => {
        isNavigating.current = false
      }, 500)
    },
    [playPop],
  )

  return (
    <Link
      to={to}
      onClick={handleClick}
      aria-label={badge ? `${title}. ${badge}` : title}
      className={cn(
        "hub-card group relative flex aspect-[4/5] w-full max-w-[280px] flex-col items-center justify-between overflow-hidden rounded-[32px] border-[3px] border-white p-6",
        "outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        "drawing-card card-wobble cursor-pointer select-none",
      )}
      style={
        {
          ["--card-glow"]: accentColor,
          ["--entrance-delay"]: `${index * 120}ms`,
          ["--wobble-delay"]: `${index * 250}ms`,
        } as React.CSSProperties
      }
    >
      {/* Pastel inner panel */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-3xl border border-black/6 bg-[radial-gradient(circle_at_2px_2px,rgba(0,0,0,0.04)_1px,transparent_0)] bg-[size:10px_10px]"
        style={{
          backgroundColor: `color-mix(in srgb, ${accentColor} 10%, white)`,
        }}
      />

      {/* Ilustração */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="transition-transform duration-300 ease-out group-hover:scale-110">
          {icon}
        </div>
      </div>

      {/* Título */}
      <h2
        className="text-puffy relative z-10 text-2xl sm:text-3xl"
        style={{ color: accentColor }}
      >
        {title}
      </h2>

      {/* Badge inferior */}
      {badge ? (
        <p
          className="text-puffy-sm relative z-10 mt-1 text-sm sm:text-base"
          style={{ color: accentColor }}
        >
          {badge}
        </p>
      ) : null}
    </Link>
  )
}
