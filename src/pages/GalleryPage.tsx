import { drawings, drawingColors } from "@/data/drawings"
import DrawingCard from "@/components/DrawingCard"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import GalleryHeader from "@/components/GalleryHeader"

export default function GalleryPage() {
  return (
    <div className="relative flex h-svh flex-col items-center justify-start overflow-x-hidden overflow-y-auto bg-gradient-to-b from-orange-50 via-pink-50 to-sky-50 px-6 py-6 sm:px-8 sm:py-10 max-[700px]:py-4">
      <PaperBackground />
      <AnimatedBackground density="low" />

      <PageTransition className="w-full">
        <div className="flex w-full flex-col items-center pb-10">
          <GalleryHeader />

          {/* Drawing cards grid — auto-fill adapts columns to available width */}
          <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5 sm:gap-7 lg:gap-9">
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
