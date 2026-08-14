/**
 * Fases do Quebra-Cabeça.
 *
 * Os desenhos vêm do catálogo de colorir (drawingSvgContent) e são
 * "cortados" por crop de viewBox — todos os SVGs do catálogo são
 * `viewBox="0 0 400 400"` sem <defs>/url(#), então basta renderizar o
 * SVG inteiro com o viewBox do retângulo da peça (ver PuzzleArt).
 *
 * Os fills são curados por desenho: peça colorida é legível para uma
 * criança de 2–5 anos; line art branco não é.
 */
export interface PuzzlePhaseData {
  /** Chave em drawingSvgContent. */
  drawingId: string
  /** Nome pt-BR para os aria-labels ("Quebra-cabeça de maçã"). */
  drawingName: string
  cols: number
  rows: number
  /** pathId → cor crayon aplicada às regiões do desenho. */
  fills: Record<string, string>
}

export const PUZZLE_PHASES: PuzzlePhaseData[] = [
  {
    drawingId: "apple",
    drawingName: "maçã",
    cols: 1,
    rows: 2,
    fills: {
      "apple-body": "var(--color-crayon-red)",
      "apple-stem": "var(--color-crayon-brown)",
      "apple-leaf": "var(--color-crayon-green)",
      "apple-worm": "var(--color-crayon-green-light)",
    },
  },
  {
    drawingId: "fish",
    drawingName: "peixe",
    cols: 2,
    rows: 2,
    fills: {
      "fish-body": "var(--color-crayon-orange)",
      "fish-tail": "var(--color-crayon-yellow)",
      "fish-top-fin": "var(--color-crayon-red)",
      "fish-bottom-fin": "var(--color-crayon-red)",
      "fish-side-fin": "var(--color-crayon-yellow)",
    },
  },
  {
    drawingId: "butterfly",
    drawingName: "borboleta",
    cols: 2,
    rows: 3,
    fills: {
      "butterfly-wing-top-left": "var(--color-crayon-pink)",
      "butterfly-wing-top-right": "var(--color-crayon-pink)",
      "butterfly-wing-bottom-left": "var(--color-crayon-purple)",
      "butterfly-wing-bottom-right": "var(--color-crayon-purple)",
      "butterfly-body": "var(--color-crayon-turquoise)",
      "butterfly-head": "var(--color-crayon-turquoise)",
    },
  },
]
