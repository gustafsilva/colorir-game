import { drawings, drawingColors } from "@/data/drawings"
import DrawingCard from "@/components/DrawingCard"

export default function GalleryPage() {
  return (
    <div className="flex h-svh flex-col items-center justify-center px-4 sm:px-6">
      {/* Decorative crayon emoji — purely visual, non-interactive */}
      <div className="mb-4 select-none text-3xl sm:mb-5" aria-hidden="true">
        🖍️
      </div>

      {/* Drawing cards grid — 2 cols on small screens, 3 on wider */}
      <div className="grid w-full max-w-2xl grid-cols-2 place-content-center gap-4 sm:grid-cols-3 sm:gap-5 lg:gap-6">
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
  )
}
