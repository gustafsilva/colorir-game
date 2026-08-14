import { test, expect, waitForNoCelebration } from "./helpers/fixtures"
import type { Page } from "@playwright/test"
import { WORM, WORM_BOARD, WORM_COUNTER, WORM_FRUIT, wormSegments } from "./helpers/selectors"

/** Lê "N de M frutas comidas" do contador → [N, M]. */
async function readCounter(page: Page): Promise<[number, number]> {
  const label = (await page.locator(WORM_COUNTER).getAttribute("aria-label")) ?? ""
  const match = label.match(/(\d+)\s+de\s+(\d+)/)
  return match ? [Number(match[1]), Number(match[2])] : [NaN, NaN]
}

async function segmentCount(page: Page): Promise<number> {
  const label = (await page.locator(WORM).getAttribute("aria-label")) ?? ""
  return wormSegments(label)
}

/**
 * Toca na fruta e espera a minhoca chegar (contador subir até `expected`).
 * Caminho máximo no grid 6×8 é 12 passos × 260ms ≈ 3,2s — 12s é folgado.
 */
async function eatOne(page: Page, expected: number) {
  await page.locator(WORM_FRUIT).click({ force: true })
  await expect(page.locator(WORM_COUNTER)).toHaveAttribute(
    "aria-label",
    new RegExp(`^${expected} de \\d+`),
    { timeout: 12_000 },
  )
}

test.beforeEach(async ({ page }) => {
  await page.goto("worm")
  await expect(page.locator(WORM_FRUIT)).toBeVisible()
  await page.waitForTimeout(700)
})

test.describe("Minhoca Comilona — mecânica", () => {
  test("tocar na fruta faz a minhoca comer e crescer", async ({ page, logs }) => {
    expect(await segmentCount(page), "a minhoca começa com 3 segmentos").toBe(3)
    expect(await readCounter(page)).toEqual([0, 4])

    await eatOne(page, 1)

    await expect(page.locator(WORM)).toHaveAttribute(
      "aria-label",
      "Minhoca com 4 segmentos",
      { timeout: 3000 },
    )
    // Nova fruta nasce para o próximo toque
    await expect(page.locator(WORM_FRUIT)).toBeVisible()
    expect(logs.all()).toEqual([])
  })

  test("rajada de toques na fruta não duplica a contagem", async ({ page, logs }) => {
    // O hook ignora toques enquanto a minhoca já está a caminho (movingRef).
    const fruit = page.locator(WORM_FRUIT)
    await fruit.click({ force: true })
    for (let i = 0; i < 5; i++) {
      await fruit.dispatchEvent("click").catch(() => {})
    }

    await expect(page.locator(WORM_COUNTER)).toHaveAttribute(
      "aria-label",
      /^1 de \d+/,
      { timeout: 12_000 },
    )
    // Espera qualquer movimento residual assentar antes de medir
    await page.waitForTimeout(1500)
    expect(await readCounter(page), "a rajada só pode valer 1 fruta").toEqual([1, 4])
    expect(await segmentCount(page), "a rajada só pode crescer 1 segmento").toBe(4)
    expect(logs.all()).toEqual([])
  })

  test("tocar em área vazia do jardim não faz nada", async ({ page, logs }) => {
    const board = page.locator(WORM_BOARD)
    const boardBox = await board.boundingBox()
    const fruitBox = await page.locator(WORM_FRUIT).boundingBox()
    expect(boardBox).not.toBeNull()
    expect(fruitBox).not.toBeNull()

    // Escolhe o canto do tabuleiro mais distante da fruta
    const corners: [number, number][] = [
      [12, 12],
      [boardBox!.width - 12, 12],
      [12, boardBox!.height - 12],
      [boardBox!.width - 12, boardBox!.height - 12],
    ]
    const fruitCx = fruitBox!.x + fruitBox!.width / 2 - boardBox!.x
    const fruitCy = fruitBox!.y + fruitBox!.height / 2 - boardBox!.y
    const [cx, cy] = corners.reduce((best, c) => {
      const d = (c: [number, number]) => Math.hypot(c[0] - fruitCx, c[1] - fruitCy)
      return d(c) > d(best) ? c : best
    })

    await board.click({ position: { x: cx, y: cy }, force: true })
    await page.waitForTimeout(1500)

    expect(await readCounter(page), "toque em área vazia não pode contar fruta").toEqual([0, 4])
    expect(await segmentCount(page), "toque em área vazia não pode mover/crescer").toBe(3)
    expect(logs.all()).toEqual([])
  })
})

test.describe("Minhoca Comilona — fases", () => {
  test("as 3 fases completam (4, 6 e 8 frutas) e chegam ao fim", async ({ page, logs }) => {
    test.setTimeout(240_000)

    const goals: number[] = []
    for (let phase = 0; phase < 3; phase++) {
      // A celebração da fase anterior cobre a tela (fixed inset-0 z-[60])
      await waitForNoCelebration(page)
      const [, goal] = await readCounter(page)
      goals.push(goal)
      for (let i = 1; i <= goal; i++) {
        await eatOne(page, i)
        await page.waitForTimeout(300)
      }
      await page.waitForTimeout(3600) // celebração auto-dismiss
    }

    await test.info().attach("frutas-por-fase.json", {
      body: JSON.stringify(goals),
      contentType: "application/json",
    })
    expect(goals, "as fases deveriam pedir 4, 6 e 8 frutas").toEqual([4, 6, 8])
    await expect(page.getByText(/parabéns/i)).toBeVisible({ timeout: 10_000 })
    // 3 iniciais + 18 frutas comidas — o comprimento persiste entre fases
    await expect(page.getByText(/21 segmentos/i)).toBeVisible()
    expect(logs.all()).toEqual([])
  })
})

test.describe("Minhoca Comilona — robustez", () => {
  test("sair no meio do movimento não deixa interval órfão", async ({ page, logs }) => {
    await page.locator(WORM_FRUIT).click({ force: true })
    // Navega imediatamente, com a minhoca ainda andando
    await page.goto("")
    await page.waitForTimeout(2000)
    expect(logs.all()).toEqual([])
  })
})
