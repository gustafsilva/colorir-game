import { useMemo } from "react"
import { drawings, drawingColors, drawingCategories } from "@/data/drawings"
import { CATEGORY_ORDER } from "@/data/categories"
import DrawingCard from "@/components/DrawingCard"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import GalleryHeader from "@/components/GalleryHeader"
import { useCompletedDrawings } from "@/hooks/useCompletedDrawings"
import type { Drawing } from "@/types"

export default function GalleryPage() {
  const { isCompleted } = useCompletedDrawings()

  const groupedDrawings = useMemo(() => {
    const orderedWithinCategory = (items: Drawing[]) => {
      const pending = items.filter((d) => !isCompleted(d.id))
      const done = items.filter((d) => isCompleted(d.id))
      return [...pending, ...done]
    }

    const buckets = new Map<string, Drawing[]>()
    for (const drawing of drawings) {
      const cat = drawingCategories[drawing.id] ?? "natureza"
      if (!buckets.has(cat)) buckets.set(cat, [])
      buckets.get(cat)!.push(drawing)
    }

    return CATEGORY_ORDER
      .map((meta) => ({ meta, items: orderedWithinCategory(buckets.get(meta.id) ?? []) }))
      .filter((g) => g.items.length > 0)
  }, [isCompleted])

  let cardIndex = 0

  return (
    <div className="relative flex h-svh flex-col items-center justify-start overflow-x-hidden overflow-y-auto bg-gradient-to-b from-orange-50 via-pink-50 to-sky-50 px-6 py-6 sm:px-8 sm:py-10 max-[700px]:py-4">
      <PaperBackground />
      <AnimatedBackground density="low" />

      <PageTransition className="w-full">
        <div className="flex w-full flex-col items-center pb-10">
          <GalleryHeader />

          <div className="flex w-full flex-col gap-10">
            {groupedDrawings.map(({ meta, items }) => (
              <section key={meta.id} aria-labelledby={`category-${meta.id}`} className="w-full">
                <h2
                  id={`category-${meta.id}`}
                  className="text-puffy mb-5 flex items-center gap-3 text-2xl text-orange-400 sm:text-3xl"
                >
                  <span aria-hidden="true">{meta.emoji}</span>
                  <span>{meta.label}</span>
                </h2>
                <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5 sm:gap-7 lg:gap-9">
                  {items.map((drawing) => {
                    const idx = cardIndex++
                    return (
                      <DrawingCard
                        key={drawing.id}
                        drawing={drawing}
                        color={drawingColors[drawing.id] ?? "crayon-blue"}
                        index={idx}
                      />
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </PageTransition>
    </div>
  )
}
