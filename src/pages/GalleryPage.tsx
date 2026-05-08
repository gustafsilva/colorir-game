import { drawings, drawingColors } from "@/data/drawings"
import DrawingCard from "@/components/DrawingCard"
import AnimatedBackground from "@/components/AnimatedBackground"
import PageTransition from "@/components/PageTransition"

export default function GalleryPage() {
  return (
    <div className="relative flex h-svh flex-col items-center justify-start overflow-x-hidden overflow-y-auto bg-gradient-to-b from-orange-50 via-pink-50 to-sky-50 px-6 py-6 sm:px-8 sm:py-10 max-[700px]:py-4">
      {/* Magical floating particles */}
      <AnimatedBackground density="low" />

      <PageTransition className="w-full">
        <div className="flex w-full flex-col items-center pb-10">
          {/* Fun animated header */}
          <header className="mb-8 flex flex-col items-center gap-1 select-none sm:mb-12 max-[700px]:mb-3">
            <span className="bounce-title inline-block text-5xl sm:text-6xl max-[700px]:text-4xl" aria-hidden="true">
              🎨
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl max-[700px]:text-2xl">
              Vamos Colorir!
            </h1>
          </header>

          {/* Drawing cards grid — auto-fill adapts columns to available width */}
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4 sm:gap-6 lg:gap-8">
            {drawings.map((drawing, index) => (
              <DrawingCard
                key={drawing.id}
                drawing={drawing}
                color={drawingColors[drawing.id] ?? "crayon-blue"}
                index={index}
              />
            ))}
          </div>
        </div>
      </PageTransition>
    </div>
  )
}
