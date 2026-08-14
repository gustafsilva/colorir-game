import { test, expect } from "./helpers/fixtures"
import { ANY_BACK, ROUTES } from "./helpers/selectors"

const GAMES = ROUTES.filter((r) => r.path !== "")

test.describe("Navegação — ida e volta", () => {
  for (const route of GAMES) {
    test(`${route.name}: abre pelo hub e volta pelo botão`, async ({ page, logs }) => {
      await page.goto("")
      await page.waitForTimeout(400)

      const card = page.locator(`a[href*='${route.path}']`).first()
      test.skip(!(await card.count()), `sem card no hub para ${route.path}`)

      await card.click({ force: true })
      await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 15_000 })

      const back = page.locator(ANY_BACK).first()
      await expect(back, `${route.name} não tem botão de voltar`).toBeVisible()
      await back.click({ force: true })

      await expect(page.locator("a[href*='duck-nest']").first()).toBeVisible({
        timeout: 15_000,
      })
      expect(logs.all(), "erro ao navegar").toEqual([])
    })
  }
})

test.describe("Navegação — deep link", () => {
  for (const route of GAMES) {
    test(`${route.name}: carrega direto pela URL`, async ({ page }) => {
      const res = await page.goto(route.path)
      expect(res?.status(), `deep link retornou ${res?.status()}`).toBeLessThan(400)
      await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 15_000 })
    })
  }
})

test.describe("Navegação — botão voltar do navegador", () => {
  for (const route of GAMES) {
    test(`${route.name}: voltar do navegador retorna ao hub`, async ({ page, logs }) => {
      await page.goto("")
      await page.waitForTimeout(300)
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 15_000 })

      await page.goBack()
      await expect(page.locator("a[href*='duck-nest']").first()).toBeVisible({
        timeout: 15_000,
      })
      expect(logs.all()).toEqual([])
    })
  }
})

test.describe("Navegação — toque duplo no voltar", () => {
  for (const route of GAMES) {
    test(`${route.name}: dois toques rápidos no voltar não empilham navegação`, async ({
      page,
      logs,
    }) => {
      // DuckNestPage tem uma guarda `isNavigating` com timeout de 500ms.
      // Este teste checa se TODAS as páginas têm a mesma proteção — dedo
      // de criança bate duas vezes por reflexo.
      await page.goto("")
      await page.waitForTimeout(300)
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 15_000 })

      const back = page.locator(ANY_BACK).first()
      await back.click({ force: true })
      await back.click({ force: true, timeout: 1500 }).catch(() => {
        /* o botão já sumiu — comportamento aceitável */
      })
      await page.waitForTimeout(900)

      await expect(page.locator("a[href*='duck-nest']").first()).toBeVisible({
        timeout: 15_000,
      })

      // Um segundo "voltar" do navegador não pode cair fora do app.
      await page.goBack()
      await page.waitForTimeout(600)
      expect(page.url(), "saiu do app após duplo toque + voltar").toContain("/colorir-game/")
      expect(logs.all()).toEqual([])
    })
  }
})

test.describe("Navegação — hub", () => {
  test("o hub lista todos os 7 jogos", async ({ page }) => {
    await page.goto("")
    await page.waitForTimeout(500)

    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""))

    const missing = GAMES.filter((g) => !hrefs.some((h) => h.includes(g.path)))
    expect(missing.map((m) => m.name), "jogos ausentes do hub").toEqual([])
  })

  test("o rótulo do botão de voltar é o mesmo em todas as telas", async ({ page }) => {
    // Consistência de rótulo acessível: leitor de tela e testes dependem
    // de um nome estável para a mesma ação.
    const labels: Record<string, string[]> = {}
    for (const route of GAMES) {
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 15_000 })
      labels[route.name] = await page
        .locator('[aria-label*="Voltar"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""))
    }

    await test.info().attach("rotulos-de-voltar.json", {
      body: JSON.stringify(labels, null, 2),
      contentType: "application/json",
    })

    const distinct = [...new Set(Object.values(labels).flat())]
    expect(
      distinct,
      `a mesma ação usa rótulos diferentes conforme a tela: ${JSON.stringify(labels)}`,
    ).toHaveLength(1)
  })

  test("todos os cards do hub são alvos grandes de toque", async ({ page }) => {
    await page.goto("")
    await page.waitForTimeout(500)

    const small = await page.locator("a[href]").evaluateAll((els) =>
      els
        .map((e) => {
          const r = e.getBoundingClientRect()
          return { href: e.getAttribute("href"), w: Math.round(r.width), h: Math.round(r.height) }
        })
        .filter((b) => b.w > 0 && Math.min(b.w, b.h) < 44),
    )
    expect(small, `cards menores que 44px: ${JSON.stringify(small)}`).toEqual([])
  })
})
