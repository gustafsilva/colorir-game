import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft, ArrowCounterClockwise, Eraser, HandPalm, Footprints } from "@phosphor-icons/react"
import AnimatedBackground from "@/components/AnimatedBackground"
import PaperBackground from "@/components/PaperBackground"
import PageTransition from "@/components/PageTransition"
import CelebrationOverlay from "@/components/CelebrationOverlay"
import ColorPalette from "@/components/ColorPalette"
import ProgressIndicator from "@/components/ProgressIndicator"
import HandSVG from "@/components/game/HandSVG"
import FootSVG from "@/components/game/FootSVG"
import NailToolbar from "@/components/game/NailToolbar"
import { useNailSalon, NAIL_IDS, POLISH_COLORS } from "@/hooks/useNailSalon"
import type { NailId, StickerKind, Surface, Tool } from "@/hooks/useNailSalon"
import { useCelebration } from "@/hooks/useCelebration"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { cn } from "@/lib/utils"

const topButtonBase = cn(
  "btn-puffy relative flex items-center justify-center",
  "min-h-(--spacing-touch-lg) min-w-(--spacing-touch-lg) px-4",
  "rounded-full border-[3px] border-white/60",
  "outline-none focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:ring-offset-2",
  "cursor-pointer select-none text-white",
)

export default function NailSalonPage() {
  const navigate = useNavigate()
  const {
    surface,
    setSurface,
    tool,
    setTool,
    selectedColor,
    setSelectedColor,
    selectedSticker,
    setSelectedSticker,
    nails,
    handFills,
    footFills,
    applyTool,
    undo,
    reset,
    canUndo,
    canClear,
  } = useNailSalon()

  const sounds = useSoundEffects()

  // Uma instância de celebração por superfície: cada uma guarda seus próprios
  // milestones vistos, então alternar mão/pé não re-dispara confete antigo.
  const handCelebration = useCelebration(handFills, NAIL_IDS.length)
  const footCelebration = useCelebration(footFills, NAIL_IDS.length)
  const { progress, milestone, dismissMilestone } =
    surface === "hand" ? handCelebration : footCelebration

  useEffect(() => {
    if (milestone === "complete") sounds.playTada()
  }, [milestone, sounds])

  // Debounce de navegação (toque duplo é comum com toddlers)
  const isNavigating = useRef(false)
  const handleBack = useCallback(() => {
    if (isNavigating.current) return
    isNavigating.current = true
    sounds.playClick()
    navigate("/")
    setTimeout(() => {
      isNavigating.current = false
    }, 500)
  }, [navigate, sounds])

  const handleNailTap = useCallback(
    (nailId: NailId) => {
      const applied = applyTool(nailId)
      if (applied === "polish") sounds.playSplash()
      else if (applied === "glitter") sounds.playSparkle()
      else if (applied === "sticker") sounds.playPop()
    },
    [applyTool, sounds],
  )

  const handleSelectTool = useCallback(
    (next: Tool) => {
      setTool(next)
      sounds.playClick()
    },
    [setTool, sounds],
  )

  const handleSelectColor = useCallback(
    (color: string) => {
      setSelectedColor(color)
      setTool("polish")
      sounds.playPop()
    },
    [setSelectedColor, setTool, sounds],
  )

  const handleSelectSticker = useCallback(
    (sticker: StickerKind) => {
      setSelectedSticker(sticker)
      sounds.playClick()
    },
    [setSelectedSticker, sounds],
  )

  const handleSurfaceChange = useCallback(
    (next: Surface) => {
      if (next === surface) return
      setSurface(next)
      sounds.playWhoosh()
    },
    [surface, setSurface, sounds],
  )

  const handleUndo = useCallback(() => {
    undo()
    sounds.playWhoosh()
  }, [undo, sounds])

  const handleClear = useCallback(() => {
    reset()
    sounds.playClick()
  }, [reset, sounds])

  const ActiveSVG = surface === "hand" ? HandSVG : FootSVG

  return (
    <div className="relative flex h-svh w-full flex-col items-center overflow-hidden bg-gradient-to-b from-pink-50 via-rose-50 to-purple-50 px-4 py-4 pb-30 sm:py-6 sm:pb-32">
      <PaperBackground />
      <AnimatedBackground density="low" />

      <PageTransition className="flex w-full flex-1 flex-col items-center">
        {/* Topo: voltar + desfazer/limpar */}
        <nav
          aria-label="Ações do salão"
          className="relative z-10 mb-2 flex w-full max-w-[640px] items-center justify-between gap-3"
        >
          <button
            type="button"
            onClick={handleBack}
            aria-label="Voltar para o início"
            className={topButtonBase}
            style={{ ["--btn-color" as string]: "var(--color-crayon-blue)" }}
          >
            <ArrowLeft size={32} weight="duotone" color="white" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              aria-label="Desfazer"
              aria-disabled={!canUndo}
              className={topButtonBase}
              style={{ ["--btn-color" as string]: "var(--color-crayon-orange)" }}
            >
              <ArrowCounterClockwise size={32} weight="duotone" color="white" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!canClear}
              aria-label="Limpar tudo"
              aria-disabled={!canClear}
              className={topButtonBase}
              style={{ ["--btn-color" as string]: "var(--color-crayon-pink)" }}
            >
              <Eraser size={32} weight="duotone" color="white" aria-hidden="true" />
            </button>
          </div>
        </nav>

        {/* Progresso + toggle mão/pé */}
        <div className="relative z-10 mb-2 flex flex-col items-center gap-2">
          <ProgressIndicator progress={progress} />
          <div className="flex items-center gap-3" role="group" aria-label="Escolher mão ou pé">
            <button
              type="button"
              onClick={() => handleSurfaceChange("hand")}
              aria-pressed={surface === "hand"}
              aria-label="Pintar as unhas da mão"
              className={cn(topButtonBase, surface === "hand" && "ring-4 ring-white")}
              style={{ ["--btn-color" as string]: "var(--color-crayon-purple)" }}
            >
              <HandPalm size={28} weight="duotone" color="white" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleSurfaceChange("foot")}
              aria-pressed={surface === "foot"}
              aria-label="Pintar as unhas do pé"
              className={cn(topButtonBase, surface === "foot" && "ring-4 ring-white")}
              style={{ ["--btn-color" as string]: "var(--color-crayon-turquoise)" }}
            >
              <Footprints size={28} weight="duotone" color="white" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mão/pé centralizado no espaço restante */}
        <div className="relative z-10 flex w-full flex-1 items-center justify-center overflow-hidden">
          <ActiveSVG
            key={surface}
            nails={nails}
            onNailTap={handleNailTap}
            className="h-full max-h-[55vh] w-auto max-w-full drop-shadow-[0_6px_16px_rgba(0,0,0,0.12)] sm:max-h-[60vh]"
          />
        </div>

        {/* Ferramentas */}
        <div className="relative z-10 mt-2">
          <NailToolbar
            tool={tool}
            onSelectTool={handleSelectTool}
            selectedSticker={selectedSticker}
            onSelectSticker={handleSelectSticker}
          />
        </div>
      </PageTransition>

      {/* Paleta de esmaltes (barra fixa inferior) — só no modo esmalte */}
      {tool === "polish" && (
        <ColorPalette
          colors={POLISH_COLORS}
          selectedColor={selectedColor}
          onSelectColor={handleSelectColor}
        />
      )}

      <CelebrationOverlay milestone={milestone} onDismiss={dismissMilestone} />
    </div>
  )
}
