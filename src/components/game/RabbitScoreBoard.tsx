import { Trophy } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface RabbitScoreBoardProps {
  score: number
  highScore: number
  isNewRecord: boolean
}

export default function RabbitScoreBoard({
  score,
  highScore,
  isNewRecord,
}: RabbitScoreBoardProps) {
  return (
    <div
      className="flex items-center gap-3 sm:gap-5"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Score atual — anima a cada incremento via key */}
      <div
        className="btn-puffy flex min-w-[120px] items-center justify-center gap-2 rounded-full border-[3px] border-white/60 px-5 py-2 sm:py-3"
        style={{ ["--btn-color" as string]: "var(--color-crayon-green)" }}
        aria-label={`${score} coelhos pegos`}
      >
        <span className="text-puffy text-2xl sm:text-3xl text-white">🐰</span>
        <span
          key={score}
          className="text-puffy score-bounce inline-block text-3xl text-white sm:text-4xl"
        >
          {score}
        </span>
      </div>

      {/* Recorde */}
      <div
        className={cn(
          "btn-puffy flex items-center gap-2 rounded-full border-[3px] border-white/60 px-4 py-2 sm:py-3",
          isNewRecord && "ring-4 ring-yellow-300/70",
        )}
        style={{ ["--btn-color" as string]: "var(--color-crayon-yellow)" }}
        aria-label={`Recorde: ${highScore}`}
      >
        <Trophy
          size={24}
          weight="duotone"
          color="white"
          className={cn(isNewRecord && "drop-shadow-[0_0_6px_rgba(255,220,0,1)]")}
          aria-hidden="true"
        />
        <span className="text-puffy-sm text-xl text-white sm:text-2xl">
          {highScore}
        </span>
      </div>
    </div>
  )
}
