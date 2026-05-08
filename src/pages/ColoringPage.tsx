import { useParams, Navigate } from "react-router"
import { useRef, useCallback, useEffect, useMemo } from "react"
import { drawingSvgContent } from "@/data/drawingSvgContent"
import { useColoring, PALETTE_COLORS } from "@/hooks/useColoring"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { useCelebration } from "@/hooks/useCelebration"
import { useCompletedDrawings } from "@/hooks/useCompletedDrawings"
import ActionBar from "@/components/ActionBar"
import ColoringSVG from "@/components/ColoringSVG"
import ColorPalette from "@/components/ColorPalette"
import PaintSplashCanvas, { type PaintSplashRef } from "@/components/PaintSplashCanvas"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import ProgressIndicator from "@/components/ProgressIndicator"
import PageTransition from "@/components/PageTransition"
import PaperBackground from "@/components/PaperBackground"
import ColoringHint from "@/components/ColoringHint"
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser"

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
  const { hasSeenHint, dismissHint } = useFirstTimeUser()

  const totalPaths = useMemo(() => (svgContent ? countPaths(svgContent) : 0), [svgContent])
  const { progress, milestone, dismissMilestone } = useCelebration(fills, totalPaths)
  const { markCompleted } = useCompletedDrawings()

  useEffect(() => {
    if (id && milestone === "complete") {
      markCompleted(id)
    }
  }, [id, milestone, markCompleted])

  const handlePathClick = useCallback(
    (pathId: string) => {
      fillPath(pathId)
      sounds.playSplash()
      dismissHint()
    },
    [fillPath, sounds, dismissHint],
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
    <PageTransition className="relative flex h-svh flex-col overflow-hidden bg-gradient-to-b from-orange-50 via-pink-50 to-sky-50 pb-20">
      <PaperBackground />

      {/* Top bar: back + actions */}
      <ActionBar onUndo={handleUndo} onClear={handleClear} canUndo={canUndo} canClear={canClear} />

      {/* Progress stars */}
      <div className="flex justify-center -mt-1 mb-1">
        <ProgressIndicator progress={progress} />
      </div>

      {/* Coloring canvas with click handler for splash effect */}
      <div
        className="relative flex flex-1 overflow-hidden"
        onClick={handleSvgClick}
        style={{ viewTransitionName: `drawing-${id}` } as React.CSSProperties}
      >
        <ColoringSVG svgContent={svgContent} fills={fills} onPathClick={handlePathClick} />
      </div>

      {/* Paint splash particle overlay */}
      <PaintSplashCanvas ref={splashRef} />

      {/* First-time onboarding hint */}
      <ColoringHint visible={!hasSeenHint} />

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
