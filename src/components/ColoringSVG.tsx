import { useRef, useEffect, useCallback } from "react"

interface ColoringSVGProps {
  svgContent: string
  fills: Record<string, string>
  onPathClick: (pathId: string) => void
}

/**
 * Renders an SVG inline and handles coloring interactions via event delegation.
 *
 * innerHTML is set manually via ref (not dangerouslySetInnerHTML) so React
 * never re-creates the SVG DOM on re-renders — this prevents the zoom/reset
 * flash that happens when the parent re-renders on color selection.
 */
export default function ColoringSVG({ svgContent, fills, onPathClick }: ColoringSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Insert SVG and configure sizing only when the drawing changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = svgContent

    const svg = container.querySelector("svg")
    if (!svg) return

    svg.setAttribute("width", "100%")
    svg.setAttribute("height", "100%")
    svg.style.maxWidth = "100%"
    svg.style.maxHeight = "100%"

    svg.querySelectorAll("path[id]").forEach((path) => {
      ;(path as SVGPathElement).style.cursor = "pointer"
      path.classList.add("colorable-path")
    })
  }, [svgContent])

  // Apply fills separately — runs only when fills change, never resets the DOM
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const svg = container.querySelector("svg")
    if (!svg) return

    svg.querySelectorAll("path[id]").forEach((path) => {
      const id = path.getAttribute("id")
      if (id) {
        path.setAttribute("fill", fills[id] ?? "#FFFFFF")
      }
    })
  }, [fills])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as Element

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
    />
  )
}
