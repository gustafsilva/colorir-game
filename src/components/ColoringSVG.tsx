import { useRef, useEffect, useCallback } from "react"

interface ColoringSVGProps {
  svgContent: string
  fills: Record<string, string>
  onPathClick: (pathId: string) => void
}

/**
 * Renders an SVG inline and handles coloring interactions via event delegation.
 *
 * Fillable paths are identified by having an `id` attribute on `<path>` elements.
 * Decorative elements (circles, lines, etc.) are not interactive.
 */
export default function ColoringSVG({ svgContent, fills, onPathClick }: ColoringSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Apply fill colors from state to the DOM paths
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const svg = container.querySelector("svg")
    if (!svg) return

    // Make SVG responsive
    svg.setAttribute("width", "100%")
    svg.setAttribute("height", "100%")
    svg.style.maxWidth = "100%"
    svg.style.maxHeight = "100%"

    const paths = svg.querySelectorAll("path[id]")
    paths.forEach((path) => {
      const pathEl = path as SVGPathElement
      const id = pathEl.getAttribute("id")
      if (!id) return

      const fillColor = fills[id] ?? "#FFFFFF"
      pathEl.setAttribute("fill", fillColor)
      pathEl.style.cursor = "pointer"
      pathEl.classList.add("colorable-path")
    })
  }, [fills, svgContent])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as Element

      // Walk up from click target to find a path with an id
      let el: Element | null = target
      while (el && el !== containerRef.current) {
        if (el.tagName.toLowerCase() === "path" && el.getAttribute("id")) {
          onPathClick(el.getAttribute("id")!)
          return
        }
        el = el.parentElement
      }
    },
    [onPathClick],
  )

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-4"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}
