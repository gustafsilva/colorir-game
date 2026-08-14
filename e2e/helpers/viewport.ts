import type { Page } from "@playwright/test"

export interface ViewportState {
  /** 1 = sem zoom. Qualquer coisa != 1 significa que a criança deu pinch. */
  scale: number
  scrollTop: number
  scrollY: number
  scrollHeight: number
  scrollWidth: number
  innerHeight: number
  innerWidth: number
  visualHeight: number
  visualWidth: number
  /** offsetTop do visualViewport — > 0 significa que a página deslocou. */
  offsetTop: number
  offsetLeft: number
}

export async function readViewportState(page: Page): Promise<ViewportState> {
  return page.evaluate(() => {
    const vv = window.visualViewport
    const doc = document.documentElement
    return {
      scale: vv?.scale ?? 1,
      scrollTop: document.scrollingElement?.scrollTop ?? 0,
      scrollY: window.scrollY,
      scrollHeight: doc.scrollHeight,
      scrollWidth: doc.scrollWidth,
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      visualHeight: vv?.height ?? window.innerHeight,
      visualWidth: vv?.width ?? window.innerWidth,
      offsetTop: vv?.offsetTop ?? 0,
      offsetLeft: vv?.offsetLeft ?? 0,
    }
  })
}

/**
 * Elementos que rolam de propósito (a paleta de cores é scrollável na
 * horizontal). Uma correção futura que aplique `touch-action: none`
 * global quebraria estes — por isso a suíte os inventaria.
 */
export async function findScrollableElements(page: Page): Promise<
  Array<{ selector: string; axis: string; overflowX: string; overflowY: string }>
> {
  return page.evaluate(() => {
    const out: Array<{ selector: string; axis: string; overflowX: string; overflowY: string }> = []

    for (const el of Array.from(document.querySelectorAll("*"))) {
      const cs = getComputedStyle(el)
      const scrollsX = el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(cs.overflowX)
      const scrollsY = el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(cs.overflowY)
      if (!scrollsX && !scrollsY) continue

      const label = el.getAttribute("aria-label")
      const cls = String(el.className || "").split(/\s+/).filter(Boolean).slice(0, 3).join(".")
      out.push({
        selector: label ? `[aria-label="${label}"]` : `${el.tagName.toLowerCase()}.${cls}`,
        axis: scrollsX && scrollsY ? "ambos" : scrollsX ? "horizontal" : "vertical",
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
      })
    }

    return out
  })
}

/** Regras globais que deveriam travar a tela — lidas do CSS computado. */
export async function readLockStyles(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const html = getComputedStyle(document.documentElement)
    const body = getComputedStyle(document.body)
    const meta = document
      .querySelector('meta[name="viewport"]')
      ?.getAttribute("content")
    return {
      metaViewport: meta ?? "(ausente)",
      htmlOverflow: html.overflow,
      htmlOverscroll: html.overscrollBehavior,
      htmlTouchAction: html.touchAction,
      htmlHeight: html.height,
      htmlPosition: html.position,
      bodyOverflow: body.overflow,
      bodyOverscroll: body.overscrollBehavior,
      bodyTouchAction: body.touchAction,
      bodyPosition: body.position,
    }
  })
}
