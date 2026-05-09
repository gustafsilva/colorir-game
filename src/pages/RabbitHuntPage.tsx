import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft } from "@phosphor-icons/react"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import HighScoreOverlay from "@/components/HighScoreOverlay"
import RabbitGrid from "@/components/game/RabbitGrid"
import RabbitScoreBoard from "@/components/game/RabbitScoreBoard"
import RabbitHint from "@/components/game/RabbitHint"
import { useRabbitHunt } from "@/hooks/useRabbitHunt"
import { useFirstTimeRabbit } from "@/hooks/useFirstTimeRabbit"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { cn } from "@/lib/utils"

export default function RabbitHuntPage() {
  const navigate = useNavigate()
  const { activeIndex, score, highScore, isNewRecord, catchRabbit } =
    useRabbitHunt()
  const { hasSeenHint, dismissHint } = useFirstTimeRabbit()
  const { playClick } = useSoundEffects()
  const isNavigating = useRef(false)

  const handleBack = useCallback(() => {
    if (isNavigating.current) return
    isNavigating.current = true
    playClick()
    navigate("/")
    setTimeout(() => {
      isNavigating.current = false
    }, 500)
  }, [navigate, playClick])

  const handleCatch = useCallback(
    (index: number) => {
      catchRabbit(index)
      if (!hasSeenHint) dismissHint()
    },
    [catchRabbit, dismissHint, hasSeenHint],
  )

  useEffect(() => {
    if (score > 0 && !hasSeenHint) dismissHint()
  }, [score, hasSeenHint, dismissHint])

  return (
    <div className="relative flex h-svh w-full flex-col items-center bg-gradient-to-b from-sky-50 via-emerald-50/40 to-orange-50 px-4 py-4 sm:py-6">
      <PaperBackground />
      <AnimatedBackground density="low" />

      <PageTransition className="flex w-full flex-1 flex-col">
        {/* Topo: voltar + score */}
        <div className="relative z-10 mb-4 flex w-full items-center justify-between gap-3 sm:mb-6">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Voltar para o início"
            className={cn(
              "btn-puffy relative flex min-h-(--spacing-touch-lg) min-w-(--spacing-touch-lg) items-center justify-center rounded-full border-[3px] border-white/60 px-4",
              "outline-none focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:ring-offset-2",
              "cursor-pointer select-none text-white",
            )}
            style={{ ["--btn-color" as string]: "var(--color-crayon-blue)" }}
          >
            <ArrowLeft size={32} weight="duotone" color="white" aria-hidden="true" />
          </button>

          <RabbitScoreBoard
            score={score}
            highScore={highScore}
            isNewRecord={isNewRecord}
          />
        </div>

        {/* Grid centralizado no espaço restante */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-2">
          <RabbitGrid activeIndex={activeIndex} onCatch={handleCatch} />
        </div>
      </PageTransition>

      <RabbitHint visible={!hasSeenHint && score === 0} />
      <HighScoreOverlay
        visible={isNewRecord}
        score={score}
        onDismiss={() => {
          // permite dismissar manualmente; auto-dismiss já é gerenciado pelo hook (3s)
        }}
      />
    </div>
  )
}
