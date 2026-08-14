import { MEMORY_FACES, type FaceId } from "./MemoryFaces"
import type { CardState } from "@/hooks/useMemoryGame"
import { cn } from "@/lib/utils"

interface MemoryCardProps {
  face: FaceId
  state: CardState
  onFlip: () => void
  /** Atraso da animação de entrada (cartas chegam uma a uma). */
  dealDelay?: number
}

/**
 * Uma carta do jogo da memória com flip 3D em CSS puro:
 * wrapper com perspective, miolo com preserve-3d girando em rotateY
 * e duas faces com backface-visibility hidden.
 */
export default function MemoryCard({ face, state, onFlip, dealDelay = 0 }: MemoryCardProps) {
  const isUp = state !== "down"
  const label = MEMORY_FACES[face].label

  return (
    <button
      type="button"
      onClick={onFlip}
      disabled={state === "matched"}
      aria-label={isUp ? `Carta aberta: ${label}` : "Carta virada para baixo"}
      className={cn(
        "memory-deal relative aspect-[3/4] w-full [perspective:800px]",
        "cursor-pointer touch-none select-none outline-none",
        "focus-visible:rounded-2xl focus-visible:ring-4 focus-visible:ring-white/70",
        state === "matched" && "cursor-default",
      )}
      style={{ ["--deal-delay" as string]: `${dealDelay}ms` }}
    >
      <div
        className={cn(
          "memory-card-inner relative h-full w-full",
          isUp && "memory-card-inner--up",
          state === "matched" && "memory-match-pulse",
        )}
      >
        {/* Verso: fundo crayon com estrela */}
        <div
          className={cn(
            "absolute inset-0 [backface-visibility:hidden]",
            "flex items-center justify-center rounded-2xl border-4 border-white/70",
            "bg-gradient-to-b from-[var(--color-crayon-turquoise)] to-[color-mix(in_srgb,var(--color-crayon-turquoise)_70%,black)]",
            "shadow-[0_6px_14px_rgba(0,0,0,0.18),inset_0_2px_4px_rgba(255,255,255,0.35)]",
          )}
        >
          <svg viewBox="0 0 100 100" aria-hidden="true" className="h-1/2 w-1/2 opacity-80">
            <path
              d="M50 8 L61 36 L91 39 L69 59 L75 89 L50 74 L25 89 L31 59 L9 39 L39 36 Z"
              fill="rgba(255,255,255,0.85)"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Face: SVG do registro sobre papel branco */}
        <div
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]",
            "flex items-center justify-center rounded-2xl border-4 border-white",
            "bg-gradient-to-b from-white to-amber-50",
            "p-2 shadow-[0_6px_14px_rgba(0,0,0,0.18)] sm:p-3",
          )}
        >
          <div className="h-full max-h-full w-full">{MEMORY_FACES[face].render()}</div>
        </div>
      </div>
    </button>
  )
}
