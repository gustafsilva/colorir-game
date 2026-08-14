import { useEffect, useRef } from "react"
import { drawingSvgContent } from "@/data/drawingSvgContent"
import type { ClipRect } from "@/hooks/usePuzzle"

interface PuzzleArtProps {
  drawingId: string
  /** pathId → cor crayon. */
  fills: Record<string, string>
  /** Sem clipRect renderiza o desenho inteiro (guia do tabuleiro). */
  clipRect?: ClipRect
  className?: string
}

/**
 * Uma instância do desenho do catálogo, opcionalmente cortada.
 *
 * O "corte" é só o viewBox: os SVGs do catálogo são `0 0 400 400` sem
 * <defs>, então `viewBox="x y w h"` recorta o retângulo da peça de graça
 * (overflow do <svg> é hidden por padrão) — sem clipPath algum.
 *
 * innerHTML via ref (padrão ColoringSVG, ver CLAUDE.md): o React nunca
 * recria a subárvore SVG. Os ids dos paths são REMOVIDOS após aplicar os
 * fills — várias instâncias do mesmo desenho convivem no documento sem
 * ids duplicados (seguro: o catálogo não tem url(#...) nem getElementById).
 */
export default function PuzzleArt({
  drawingId,
  fills,
  clipRect,
  className,
}: PuzzleArtProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewBox = clipRect
    ? `${clipRect.x} ${clipRect.y} ${clipRect.w} ${clipRect.h}`
    : "0 0 400 400"

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = drawingSvgContent[drawingId] ?? ""

    const svg = container.querySelector("svg")
    if (!svg) return

    svg.setAttribute("viewBox", viewBox)
    svg.setAttribute("width", "100%")
    svg.setAttribute("height", "100%")
    svg.style.display = "block"
    svg.style.pointerEvents = "none"

    svg.querySelectorAll("path[id]").forEach((path) => {
      const id = path.getAttribute("id")!
      path.setAttribute("fill", fills[id] ?? "#FFFFFF")
      path.removeAttribute("id")
    })
  }, [drawingId, fills, viewBox])

  return <div ref={containerRef} aria-hidden="true" className={className} />
}
