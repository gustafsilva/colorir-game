import type { Locator, Page } from "@playwright/test"

export interface Point {
  x: number
  y: number
}

export interface DragOptions {
  /** Quantidade de passos intermediários do gesto. */
  steps?: number
  /** Pausa entre passos — dá tempo do React/RAF reagir. */
  delayMs?: number
  /** Inspeção no MEIO do arrasto (é aqui que bugs de camada aparecem). */
  onMove?: (p: Point, step: number) => Promise<void>
}

/** Centro do bounding box — os jogos fazem hit-test pelo centro do arrastado. */
export async function centerOf(locator: Locator): Promise<Point> {
  const box = await locator.boundingBox()
  if (!box) {
    throw new Error(`Elemento sem bounding box (invisível?): ${locator}`)
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

function lerp(from: Point, to: Point, t: number): Point {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
}

function touchPoint(p: Point, id = 1) {
  return [{ x: Math.round(p.x), y: Math.round(p.y), radiusX: 12, radiusY: 12, force: 1, id }]
}

/**
 * Arrasto por TOQUE via CDP.
 *
 * page.touchscreen só faz tap — não existe drag. E os draggables do app
 * (DuckDraggable/ShapeDraggable) usam Pointer Events com setPointerCapture
 * e `touch-none`, então precisamos de touchStart/touchMove/touchEnd reais.
 */
export async function touchDrag(
  page: Page,
  from: Point,
  to: Point,
  opts: DragOptions = {},
): Promise<void> {
  const { steps = 12, delayMs = 16, onMove } = opts
  const cdp = await page.context().newCDPSession(page)

  try {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: touchPoint(from),
    })

    for (let i = 1; i <= steps; i++) {
      const p = lerp(from, to, i / steps)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: touchPoint(p),
      })
      if (delayMs > 0) await page.waitForTimeout(delayMs)
      if (onMove) await onMove(p, i)
    }

    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  } finally {
    await cdp.detach().catch(() => {})
  }
}

/**
 * Mesmo gesto, com mouse. O código dos jogos não filtra `pointerType`,
 * então os dois caminhos deveriam ser equivalentes — uma divergência
 * entre touchDrag e mouseDrag já é, em si, um achado.
 */
export async function mouseDrag(
  page: Page,
  from: Point,
  to: Point,
  opts: DragOptions = {},
): Promise<void> {
  const { steps = 12, delayMs = 16, onMove } = opts

  await page.mouse.move(from.x, from.y)
  await page.mouse.down()

  for (let i = 1; i <= steps; i++) {
    const p = lerp(from, to, i / steps)
    await page.mouse.move(p.x, p.y)
    if (delayMs > 0) await page.waitForTimeout(delayMs)
    if (onMove) await onMove(p, i)
  }

  await page.mouse.up()
}

/**
 * Swipe simples por toque — usado no corta-frutas e nos testes de scroll.
 * Sem onMove e com passos rápidos, para simular um gesto de verdade.
 */
export async function touchSwipe(
  page: Page,
  from: Point,
  to: Point,
  steps = 10,
): Promise<void> {
  await touchDrag(page, from, to, { steps, delayMs: 8 })
}

/**
 * Dois dedos cortando ao mesmo tempo. O FruitField mantém um
 * Map<pointerId> justamente para suportar isso.
 */
export async function touchSwipeMulti(
  page: Page,
  paths: Array<{ from: Point; to: Point }>,
  steps = 10,
): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  const points = (t: number) =>
    paths.map((path, i) => {
      const p = lerp(path.from, path.to, t)
      return { x: Math.round(p.x), y: Math.round(p.y), radiusX: 12, radiusY: 12, force: 1, id: i + 1 }
    })

  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(0) })
    for (let i = 1; i <= steps; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: points(i / steps),
      })
      await page.waitForTimeout(8)
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  } finally {
    await cdp.detach().catch(() => {})
  }
}

/** Pinça de zoom real, via gesto sintetizado do Chromium. */
export async function pinch(
  page: Page,
  center: Point,
  scaleFactor: number,
): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send("Input.synthesizePinchGesture", {
      x: Math.round(center.x),
      y: Math.round(center.y),
      scaleFactor,
      relativeSpeed: 800,
    })
  } finally {
    await cdp.detach().catch(() => {})
  }
}

/** Duplo toque rápido — o gesto clássico de zoom acidental de criança. */
export async function doubleTap(page: Page, p: Point): Promise<void> {
  await page.touchscreen.tap(p.x, p.y)
  await page.waitForTimeout(60)
  await page.touchscreen.tap(p.x, p.y)
}
