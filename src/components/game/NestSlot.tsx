import { useEffect, useRef } from "react"
import NestSVG from "./NestSVG"
import DuckSVG from "./DuckSVG"
import { DUCK_COLOR_VARS, type DuckColor } from "@/hooks/useDuckNest"

export type RegisterNest = (
  color: DuckColor,
  getRect: (() => DOMRect) | null,
) => void

interface NestSlotProps {
  color: DuckColor
  /** Patinho da mesma cor já assentou aqui. */
  occupied: boolean
  /** Registra o rect do ninho para o hit-test do drag (null = desregistrar). */
  register: RegisterNest
}

const NEST_LABELS: Record<DuckColor, string> = {
  red: "Ninho vermelho",
  blue: "Ninho azul",
  yellow: "Ninho amarelo",
  pink: "Ninho rosa",
  green: "Ninho verde",
  orange: "Ninho laranja",
  purple: "Ninho roxo",
  white: "Ninho branco",
}

/**
 * Ninho como alvo de drop. Expõe o próprio bounding rect via callback de
 * registro (lido na hora do pointerUp — robusto a resize/reflow) e renderiza
 * o patinho assentado quando a criança acerta.
 */
export default function NestSlot({ color, occupied, register }: NestSlotProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    register(color, () => {
      // O ref está sempre montado enquanto registrado
      return ref.current!.getBoundingClientRect()
    })
    return () => register(color, null)
  }, [color, register])

  return (
    <div
      ref={ref}
      role="img"
      aria-label={occupied ? `${NEST_LABELS[color]} com patinho` : NEST_LABELS[color]}
      className="relative flex w-full items-end justify-center"
    >
      {/* Patinho assentado, espiando de dentro do ninho */}
      {occupied && (
        <div className="duck-settle absolute bottom-[55%] left-1/2 w-[58%] -translate-x-1/2">
          <DuckSVG color={DUCK_COLOR_VARS[color]} className="h-auto w-full" />
        </div>
      )}
      <NestSVG color={DUCK_COLOR_VARS[color]} className="relative z-10 h-auto w-full" />
    </div>
  )
}
