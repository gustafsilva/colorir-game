import type { ComponentType } from "react"
import {
  PaintBrush,
  Sparkle,
  Sticker,
  Star,
  Heart,
  Flower,
  type IconProps,
} from "@phosphor-icons/react"
import { STICKER_LABELS, type StickerKind, type Tool } from "@/hooks/useNailSalon"
import { cn } from "@/lib/utils"

const TOOLS: Array<{
  id: Tool
  label: string
  color: string
  Icon: ComponentType<IconProps>
}> = [
  { id: "polish", label: "Esmalte", color: "var(--color-crayon-pink)", Icon: PaintBrush },
  { id: "glitter", label: "Glitter", color: "var(--color-crayon-yellow)", Icon: Sparkle },
  { id: "sticker", label: "Adesivo", color: "var(--color-crayon-purple)", Icon: Sticker },
]

const STICKERS: Array<{
  id: StickerKind
  color: string
  Icon: ComponentType<IconProps>
}> = [
  { id: "star", color: "var(--color-crayon-yellow)", Icon: Star },
  { id: "heart", color: "var(--color-crayon-red)", Icon: Heart },
  { id: "flower", color: "var(--color-crayon-pink)", Icon: Flower },
]

interface NailToolbarProps {
  tool: Tool
  onSelectTool: (tool: Tool) => void
  selectedSticker: StickerKind
  onSelectSticker: (sticker: StickerKind) => void
}

const buttonBase = cn(
  "btn-puffy relative flex items-center justify-center",
  "min-h-(--spacing-touch-lg) min-w-(--spacing-touch-lg)",
  "rounded-full border-[3px] border-white/60",
  "outline-none focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:ring-offset-2",
  "cursor-pointer select-none text-white",
  "motion-safe:active:scale-90 motion-safe:transition-transform",
)

/**
 * Seletor de ferramenta do salão: esmalte / glitter / adesivo.
 * Quando "adesivo" está ativo, mostra também o mini-seletor de stickers.
 * Sem texto visível — só ícones grandes, no padrão do app para 2-5 anos.
 */
export default function NailToolbar({
  tool,
  onSelectTool,
  selectedSticker,
  onSelectSticker,
}: NailToolbarProps) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-3">
      <div role="radiogroup" aria-label="Ferramentas do salão" className="flex items-center gap-4">
        {TOOLS.map(({ id, label, color, Icon }) => {
          const isSelected = tool === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={label}
              onClick={() => onSelectTool(id)}
              className={cn(buttonBase, isSelected && "ring-4 ring-white")}
              style={{ ["--btn-color" as string]: color }}
            >
              <Icon size={32} weight="duotone" color="white" aria-hidden="true" />
            </button>
          )
        })}
      </div>

      {tool === "sticker" && (
        <div role="radiogroup" aria-label="Escolher adesivo" className="flex items-center gap-3">
          {STICKERS.map(({ id, color, Icon }) => {
            const isSelected = selectedSticker === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={STICKER_LABELS[id]}
                onClick={() => onSelectSticker(id)}
                className={cn(
                  "flex min-h-(--spacing-touch) min-w-(--spacing-touch) items-center justify-center",
                  "rounded-full border-[3px] bg-white/90",
                  "outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
                  "cursor-pointer select-none shadow-[0_3px_8px_rgba(0,0,0,0.12)]",
                  "motion-safe:active:scale-90 motion-safe:transition-transform",
                  isSelected ? "border-white ring-4 ring-white" : "border-white/60",
                )}
                style={isSelected ? { backgroundColor: `color-mix(in srgb, ${color} 25%, white)` } : undefined}
              >
                <Icon size={28} weight="fill" color={color} aria-hidden="true" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
