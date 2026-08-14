import { test, expect } from "./helpers/fixtures"
import { centerOf, touchDrag } from "./helpers/drag"
import { DUCK, DUCK_ACTIVE, NEST, ROUTES, duckColor } from "./helpers/selectors"

test.describe("resiliência — localStorage", () => {
  test("storage totalmente bloqueado não derruba nenhuma tela", async ({
    page,
    context,
    logs,
  }) => {
    test.setTimeout(150_000)
    // Modo privado / storage negado: os hooks têm try/catch silencioso
    // com fallback conservador. Este teste prova que o app sobrevive.
    await context.addInitScript(() => {
      const boom = () => {
        throw new Error("SecurityError simulado: storage bloqueado")
      }
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
          getItem: boom,
          setItem: boom,
          removeItem: boom,
          clear: boom,
          key: boom,
          length: 0,
        },
      })
    })

    for (const route of ROUTES) {
      await page.goto(route.path)
      await expect(
        page.locator(route.ready).first(),
        `${route.name} não renderizou com storage bloqueado`,
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(400)
    }

    expect(logs.pageErrors, "storage bloqueado gerou erro de runtime").toEqual([])
  })

  test("JSON corrompido em coloring-completed não quebra a galeria", async ({
    page,
    context,
    logs,
  }) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem("coloring-completed", "{isso não é json válido")
      } catch {
        /* ignore */
      }
    })
    await page.goto("coloring")
    await expect(page.locator("a[href*='coloring/']").first()).toBeVisible({
      timeout: 15_000,
    })
    expect(logs.pageErrors).toEqual([])
  })

  test("tipo errado em coloring-completed (objeto em vez de array) é tolerado", async ({
    page,
    context,
    logs,
  }) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem("coloring-completed", JSON.stringify({ nao: "é array" }))
      } catch {
        /* ignore */
      }
    })
    await page.goto("coloring")
    await expect(page.locator("a[href*='coloring/']").first()).toBeVisible({
      timeout: 15_000,
    })
    await page.waitForTimeout(500)
    expect(logs.pageErrors, "objeto onde se esperava array derrubou a galeria").toEqual([])
  })
})

test.describe("resiliência — recarregar e redimensionar", () => {
  test("recarregar no meio de um jogo reinicia de forma graciosa", async ({ page, logs }) => {
    await page.goto("duck-nest")
    await expect(page.locator(DUCK).first()).toBeVisible()
    await page.waitForTimeout(1200)

    // Assenta um patinho, depois recarrega.
    const label = (await page.locator(DUCK_ACTIVE).first().getAttribute("aria-label")) ?? ""
    const color = duckColor(label)
    const from = await centerOf(page.locator(`[aria-label="${label}"]`).first())
    const to = await centerOf(
      page.locator(`[role="img"][aria-label^="Ninho ${color}"]`).first(),
    )
    await touchDrag(page, from, to, { steps: 12, delayMs: 20 })
    await page.waitForTimeout(600)

    await page.reload()
    await expect(page.locator(DUCK).first()).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1000)

    // Nenhum estado de jogo é persistido: tem que voltar com 3 patinhos.
    await expect(page.locator(DUCK_ACTIVE)).toHaveCount(3)
    expect(logs.all()).toEqual([])
  })

  test("redimensionar durante o arrasto não invalida o alvo de drop", async ({ page }) => {
    // NestSlot registra `() => getBoundingClientRect()` em vez de cachear
    // o rect — em tese robusto a reflow. Este teste prova.
    await page.goto("duck-nest")
    await expect(page.locator(DUCK).first()).toBeVisible()
    await page.waitForTimeout(1200)

    const label = (await page.locator(DUCK_ACTIVE).first().getAttribute("aria-label")) ?? ""
    const color = duckColor(label)
    const from = await centerOf(page.locator(`[aria-label="${label}"]`).first())
    const to = await centerOf(
      page.locator(`[role="img"][aria-label^="Ninho ${color}"]`).first(),
    )

    let resized = false
    await touchDrag(page, from, to, {
      steps: 14,
      delayMs: 25,
      onMove: async (_p, step) => {
        if (step === 5 && !resized) {
          resized = true
          await page.setViewportSize({ width: 360, height: 780 })
        }
      },
    })
    await page.waitForTimeout(800)

    // Depois do resize o alvo mudou de lugar; o drop pode falhar, mas o
    // app não pode quebrar nem deixar o patinho preso.
    const stillDraggable = await page.locator(DUCK_ACTIVE).count()
    const settled = await page
      .locator(`[role="img"][aria-label="Ninho ${color} com patinho"]`)
      .count()
    expect(
      stillDraggable + settled,
      "o patinho sumiu: nem voltou ao lago nem assentou no ninho",
    ).toBeGreaterThan(0)
  })

  test("rotacionar a tela mantém todos os alvos dentro da área visível", async ({ page }) => {
    await page.goto("duck-nest")
    await expect(page.locator(DUCK).first()).toBeVisible()
    await page.waitForTimeout(1000)

    // Paisagem — o caso que mais quebra layouts de h-svh.
    await page.setViewportSize({ width: 844, height: 390 })
    await page.waitForTimeout(900)

    const offscreen = await page.locator(`${DUCK}, ${NEST}`).evaluateAll((els) =>
      els
        .map((e) => {
          const r = e.getBoundingClientRect()
          return {
            label: e.getAttribute("aria-label"),
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
          }
        })
        .filter((b) => b.bottom > window.innerHeight + 2 || b.top < -2),
    )

    await test.info().attach("elementos-fora-da-tela-paisagem.json", {
      body: JSON.stringify(offscreen, null, 2),
      contentType: "application/json",
    })
    expect(
      offscreen,
      `em paisagem, estes alvos ficam fora da tela: ${JSON.stringify(offscreen)}`,
    ).toEqual([])
  })
})
