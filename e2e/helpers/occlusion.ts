import type { Page } from "@playwright/test"

/**
 * Detecção de oclusão via document.elementFromPoint.
 *
 * elementFromPoint respeita pointer-events E a ordem de empilhamento real
 * do compositor, então um elemento visualmente coberto por outro é
 * detectado de forma determinística — sem comparar pixels.
 */

export interface TopmostInfo {
  tag: string
  className: string
  /** aria-label do elemento ou do ancestral mais próximo que tenha um. */
  ariaLabel: string | null
  /** Cadeia de tags do topo até o body, para diagnóstico. */
  chain: string
}

/** O que está por cima no ponto (x, y). */
export async function topmostAt(
  page: Page,
  x: number,
  y: number,
): Promise<TopmostInfo | null> {
  return page.evaluate(
    ({ px, py }) => {
      const el = document.elementFromPoint(px, py)
      if (!el) return null

      const readClass = (node: Element): string => {
        const c = node.className as unknown
        if (typeof c === "string") return c
        // SVGAnimatedString
        if (c && typeof c === "object" && "baseVal" in c) {
          return String((c as { baseVal: string }).baseVal)
        }
        return ""
      }

      const labelled = el.closest("[aria-label]")
      const chain: string[] = []
      let node: Element | null = el
      while (node && node !== document.body && chain.length < 8) {
        const cls = readClass(node).split(/\s+/).filter(Boolean).slice(0, 3).join(".")
        chain.push(cls ? `${node.tagName.toLowerCase()}.${cls}` : node.tagName.toLowerCase())
        node = node.parentElement
      }

      return {
        tag: el.tagName.toLowerCase(),
        className: readClass(el),
        ariaLabel: labelled?.getAttribute("aria-label") ?? null,
        chain: chain.join(" < "),
      }
    },
    { px: x, py: y },
  )
}

/**
 * true se o ponto (x, y) pertence ao elemento do seletor (ou a um
 * descendente dele) — ou seja, o elemento NÃO está coberto ali.
 */
export async function isTopmostAt(
  page: Page,
  x: number,
  y: number,
  selector: string,
): Promise<boolean> {
  return page.evaluate(
    ({ px, py, sel }) => {
      const top = document.elementFromPoint(px, py)
      if (!top) return false
      const targets = Array.from(document.querySelectorAll(sel))
      if (targets.length === 0) return false
      return targets.some((t) => t === top || t.contains(top))
    },
    { px: x, py: y, sel: selector },
  )
}

/**
 * Diagnóstico de empilhamento: sobe a árvore a partir de um seletor e
 * reporta quais ancestrais criam stacking context (transform, filter,
 * opacity < 1, will-change...) e qual é o z-index efetivo de cada um.
 *
 * É o que transforma "o pato sumiu" em "o pato sumiu PORQUE".
 */
export async function stackingChain(
  page: Page,
  selector: string,
): Promise<Array<Record<string, string>>> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return []

    const out: Array<Record<string, string>> = []
    let node: Element | null = el

    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node)
      const createsContext =
        cs.transform !== "none" ||
        cs.filter !== "none" ||
        cs.perspective !== "none" ||
        cs.willChange.includes("transform") ||
        cs.willChange.includes("opacity") ||
        cs.isolation === "isolate" ||
        cs.mixBlendMode !== "normal" ||
        (cs.opacity !== "" && Number(cs.opacity) < 1) ||
        (cs.zIndex !== "auto" && cs.position !== "static")

      out.push({
        tag: node.tagName.toLowerCase(),
        class: String(node.className || "").slice(0, 90),
        position: cs.position,
        zIndex: cs.zIndex,
        transform: cs.transform === "none" ? "none" : "SET",
        opacity: cs.opacity,
        createsStackingContext: createsContext ? "SIM" : "não",
      })
      node = node.parentElement
    }

    return out
  }, selector)
}
