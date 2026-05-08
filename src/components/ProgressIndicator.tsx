import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  /** Percentage of drawing completed (0-100) */
  progress: number
}

/**
 * A fun star-based progress indicator for toddlers (ages 2-5).
 * Shows 5 stars that "light up" as the child colors more of the drawing.
 */
function getStarsLit(progress: number): number {
  if (progress >= 100) return 5
  if (progress >= 80) return 4
  if (progress >= 60) return 3
  if (progress >= 40) return 2
  if (progress >= 20) return 1
  return 0
}

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const starsLit = getStarsLit(Math.max(0, Math.min(100, progress)))
  const allLit = starsLit === 5

  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={`Progresso: ${starsLit} de 5 estrelas`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const isLit = i < starsLit

        return (
          <span
            key={i}
            className={cn(
              "inline-block text-[20px] leading-none select-none transition-opacity duration-200",
              isLit
                ? "opacity-100 scale-120 animate-[star-light-up_0.4s_ease-out] drop-shadow-[0_0_4px_rgba(255,200,0,0.7)] motion-reduce:animate-none"
                : "opacity-25 scale-100",
              allLit && isLit && "animate-[star-shimmer_1.5s_ease-in-out_infinite] motion-reduce:animate-none"
            )}
            aria-hidden="true"
          >
            ⭐
          </span>
        )
      })}
    </div>
  )
}
