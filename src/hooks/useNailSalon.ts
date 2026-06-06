import { useState, useCallback, useMemo } from "react"

export type NailId = "thumb" | "index" | "middle" | "ring" | "pinky"
export type Tool = "polish" | "glitter" | "sticker"
export type StickerKind = "star" | "heart" | "flower"
export type Surface = "hand" | "foot"

export interface NailDecor {
  /** Cor base do esmalte (CSS var). Ausente = unha sem pintar. */
  color?: string
  glitter: boolean
  sticker?: StickerKind
}

export const NAIL_IDS: NailId[] = ["thumb", "index", "middle", "ring", "pinky"]

export const STICKER_LABELS: Record<StickerKind, string> = {
  star: "Estrela",
  heart: "Coração",
  flower: "Florzinha",
}

/** Subset da paleta crayon com cara de vidrinhos de esmalte. */
export const POLISH_COLORS = [
  "var(--color-crayon-pink)",
  "var(--color-crayon-pink-light)",
  "var(--color-crayon-red)",
  "var(--color-crayon-red-light)",
  "var(--color-crayon-orange)",
  "var(--color-crayon-yellow)",
  "var(--color-crayon-green)",
  "var(--color-crayon-turquoise)",
  "var(--color-crayon-blue)",
  "var(--color-crayon-blue-light)",
  "var(--color-crayon-purple)",
  "var(--color-crayon-purple-light)",
  "var(--color-crayon-white)",
]

const EMPTY_DECOR: NailDecor = { glitter: false }

function emptyNails(): Record<NailId, NailDecor> {
  return {
    thumb: EMPTY_DECOR,
    index: EMPTY_DECOR,
    middle: EMPTY_DECOR,
    ring: EMPTY_DECOR,
    pinky: EMPTY_DECOR,
  }
}

/** Converte o estado das unhas no shape `fills` que `useCelebration` espera. */
function decorToFills(nails: Record<NailId, NailDecor>): Record<string, string> {
  const fills: Record<string, string> = {}
  for (const id of NAIL_IDS) {
    const color = nails[id].color
    if (color) fills[id] = color
  }
  return fills
}

interface UndoEntry {
  surface: Surface
  nailId: NailId
  prev: NailDecor
}

const DEFAULT_COLOR = "var(--color-crayon-pink)"

/**
 * Estado do Salão de Unhas: decoração por unha (cor + glitter + adesivo),
 * ferramenta ativa e superfícies independentes (mão/pé) — alternar entre
 * elas preserva o trabalho feito em cada uma.
 *
 * Sem persistência: jogo criativo livre, segue o padrão do colorir
 * (useColoring), não o do rabbit-hunt (que persiste high score).
 */
export function useNailSalon() {
  const [surface, setSurface] = useState<Surface>("hand")
  const [tool, setTool] = useState<Tool>("polish")
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR)
  const [selectedSticker, setSelectedSticker] = useState<StickerKind>("star")
  const [handNails, setHandNails] = useState<Record<NailId, NailDecor>>(emptyNails)
  const [footNails, setFootNails] = useState<Record<NailId, NailDecor>>(emptyNails)
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])

  const nails = surface === "hand" ? handNails : footNails

  /**
   * Aplica a ferramenta ativa na unha tocada. Retorna a ferramenta aplicada
   * (para a página escolher o som certo) ou null quando nada mudou.
   */
  const applyTool = useCallback(
    (nailId: NailId): Tool | null => {
      const current = surface === "hand" ? handNails : footNails
      const setNails = surface === "hand" ? setHandNails : setFootNails
      const prev = current[nailId]

      let next: NailDecor
      switch (tool) {
        case "polish":
          if (prev.color === selectedColor) return null
          next = { ...prev, color: selectedColor }
          break
        case "glitter":
          next = { ...prev, glitter: !prev.glitter }
          break
        case "sticker":
          // Tocar com o mesmo adesivo remove (toggle); com outro, troca.
          next = {
            ...prev,
            sticker: prev.sticker === selectedSticker ? undefined : selectedSticker,
          }
          break
      }

      setUndoStack((stack) => [...stack, { surface, nailId, prev }])
      setNails((n) => ({ ...n, [nailId]: next }))
      return tool
    },
    [surface, handNails, footNails, tool, selectedColor, selectedSticker],
  )

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack
      const last = stack[stack.length - 1]
      const setNails = last.surface === "hand" ? setHandNails : setFootNails
      setNails((n) => ({ ...n, [last.nailId]: last.prev }))
      return stack.slice(0, -1)
    })
  }, [])

  /** Limpa apenas a superfície visível (e o histórico dela). */
  const reset = useCallback(() => {
    const setNails = surface === "hand" ? setHandNails : setFootNails
    setNails(emptyNails())
    setUndoStack((stack) => stack.filter((entry) => entry.surface !== surface))
  }, [surface])

  const handFills = useMemo(() => decorToFills(handNails), [handNails])
  const footFills = useMemo(() => decorToFills(footNails), [footNails])

  const canClear = NAIL_IDS.some(
    (id) => nails[id].color || nails[id].glitter || nails[id].sticker,
  )

  return {
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
    canUndo: undoStack.length > 0,
    canClear,
  }
}
