import { useCallback, useRef } from "react"
import { Link } from "react-router"
import { Star } from "@phosphor-icons/react"
import type { Drawing } from "@/types"
import { cn } from "@/lib/utils"
import { useCompletedDrawings } from "@/hooks/useCompletedDrawings"

interface DrawingCardProps {
  drawing: Drawing
  /** Tailwind crayon color token name, e.g. "crayon-blue" */
  color: string
  /** Card index — used for staggered entrance animation */
  index: number
}

const ariaLabels: Record<string, string> = {
  cat: "Colorir o gato",
  rainbow: "Colorir o arco-íris",
  star: "Colorir a estrela",
  butterfly: "Colorir a borboleta",
  apple: "Colorir a maçã",
  sunflower: "Colorir o girassol",
  parrot: "Colorir o papagaio",
  turtle: "Colorir a tartaruga",
  bear: "Colorir o urso",
  "number-1": "Colorir o número 1",
  "letter-a": "Colorir a letra A",
  tree: "Colorir a árvore",
  "peppa-pig": "Colorir a Peppa Pig",
  "george-pig": "Colorir o George",
  "rebecca-rabbit": "Colorir a Rebecca",
  "papai-pig": "Colorir o Papai Pig",
  "mamae-pig": "Colorir a Mamãe Pig",
  "maria-clara": "Colorir a Maria Clara",
  "galinha-pintadinha": "Colorir a Galinha Pintadinha",
  jp: "Colorir o JP",
}

const colorVarMap: Record<string, string> = {
  "crayon-red": "var(--color-crayon-red)",
  "crayon-orange": "var(--color-crayon-orange)",
  "crayon-yellow": "var(--color-crayon-yellow)",
  "crayon-green": "var(--color-crayon-green)",
  "crayon-blue": "var(--color-crayon-blue)",
  "crayon-purple": "var(--color-crayon-purple)",
}

export default function DrawingCard({ drawing, color, index }: DrawingCardProps) {
  const isNavigating = useRef(false)
  const { isCompleted } = useCompletedDrawings()
  const completed = isCompleted(drawing.id)

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isNavigating.current) {
      e.preventDefault()
      return
    }
    isNavigating.current = true
    setTimeout(() => {
      isNavigating.current = false
    }, 500)
  }, [])

  const label = ariaLabels[drawing.id] ?? `Colorir ${drawing.name}`
  const accentColor = colorVarMap[color] ?? "var(--color-crayon-blue)"

  return (
    <Link
      to={`/coloring/${drawing.id}`}
      viewTransition
      aria-label={completed ? `${label} (já colorido)` : label}
      onClick={handleClick}
      className={cn(
        "group relative flex aspect-square w-full max-w-[220px] flex-col items-stretch justify-self-center overflow-visible",
        "drawing-card-puffy",
        "outline-none focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        "transition-transform duration-300 ease-out",
        "hover:-translate-y-1 active:translate-y-1",
        "active:scale-[0.97] active:duration-100",
        "cursor-pointer",
        "drawing-card card-wobble",
      )}
      style={{
        "--entrance-delay": `${index * 80}ms`,
        "--card-glow": accentColor,
        "--wobble-delay": `${index * 200}ms`,
      } as React.CSSProperties}
    >
      {/* Thumbnail surface — the puffy panel */}
      <span
        aria-hidden="true"
        className="relative block aspect-square w-full overflow-hidden rounded-[28px] border-[3px] border-white drawing-card-surface"
      >
        {/* Inner pastel panel with subtle pattern */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 rounded-2xl border border-black/6 bg-[radial-gradient(circle_at_2px_2px,rgba(0,0,0,0.04)_1px,transparent_0)] bg-[size:10px_10px]"
          style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 12%, white)` }}
        />

        {/* Thick rounded accent bar */}
        <span
          className="pointer-events-none absolute right-2 bottom-0 left-2 h-[6px] rounded-t-full"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        />

        <img
          src={drawing.svgPath}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 m-auto h-[72%] w-[72%] object-contain select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out group-hover:scale-[1.06]"
          style={{ viewTransitionName: `drawing-${drawing.id}` } as React.CSSProperties}
        />

        {/* Completed badge */}
        {completed && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1.5 right-1.5 rounded-full bg-white/85 p-1 shadow-[0_2px_6px_rgba(0,0,0,0.15)] motion-safe:animate-[star-shimmer_1.5s_ease-in-out_infinite]"
          >
            <Star
              size={22}
              weight="fill"
              color="var(--color-crayon-yellow)"
            />
          </span>
        )}
      </span>

      {/* Name label below */}
      <span
        className="text-puffy-sm mt-2 block text-center text-[15px] capitalize leading-tight sm:text-base"
        style={{ color: accentColor }}
      >
        {drawing.name}
      </span>

      <style>{`
        .drawing-card-surface {
          background: linear-gradient(
            145deg,
            color-mix(in srgb, var(--card-glow) 22%, white) 0%,
            color-mix(in srgb, var(--card-glow) 8%, white) 100%
          );
          box-shadow:
            inset 0 2px 0 rgba(255, 255, 255, 0.9),
            inset 0 -4px 8px color-mix(in srgb, var(--card-glow) 30%, transparent),
            0 6px 0 color-mix(in srgb, var(--card-glow) 50%, white),
            0 12px 24px -6px color-mix(in srgb, var(--card-glow) 35%, transparent),
            0 1px 3px rgba(0, 0, 0, 0.08);
          transition: box-shadow 250ms ease-out;
        }
        .drawing-card-puffy:hover .drawing-card-surface {
          box-shadow:
            inset 0 2px 0 rgba(255, 255, 255, 0.95),
            inset 0 -4px 10px color-mix(in srgb, var(--card-glow) 35%, transparent),
            0 8px 0 color-mix(in srgb, var(--card-glow) 50%, white),
            0 18px 32px -8px color-mix(in srgb, var(--card-glow) 45%, transparent),
            0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .drawing-card-puffy:active .drawing-card-surface {
          box-shadow:
            inset 0 2px 0 rgba(255, 255, 255, 0.85),
            inset 0 -2px 4px color-mix(in srgb, var(--card-glow) 25%, transparent),
            0 2px 0 color-mix(in srgb, var(--card-glow) 50%, white),
            0 6px 12px -4px color-mix(in srgb, var(--card-glow) 35%, transparent);
        }
      `}</style>
    </Link>
  )
}
