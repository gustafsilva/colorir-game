import { useParams, Navigate } from "react-router"
import { drawingSvgContent } from "@/data/drawingSvgContent"
import { useColoring, PALETTE_COLORS } from "@/hooks/useColoring"
import ActionBar from "@/components/ActionBar"
import ColoringSVG from "@/components/ColoringSVG"
import ColorPalette from "@/components/ColorPalette"

export default function ColoringPage() {
  const { id } = useParams<{ id: string }>()
  const svgContent = id ? drawingSvgContent[id] : undefined

  const { selectedColor, setSelectedColor, fills, fillPath, undo, clearAll, canUndo, canClear } =
    useColoring()

  if (!svgContent) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="bg-background flex h-svh flex-col overflow-hidden pb-20">
      <ActionBar onUndo={undo} onClear={clearAll} canUndo={canUndo} canClear={canClear} />
      <ColoringSVG svgContent={svgContent} fills={fills} onPathClick={fillPath} />
      <ColorPalette
        colors={PALETTE_COLORS.map((c) => c.value)}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
      />
    </div>
  )
}
