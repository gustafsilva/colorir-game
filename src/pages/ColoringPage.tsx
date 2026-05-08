import { useParams, Navigate } from "react-router"
import { useRef, useCallback, useMemo } from "react"
import { drawingSvgContent } from "@/data/drawingSvgContent"
import { useColoring, PALETTE_COLORS } from "@/hooks/useColoring"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { useCelebration } from "@/hooks/useCelebration"
import ActionBar from "@/components/ActionBar"
import ColoringSVG from "@/components/ColoringSVG"
import ColorPalette from "@/components/ColorPalette"
import PaintSplashCanvas, { type PaintSplashRef } from "@/components/PaintSplashCanvas"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import ProgressIndicator from "@/components/ProgressIndicator"
import PageTransition from "@/components/PageTransition"

/**
 * Count total colorable paths in an SVG string by looking for path elements with id attributes.
 */
function countPaths(svgContent: string): number {
  const matches = svgContent.match(/<path[^>]+id="/g)
  return matches?.length ?? 0
}

export default function ColoringPage() {
  const { id } = useParams<{ id: string }>()
  const svgContent = id ? drawingSvgContent[id] : undefined

  const { selectedColor, setSelectedColor, fills, fillPath, undo, clearAll, canUndo, canClear } =
    useColoring()

  const sounds = useSoundEffects()
  const splashRef = useRef<PaintSplashRef>(null)

  const totalPaths = useMemo(() => (svgContent ? countPaths(svgContent) : 0), [svgContent])
  const { progress, milestone, dismissMilestone } = useCelebration(fills, totalPaths)

  const handlePathClick = useCallback(
    (pathId: string) => {
      fillPath(pathId)
      sounds.playSplash()
    },
    [fillPath, sounds],
  )

  const handleSvgClick = useCallback(
    (e: React.MouseEvent) => {
      splashRef.current?.triggerSplash(e.clientX, e.clientY, selectedColor)
    },
    [selectedColor],
  )

  const handleSelectColor = useCallback(
    (color: string) => {
      setSelectedColor(color)
      sounds.playPop()
    },
    [setSelectedColor, sounds],
  )

  const handleUndo = useCallback(() => {
    undo()
    sounds.playWhoosh()
  }, [undo, sounds])

  const handleClear = useCallback(() => {
    clearAll()
    sounds.playClick()
  }, [clearAll, sounds])

  if (!svgContent) {
    return <Navigate to="/" replace />
  }

  return (
    <PageTransition className="bg-background flex h-svh flex-col overflow-hidden pb-20">
      {/* Top bar: back + actions */}
      <ActionBar onUndo={handleUndo} onClear={handleClear} canUndo={canUndo} canClear={canClear} />

      {/* Progress stars */}
      <div className="flex justify-center -mt-1 mb-1">
        <ProgressIndicator progress={progress} />
      </div>

      {/* Coloring canvas with click handler for splash effect */}
      <div className="relative flex flex-1 overflow-hidden" onClick={handleSvgClick}>
        <ColoringSVG svgContent={svgContent} fills={fills} onPathClick={handlePathClick} />
      </div>

      {/* Paint splash particle overlay */}
      <PaintSplashCanvas ref={splashRef} />

      {/* Celebration confetti overlay */}
      <CelebrationOverlay milestone={milestone} onDismiss={dismissMilestone} />

      <ColorPalette
        colors={PALETTE_COLORS.map((c) => c.value)}
        selectedColor={selectedColor}
        onSelectColor={handleSelectColor}
      />
    </PageTransition>
  )
}
