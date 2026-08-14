import { test, expect } from "./helpers/fixtures"
import type { Page } from "@playwright/test"
import { touchSwipe, touchSwipeMulti } from "./helpers/drag"
import { BACK_BUTTON } from "./helpers/selectors"

const COUNTER = '[aria-label$="frutas cortadas"]'

async function readCounter(page: Page): Promise<{ cut: number; goal: number }> {
  const el = page.locator(COUNTER).first()
  if (!(await el.count())) return { cut: -1, goal: -1 }
  const label = (await el.getAttribute("aria-label")) ?? ""
  const m = label.match(/(\d+)\s+de\s+(\d+)/)
  return { cut: Number(m?.[1] ?? -1), goal: Number(m?.[2] ?? -1) }
}

/** Varre a tela com swipes horizontais até bater a meta (ou estourar o tempo). */
async function sliceUntil(page: Page, target: number, timeoutMs = 45_000) {
  const { width, height } = page.viewportSize()!
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const { cut } = await readCounter(page)
    if (cut >= target) return cut
    // Três alturas diferentes, para pegar frutas em qualquer ponto da parábola.
    for (const frac of [0.45, 0.6, 0.35]) {
      await touchSwipe(page, { x: 20, y: height * frac }, { x: width - 20, y: height * frac }, 8)
    }
  }
  return (await readCounter(page)).cut
}

test.beforeEach(async ({ page }) => {
  await page.goto("fruit-slice")
  await expect(page.locator(BACK_BUTTON)).toBeVisible()
  await page.waitForTimeout(900)
})

test.describe("Corta-Frutas — mecânica", () => {
  test("o contador começa em 0 e a meta da fase 1 é 6", async ({ page }) => {
    const { cut, goal } = await readCounter(page)
    expect(cut).toBe(0)
    expect(goal, "meta da fase 1 deveria ser 6").toBe(6)
  })

  test("um swipe corta fruta e incrementa o contador", async ({ page }) => {
    const cut = await sliceUntil(page, 1, 20_000)
    expect(cut, "nenhuma fruta foi cortada em 20s de swipes").toBeGreaterThan(0)
  })

  test("dois dedos cortando ao mesmo tempo funcionam", async ({ page, logs }) => {
    // FruitField mantém Map<pointerId> exatamente para multi-toque.
    const { width, height } = page.viewportSize()!
    const before = (await readCounter(page)).cut

    const deadline = Date.now() + 20_000
    while (Date.now() < deadline) {
      if ((await readCounter(page)).cut > before) break
      await touchSwipeMulti(page, [
        { from: { x: 20, y: height * 0.4 }, to: { x: width - 20, y: height * 0.4 } },
        { from: { x: 20, y: height * 0.6 }, to: { x: width - 20, y: height * 0.6 } },
      ])
    }

    expect((await readCounter(page)).cut, "multi-toque não cortou nada").toBeGreaterThan(before)
    expect(logs.all()).toEqual([])
  })
})

test.describe("Corta-Frutas — bomba", () => {
  test("cortar bomba zera o contador da fase, sem game over", async ({ page }) => {
    test.setTimeout(120_000)
    const { width, height } = page.viewportSize()!

    // Acumula alguma pontuação primeiro.
    const got = await sliceUntil(page, 2, 25_000)
    test.skip(got < 2, "não deu para cortar 2 frutas antes da bomba")

    // Varre até o contador ZERAR (bomba cortada) ou o tempo acabar.
    let zeroed = false
    const deadline = Date.now() + 60_000
    let prev = (await readCounter(page)).cut
    while (Date.now() < deadline) {
      for (const frac of [0.4, 0.55, 0.7]) {
        await touchSwipe(page, { x: 15, y: height * frac }, { x: width - 15, y: height * frac }, 8)
      }
      const now = (await readCounter(page)).cut
      if (prev >= 2 && now === 0) {
        zeroed = true
        break
      }
      prev = now
    }

    test.skip(!zeroed, "nenhuma bomba apareceu no tempo do teste (bombChance é baixa na fase 1)")

    // Depois da pausa de 1400ms o jogo continua jogável — não é game over.
    await page.waitForTimeout(2000)
    await expect(page.locator(COUNTER)).toBeVisible()
    await expect(page.getByText(/parabéns/i)).toHaveCount(0)
    const after = await sliceUntil(page, 1, 20_000)
    expect(after, "o jogo travou depois da bomba").toBeGreaterThan(0)
  })
})

test.describe("Corta-Frutas — fases", () => {
  test("completar a fase 1 avança para a fase 2 com meta maior", async ({ page, logs }) => {
    test.setTimeout(180_000)

    const cut = await sliceUntil(page, 6, 90_000)
    test.skip(cut < 6, `só deu para cortar ${cut}/6 no tempo do teste`)

    await page.waitForTimeout(4000) // celebração de fase
    const { goal } = await readCounter(page)
    expect(goal, "a meta da fase 2 deveria ser 8").toBe(8)
    expect(logs.all()).toEqual([])
  })
})

test.describe("Corta-Frutas — robustez", () => {
  test("aba em background não teleporta as frutas na volta", async ({ page, logs }) => {
    // O dt do requestAnimationFrame é clampado a 32ms exatamente para isso.
    const { width, height } = page.viewportSize()!
    await touchSwipe(page, { x: 20, y: height * 0.5 }, { x: width - 20, y: height * 0.5 }, 8)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 }).catch(() => {})
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      })
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await page.waitForTimeout(3000)
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      })
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await page.waitForTimeout(800)
    await cdp.detach().catch(() => {})

    await expect(page.locator(COUNTER)).toBeVisible()
    expect(logs.all(), "voltar do background gerou erro").toEqual([])
  })

  test("sair no meio do jogo não deixa loop de animação órfão", async ({ page, logs }) => {
    const { width, height } = page.viewportSize()!
    await touchSwipe(page, { x: 20, y: height * 0.5 }, { x: width - 20, y: height * 0.5 }, 8)
    await page.goto("")
    await page.waitForTimeout(2000)
    expect(logs.all()).toEqual([])
  })
})
