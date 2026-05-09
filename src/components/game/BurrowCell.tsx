import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import RabbitSVG from "./RabbitSVG"
import BurrowSVG from "./BurrowSVG"
import StarBurst from "./StarBurst"

interface BurrowCellProps {
  index: number
  isActive: boolean
  onCatch: (index: number) => void
}

type RabbitState = "hidden" | "up" | "caught" | "down"

const CATCH_ANIM_MS = 400
const DOWN_ANIM_MS = 220

/**
 * Uma toca + coelho. Botão acessível.
 *
 * Estados internos do coelho:
 *   - `hidden`   coelho não está renderizado (toca vazia)
 *   - `up`       coelho subindo / visível (animação rabbit-pop-up)
 *   - `caught`   criança pegou (rabbit-caught + StarBurst)
 *   - `down`     coelho descendo sem ser pego (rabbit-pop-down)
 *
 * Pais controlam apenas `isActive`. Mudanças disparam transições internas
 * + animações de saída antes de desmontar o SVG.
 */
export default function BurrowCell({ index, isActive, onCatch }: BurrowCellProps) {
  const [state, setState] = useState<RabbitState>("hidden")
  const [showBurst, setShowBurst] = useState(false)
  const [showShake, setShowShake] = useState(false)
  const wasActiveRef = useRef(false)
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    const wasActive = wasActiveRef.current
    wasActiveRef.current = isActive

    if (isActive && !wasActive) {
      // Coelho aparecendo
      setState("up")
      setShowShake(true)
      const t = window.setTimeout(() => setShowShake(false), 360)
      timersRef.current.push(t)
    } else if (!isActive && wasActive) {
      // Coelho saindo (sem ser pego). Se já está em "caught", deixa a animação rolar.
      setState((prev) => (prev === "caught" ? prev : "down"))
      const t = window.setTimeout(() => setState("hidden"), DOWN_ANIM_MS)
      timersRef.current.push(t)
    }
  }, [isActive])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      timersRef.current = []
    }
  }, [])

  const handleClick = () => {
    if (!isActive || state !== "up") return
    setState("caught")
    setShowBurst(true)
    onCatch(index)
    const t1 = window.setTimeout(() => setState("hidden"), CATCH_ANIM_MS)
    const t2 = window.setTimeout(() => setShowBurst(false), 700)
    timersRef.current.push(t1, t2)
  }

  const burrowClass = cn(
    "absolute inset-x-0 bottom-0 h-[55%]",
    !isActive && state === "hidden" && "burrow-pulse",
    showShake && "burrow-shake",
  )

  const rabbitStateClass =
    state === "up"
      ? "rabbit-state-up"
      : state === "caught"
        ? "rabbit-state-caught"
        : state === "down"
          ? "rabbit-state-down"
          : ""

  return (
    <button
      type="button"
      onClick={handleClick}
      role="gridcell"
      aria-label={
        isActive
          ? `Coelho na toca ${index + 1}, toque para pegar!`
          : `Toca ${index + 1}`
      }
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-3xl",
        "bg-gradient-to-b from-sky-50 via-orange-50/30 to-emerald-50",
        "outline-none focus-visible:ring-4 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2",
        "select-none",
        !isActive && "pointer-events-none",
        isActive && "cursor-pointer",
      )}
      style={
        {
          ["--pulse-delay"]: `${index * 120}ms`,
        } as React.CSSProperties
      }
    >
      {/* Toca (sempre visível) */}
      <div
        className={burrowClass}
        style={{
          ["--pulse-delay" as string]: `${index * 120}ms`,
        }}
      >
        <BurrowSVG className="h-full w-full" uniqueId={`b${index}`} />
      </div>

      {/* Coelho (renderizado quando há transição) */}
      {state !== "hidden" && (
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none",
            "bottom-[28%] w-[55%]",
            rabbitStateClass,
          )}
        >
          <RabbitSVG className="h-full w-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]" />
        </div>
      )}

      {/* Burst de partículas no acerto */}
      {showBurst && <StarBurst />}
    </button>
  )
}
