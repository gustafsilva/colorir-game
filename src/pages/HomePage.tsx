import { Palette } from "@phosphor-icons/react"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import HubHeader from "@/components/HubHeader"
import HubCard from "@/components/HubCard"
import RabbitSVG from "@/components/game/RabbitSVG"
import { useCompletedDrawings } from "@/hooks/useCompletedDrawings"
import { useHighScore } from "@/hooks/useHighScore"

export default function HomePage() {
  const { completed } = useCompletedDrawings()
  const { highScore } = useHighScore("rabbit-hunt-highscore")

  return (
    <div className="relative flex h-svh flex-col items-center justify-start overflow-x-hidden overflow-y-auto bg-gradient-to-b from-orange-50 via-pink-50 to-sky-50 px-6 py-6 sm:px-8 sm:py-10 max-[700px]:py-4">
      <PaperBackground />
      <AnimatedBackground density="low" />

      <PageTransition className="w-full">
        <div className="mx-auto flex w-full max-w-[720px] flex-col items-center pb-10">
          <HubHeader />

          <div className="flex w-full flex-col items-center justify-center gap-8 sm:flex-row sm:gap-10">
            <HubCard
              to="/coloring"
              title="Colorir"
              accentColor="var(--color-crayon-purple)"
              badge={
                completed.size > 0
                  ? `${completed.size} ${completed.size === 1 ? "desenho completo" : "desenhos completos"}`
                  : "Vamos colorir!"
              }
              index={0}
              icon={
                <Palette
                  size={120}
                  weight="duotone"
                  color="var(--color-crayon-purple)"
                  className="drop-shadow-[0_4px_10px_rgba(120,80,180,0.25)]"
                />
              }
            />

            <HubCard
              to="/rabbit-hunt"
              title="Caça-Coelho"
              accentColor="var(--color-crayon-green)"
              badge={highScore > 0 ? `Recorde: ${highScore} 🐰` : "Vamos jogar!"}
              index={1}
              icon={
                <div className="h-[120px] w-[120px]">
                  <RabbitSVG className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]" />
                </div>
              }
            />
          </div>
        </div>
      </PageTransition>
    </div>
  )
}
