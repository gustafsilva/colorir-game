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
import FruitSVG from "@/components/game/FruitSVG"
import { MEMORY_FACES } from "@/components/game/MemoryFaces"
import { WormHeadSVG, WormSegmentSVG } from "@/components/game/WormSVG"
import PuzzleArt from "@/components/game/PuzzleArt"
import { PUZZLE_PHASES } from "@/data/puzzles"
import BubbleSVG from "@/components/game/BubbleSVG"
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

            <HubCard
              to="/fruit-slice"
              title="Corta-Frutas"
              accentColor="var(--color-crayon-red)"
              badge="Vamos cortar!"
              index={5}
              icon={
                <div className="grid h-[120px] w-[120px] grid-cols-2 gap-1.5">
                  <FruitSVG
                    kind="apple"
                    className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
                  <FruitSVG
                    kind="banana"
                    className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
                  <FruitSVG
                    kind="watermelon"
                    className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
                  <FruitSVG
                    kind="strawberry"
                    className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]"
                  />
                </div>
              }
            />

            <HubCard
              to="/memory"
              title="Memória"
              accentColor="var(--color-crayon-turquoise)"
              badge="Vamos lembrar!"
              index={6}
              icon={
                <div className="grid h-[120px] w-[120px] grid-cols-2 gap-1.5">
                  {/* Duas cartas de verso + duas faces, como um tabuleiro em jogo */}
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center rounded-lg border-2 border-white/70 bg-gradient-to-b from-[var(--color-crayon-turquoise)] to-[color-mix(in_srgb,var(--color-crayon-turquoise)_70%,black)] shadow-sm"
                    >
                      <svg viewBox="0 0 100 100" aria-hidden="true" className="h-2/3 w-2/3">
                        <path
                          d="M50 8 L61 36 L91 39 L69 59 L75 89 L50 74 L25 89 L31 59 L9 39 L39 36 Z"
                          fill="rgba(255,255,255,0.85)"
                        />
                      </svg>
                    </div>
                  ))}
                  <div className="flex items-center justify-center rounded-lg border-2 border-white bg-white p-1 shadow-sm">
                    {MEMORY_FACES.rabbit.render()}
                  </div>
                  <div className="flex items-center justify-center rounded-lg border-2 border-white bg-white p-1 shadow-sm">
                    {MEMORY_FACES.strawberry.render()}
                  </div>
                </div>
              }
            />

            <HubCard
              to="/worm"
              title="Minhoca Comilona"
              accentColor="var(--color-crayon-green)"
              badge="Vamos comer!"
              index={7}
              icon={
                <div className="relative h-[120px] w-[120px] drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)]">
                  {/* Minhoca em "S" com uma maçã na frente */}
                  <div className="absolute left-0 top-[58px] h-11 w-11">
                    <WormSegmentSVG tone={1} className="h-full w-full" />
                  </div>
                  <div className="absolute left-[26px] top-[44px] h-11 w-11">
                    <WormSegmentSVG tone={0} className="h-full w-full" />
                  </div>
                  <div className="absolute left-[48px] top-[26px] h-12 w-12">
                    <WormHeadSVG dir="right" className="h-full w-full" />
                  </div>
                  <div className="absolute right-0 top-0 h-10 w-10">
                    <FruitSVG kind="apple" className="h-full w-full" />
                  </div>
                </div>
              }
            />

            <HubCard
              to="/puzzle"
              title="Quebra-Cabeça"
              accentColor="var(--color-crayon-turquoise)"
              badge="Vamos montar!"
              index={8}
              icon={
                <div className="grid h-[120px] w-[120px] grid-cols-2 gap-1.5">
                  {/* A maçã da fase 1 cortada em 4, como um tabuleiro em jogo */}
                  {(
                    [
                      { x: 0, y: 0, w: 200, h: 200 },
                      { x: 200, y: 0, w: 200, h: 200 },
                      { x: 0, y: 200, w: 200, h: 200 },
                      { x: 200, y: 200, w: 200, h: 200 },
                    ] as const
                  ).map((clipRect) => (
                    <div
                      key={`${clipRect.x}-${clipRect.y}`}
                      className="overflow-hidden rounded-lg border-2 border-white bg-white shadow-sm"
                    >
                      <PuzzleArt
                        drawingId={PUZZLE_PHASES[0].drawingId}
                        fills={PUZZLE_PHASES[0].fills}
                        clipRect={clipRect}
                        className="h-full w-full"
                      />
                    </div>
                  ))}
                </div>
              }
            />

            <HubCard
              to="/bubble-pop"
              title="Estoura Bolhas"
              accentColor="var(--color-crayon-blue)"
              badge="Vamos estourar!"
              index={9}
              icon={
                <div className="grid h-[120px] w-[120px] grid-cols-2 gap-1.5">
                  {(
                    [
                      "var(--color-crayon-blue)",
                      "var(--color-crayon-pink)",
                      "var(--color-crayon-yellow)",
                      "var(--color-crayon-green)",
                    ] as const
                  ).map((color) => (
                    <BubbleSVG
                      key={color}
                      color={color}
                      className="h-full w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
                    />
                  ))}
                </div>
              }
            />
          </div>
        </div>
      </PageTransition>
    </div>
  )
}
