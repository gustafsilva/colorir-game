import { Palette } from "@phosphor-icons/react"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import HubHeader from "@/components/HubHeader"
import HubCard from "@/components/HubCard"
import RabbitSVG from "@/components/game/RabbitSVG"
import HandSVG from "@/components/game/HandSVG"
import DuckSVG from "@/components/game/DuckSVG"
import ShapeSVG from "@/components/game/ShapeSVG"
import { useCompletedDrawings } from "@/hooks/useCompletedDrawings"
import { useHighScore } from "@/hooks/useHighScore"
import type { NailDecor, NailId } from "@/hooks/useNailSalon"

/** Miniatura da mão no card do hub, já decorada para dar vontade de brincar. */
const PREVIEW_NAILS: Record<NailId, NailDecor> = {
  thumb: { color: "var(--color-crayon-pink)", glitter: false },
  index: { color: "var(--color-crayon-purple)", glitter: true },
  middle: { color: "var(--color-crayon-red)", glitter: false, sticker: "star" },
  ring: { color: "var(--color-crayon-turquoise)", glitter: false },
  pinky: { color: "var(--color-crayon-yellow)", glitter: false, sticker: "heart" },
}

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

          <div className="flex w-full flex-col items-center justify-center gap-8 sm:flex-row sm:flex-wrap sm:gap-10">
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

            <HubCard
              to="/nail-salon"
              title="Salão de Unhas"
              accentColor="var(--color-crayon-pink)"
              badge="Vamos pintar!"
              index={2}
              icon={
                <div className="h-[120px] w-[120px]">
                  <HandSVG
                    nails={PREVIEW_NAILS}
                    className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
                </div>
              }
            />

            <HubCard
              to="/duck-nest"
              title="Patinhos no Ninho"
              accentColor="var(--color-crayon-yellow)"
              badge="Vamos brincar!"
              index={3}
              icon={
                <div className="h-[120px] w-[120px]">
                  <DuckSVG
                    color="var(--color-crayon-yellow)"
                    className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
                </div>
              }
            />

            <HubCard
              to="/shape-fit"
              title="Encaixe de Formas"
              accentColor="var(--color-crayon-orange)"
              badge="Vamos encaixar!"
              index={4}
              icon={
                <div className="grid h-[120px] w-[120px] grid-cols-2 gap-1.5">
                  <ShapeSVG
                    shape="circle"
                    color="var(--color-crayon-red)"
                    className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
                  <ShapeSVG
                    shape="square"
                    color="var(--color-crayon-blue)"
                    className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
                  <ShapeSVG
                    shape="triangle"
                    color="var(--color-crayon-green)"
                    className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
                  <ShapeSVG
                    shape="star"
                    color="var(--color-crayon-yellow)"
                    className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
                </div>
              }
            />
          </div>
        </div>
      </PageTransition>
    </div>
  )
}
