import { useState, useCallback } from "react"
import type { ColorAction } from "@/types"

export const PALETTE_COLORS = [
  { value: "var(--color-crayon-white)", label: "Branco" },
  { value: "var(--color-crayon-gray)", label: "Cinza" },
  { value: "var(--color-crayon-black)", label: "Preto" },
  { value: "var(--color-crayon-red-light)", label: "Vermelho Claro" },
  { value: "var(--color-crayon-red)", label: "Vermelho" },
  { value: "var(--color-crayon-red-dark)", label: "Vermelho Escuro" },
  { value: "var(--color-crayon-orange)", label: "Laranja" },
  { value: "var(--color-crayon-orange-dark)", label: "Laranja Escuro" },
  { value: "var(--color-crayon-yellow-light)", label: "Amarelo Claro" },
  { value: "var(--color-crayon-yellow)", label: "Amarelo" },
  { value: "var(--color-crayon-green-light)", label: "Verde Claro" },
  { value: "var(--color-crayon-green)", label: "Verde" },
  { value: "var(--color-crayon-green-dark)", label: "Verde Escuro" },
  { value: "var(--color-crayon-turquoise)", label: "Turquesa" },
  { value: "var(--color-crayon-blue-light)", label: "Azul Claro" },
  { value: "var(--color-crayon-blue)", label: "Azul" },
  { value: "var(--color-crayon-blue-dark)", label: "Azul Escuro" },
  { value: "var(--color-crayon-purple-light)", label: "Roxo Claro" },
  { value: "var(--color-crayon-purple)", label: "Roxo" },
  { value: "var(--color-crayon-purple-dark)", label: "Roxo Escuro" },
  { value: "var(--color-crayon-pink-light)", label: "Rosa Claro" },
  { value: "var(--color-crayon-pink)", label: "Rosa" },
  { value: "var(--color-crayon-brown)", label: "Marrom" },
]

const DEFAULT_FILL = "#FFFFFF"
const DEFAULT_SELECTED_COLOR = "var(--color-crayon-red)"

export function useColoring() {
  const [selectedColor, setSelectedColor] = useState(DEFAULT_SELECTED_COLOR)
  const [fills, setFills] = useState<Record<string, string>>({})
  const [undoStack, setUndoStack] = useState<ColorAction[]>([])

  const fillPath = useCallback(
    (pathId: string) => {
      setFills((prev) => {
        const previousColor = prev[pathId] ?? DEFAULT_FILL
        if (previousColor === selectedColor) return prev

        const action: ColorAction = { pathId, previousColor, newColor: selectedColor }
        setUndoStack((stack) => [...stack, action])

        return { ...prev, [pathId]: selectedColor }
      })
    },
    [selectedColor],
  )

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack
      const lastAction = stack[stack.length - 1]
      setFills((prev) => {
        if (lastAction.previousColor === DEFAULT_FILL) {
          const next = { ...prev }
          delete next[lastAction.pathId]
          return next
        }
        return { ...prev, [lastAction.pathId]: lastAction.previousColor }
      })
      return stack.slice(0, -1)
    })
  }, [])

  const clearAll = useCallback(() => {
    setFills({})
    setUndoStack([])
  }, [])

  return {
    selectedColor,
    setSelectedColor,
    fills,
    fillPath,
    undo,
    clearAll,
    canUndo: undoStack.length > 0,
    canClear: Object.keys(fills).length > 0,
  }
}
