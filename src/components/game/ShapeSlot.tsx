import { useEffect, useRef } from "react"
import ShapeSVG from "./ShapeSVG"
import { SHAPE_LABELS, type ShapeId } from "@/hooks/useShapeFit"

export type RegisterSlot = (
  shape: ShapeId,
  getRect: (() => DOMRect) | null,
) => void

interface ShapeSlotProps {
  shape: ShapeId
  /** Cor da peça desta forma na fase — renderizada por cima quando encaixa. */
  pieceColor: string
  /** Peça da mesma forma já assentou aqui. */
  occupied: boolean
  /** Registra o rect do buraco para o hit-test do drag (null = desregistrar). */
  register: RegisterSlot
}

/**
 * Buraco na prancha como alvo de drop. Expõe o próprio bounding rect via
 * callback de registro (lido na hora do pointerUp — robusto a resize/reflow)
 * e renderiza a peça encaixada quando a criança acerta.
 */
export default function ShapeSlot({
  shape,
  pieceColor,
  occupied,
  register,
}: ShapeSlotProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    register(shape, () => {
      // O ref está sempre montado enquanto registrado
      return ref.current!.getBoundingClientRect()
    })
    return () => register(shape, null)
  }, [shape, register])

  const label = SHAPE_LABELS[shape]

  return (
    <div
      ref={ref}
      role="img"
      aria-label={
        occupied
          ? `Buraco em forma de ${label} com peça encaixada`
          : `Buraco em forma de ${label}`
      }
      className="relative flex w-full items-center justify-center"
    >
      <ShapeSVG shape={shape} variant="hole" className="relative z-10 h-auto w-full" />
      {/* Peça um pouco maior que o buraco, "tampando" como no brinquedo real */}
      {occupied && (
        <div className="shape-settle absolute -inset-[4%] z-20">
          <ShapeSVG
            shape={shape}
            color={pieceColor}
            className="h-auto w-full drop-shadow-[0_3px_6px_rgba(0,0,0,0.25)]"
          />
        </div>
      )}
    </div>
  )
}
