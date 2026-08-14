import { test, expect } from "./helpers/fixtures"
import type { Page } from "@playwright/test"
import { COLORABLE_PATH, PALETTE, PALETTE_COLOR } from "./helpers/selectors"

const GALLERY_CARD = "a[href*='coloring/']"

async function drawingIds(page: Page): Promise<string[]> {
  return page
    .locator(GALLERY_CARD)
    .evaluateAll((els) =>
      els.map((e) => (e.getAttribute("href") ?? "").split("/").pop() ?? ""),
    )
}

/**
 * Pinta N regiões coloríveis, alternando cores.
 *
 * Dispara o evento direto no path em vez de tocar em coordenadas: aqui
 * queremos exercitar o FLUXO (progresso, celebração, persistência), não a
 * mira. A geometria tem teste próprio ("regiões acertáveis no centro"),
 * e tocar no centro de uma região côncava não pinta nada.
 */
async function paintPaths(page: Page, count: number): Promise<number> {
  const colors = page.locator(PALETTE_COLOR)
  const colorCount = await colors.count()

  const total = await page.locator(COLORABLE_PATH).count()
  const target = Math.min(count, total)

  for (let i = 0; i < target; i++) {
    if (colorCount > 0) {
      // force: a paleta rola na horizontal e seus botões têm animação —
      // sem isso o Playwright gasta segundos por clique tentando estabilizar.
      await colors.nth(i % colorCount).click({ force: true })
      await page.waitForTimeout(60)
    }
    await page.evaluate((idx) => {
      const p = document.querySelectorAll(".colorable-path")[idx]
      p?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
    }, i)
    await page.waitForTimeout(90)
  }
  return target
}

async function progressStars(page: Page): Promise<string | null> {
  const el = page.locator('[aria-label^="Progresso:"]').first()
  return (await el.count()) ? el.getAttribute("aria-label") : null
}

test.describe("Colorir — galeria", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("coloring")
    await expect(page.locator(GALLERY_CARD).first()).toBeVisible()
  })

  test("a galeria lista desenhos com rótulo acessível", async ({ page }) => {
    const ids = await drawingIds(page)
    expect(ids.length, "galeria vazia").toBeGreaterThan(0)

    const unlabelled = await page
      .locator(GALLERY_CARD)
      .evaluateAll((els) =>
        els
          .filter((e) => !e.getAttribute("aria-label") && !e.textContent?.trim())
          .map((e) => e.getAttribute("href")),
      )
    expect(unlabelled, "desenhos sem rótulo acessível").toEqual([])
  })

  test("abrir um desenho leva à tela de colorir", async ({ page }) => {
    await page.locator(GALLERY_CARD).first().click({ force: true })
    await expect(page.locator(COLORABLE_PATH).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator(PALETTE)).toBeVisible()
  })
})

test.describe("Colorir — pintura", () => {
  test("todo desenho tem regiões coloríveis e paleta", async ({ page }) => {
    // Os SVGs são gerados por script e a qualidade varia — verifica os
    // três primeiros, não só o primeiro.
    await page.goto("coloring")
    await expect(page.locator(GALLERY_CARD).first()).toBeVisible({ timeout: 15_000 })
    const ids = (await drawingIds(page)).slice(0, 3)
    expect(ids.length).toBeGreaterThan(0)

    const report: Array<{ id: string; paths: number }> = []
    for (const id of ids) {
      await page.goto(`coloring/${id}`)
      await expect(page.locator(PALETTE)).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(500)
      const paths = await page.locator(COLORABLE_PATH).count()
      report.push({ id, paths })
    }

    await test.info().attach("regioes-por-desenho.json", {
      body: JSON.stringify(report, null, 2),
      contentType: "application/json",
    })
    const empty = report.filter((r) => r.paths === 0)
    expect(empty, `desenhos sem nenhuma região colorível: ${JSON.stringify(empty)}`).toEqual([])
  })

  test("as regiões são acertáveis no centro (mira de criança)", async ({ page }) => {
    // ColoringSVG identifica a região pelo `target` do clique. Se a região
    // for côncava, o centro do seu bounding box cai FORA do preenchimento
    // e o toque não pinta nada. Uma criança de 2 anos mira no meio da forma.
    await page.goto("coloring")
    await expect(page.locator(GALLERY_CARD).first()).toBeVisible({ timeout: 15_000 })
    const ids = (await drawingIds(page)).slice(0, 3)
    const report: Array<{ id: string; total: number; inacessiveis: string[] }> = []

    for (const id of ids) {
      await page.goto(`coloring/${id}`)
      await expect(page.locator(COLORABLE_PATH).first()).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(500)

      const result = await page.evaluate(() => {
        const paths = Array.from(document.querySelectorAll(".colorable-path"))
        const bad: string[] = []
        for (const p of paths) {
          const r = p.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
          if (hit !== p) bad.push(p.id || "(sem id)")
        }
        return { total: paths.length, bad }
      })

      report.push({ id, total: result.total, inacessiveis: result.bad })
    }

    await test.info().attach("regioes-inacessiveis-no-centro.json", {
      body: JSON.stringify(report, null, 2),
      contentType: "application/json",
    })

    const worst = report
      .map((r) => ({ ...r, pct: r.total ? Math.round((r.inacessiveis.length / r.total) * 100) : 0 }))
      .filter((r) => r.pct > 0)

    expect(
      worst,
      `regiões cujo centro do bounding box não pertence à própria região: ${JSON.stringify(worst)}`,
    ).toEqual([])
  })

  test("clicar numa região aplica a cor selecionada", async ({ page }) => {
    await page.goto("coloring")
    await expect(page.locator(GALLERY_CARD).first()).toBeVisible({ timeout: 15_000 })
    const id = (await drawingIds(page))[0]
    await page.goto(`coloring/${id}`)
    await expect(page.locator(COLORABLE_PATH).first()).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(400)

    const path = page.locator(COLORABLE_PATH).first()
    const before = await path.getAttribute("fill")

    await page.locator(PALETTE_COLOR).first().click({ force: true })
    await page.waitForTimeout(150)

    // Procura um ponto que pertença DE FATO à região — o centro do
    // bounding box pode cair fora numa forma côncava. A mira do centro
    // tem teste próprio ("regiões acertáveis no centro").
    const point = await page.evaluate(() => {
      const p = document.querySelector(".colorable-path")
      if (!p) return null
      const r = p.getBoundingClientRect()
      for (let fy = 0.5; fy > 0.05; fy -= 0.1) {
        for (let fx = 0.5; fx < 0.95; fx += 0.1) {
          for (const [dx, dy] of [
            [fx, fy],
            [1 - fx, fy],
            [fx, 1 - fy],
            [1 - fx, 1 - fy],
          ]) {
            const x = r.left + r.width * dx
            const y = r.top + r.height * dy
            if (document.elementFromPoint(x, y) === p) return { x, y }
          }
        }
      }
      return null
    })
    expect(point, "não há nenhum ponto clicável dentro da primeira região").not.toBeNull()

    await page.touchscreen.tap(point!.x, point!.y)
    await page.waitForTimeout(400)

    const after = await path.getAttribute("fill")
    expect(after, "o fill não mudou depois do toque").not.toBe(before)
  })

  test("pintar aumenta o indicador de progresso", async ({ page }) => {
    await page.goto("coloring")
    await expect(page.locator(GALLERY_CARD).first()).toBeVisible({ timeout: 15_000 })
    const id = (await drawingIds(page))[0]
    await page.goto(`coloring/${id}`)
    await expect(page.locator(COLORABLE_PATH).first()).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(400)

    const before = await progressStars(page)
    await paintPaths(page, 5)
    await page.waitForTimeout(400)
    const after = await progressStars(page)

    await test.info().attach("progresso.json", {
      body: JSON.stringify({ before, after }, null, 2),
      contentType: "application/json",
    })
    expect(after, "o progresso não mudou depois de pintar 5 regiões").not.toBe(before)
  })

  test("pintar TODAS as regiões chega a 100% e marca como concluído", async ({ page }) => {
    // countPaths ignora regiões com área < 500u², então 100% tem que ser
    // atingível sem acertar os detalhes minúsculos.
    test.setTimeout(180_000)

    await page.goto("coloring")
    await expect(page.locator(GALLERY_CARD).first()).toBeVisible({ timeout: 15_000 })
    const id = (await drawingIds(page))[0]
    await page.goto(`coloring/${id}`)
    await expect(page.locator(COLORABLE_PATH).first()).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(500)

    const total = await page.locator(COLORABLE_PATH).count()
    await paintPaths(page, total)
    await page.waitForTimeout(1500)

    const stored = await page.evaluate(() => localStorage.getItem("coloring-completed"))
    await test.info().attach("estado-final.json", {
      body: JSON.stringify(
        { id, totalRegioes: total, progresso: await progressStars(page), storage: stored },
        null,
        2,
      ),
      contentType: "application/json",
    })

    expect(
      stored,
      `pintar as ${total} regiões de "${id}" não marcou o desenho como concluído`,
    ).toContain(id)
  })

  test("o desenho concluído aparece marcado na galeria", async ({ page }) => {
    await page.goto("coloring")
    await expect(page.locator(GALLERY_CARD).first()).toBeVisible({ timeout: 15_000 })
    const id = (await drawingIds(page))[0]
    await page.evaluate((d) => localStorage.setItem("coloring-completed", JSON.stringify([d])), id)
    await page.reload()
    await expect(page.locator(GALLERY_CARD).first()).toBeVisible()

    const marked = await page
      .locator(GALLERY_CARD)
      .evaluateAll((els) =>
        els.map((e) => e.getAttribute("aria-label") ?? "").filter((l) => /já colorido/i.test(l)),
      )
    expect(marked.length, "nenhum card ficou marcado como já colorido").toBeGreaterThan(0)
  })
})

test.describe("Colorir — ações", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("coloring")
    await expect(page.locator(GALLERY_CARD).first()).toBeVisible({ timeout: 15_000 })
    const id = (await drawingIds(page))[0]
    await page.goto(`coloring/${id}`)
    await expect(page.locator(COLORABLE_PATH).first()).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(400)
  })

  test("desfazer remove a última cor aplicada", async ({ page }) => {
    const path = page.locator(COLORABLE_PATH).first()
    const original = await path.getAttribute("fill")

    await page.locator(PALETTE_COLOR).first().click({ force: true })
    await path.click({ force: true })
    await page.waitForTimeout(300)
    expect(await path.getAttribute("fill")).not.toBe(original)

    const undo = page.locator('button[aria-label="Desfazer"]')
    test.skip(!(await undo.count()), "sem botão desfazer nesta tela")
    await undo.click({ force: true })
    await page.waitForTimeout(400)
    expect(await path.getAttribute("fill"), "desfazer não restaurou o fill").toBe(original)
  })

  test("limpar tudo restaura o desenho em branco", async ({ page }) => {
    await paintPaths(page, 3)
    await page.waitForTimeout(300)

    const clear = page.locator('button[aria-label="Limpar tudo"]')
    test.skip(!(await clear.count()), "sem botão limpar nesta tela")
    await clear.click({ force: true })
    await page.waitForTimeout(600)

    const stars = await progressStars(page)
    expect(stars, "o progresso não voltou a zero").toMatch(/Progresso: 0/)
  })

  test("trocar de viewport não deixa a dica órfã", async ({ page }) => {
    // ColoringHint posiciona a mãozinha via getBoundingClientRect e
    // recalcula no resize.
    await page.setViewportSize({ width: 820, height: 1180 })
    await page.waitForTimeout(700)

    const hint = page.locator(".coloring-hint, [class*='hint']").first()
    if (await hint.count()) {
      const box = await hint.boundingBox()
      if (box) {
        expect(box.x, "dica saiu pela esquerda").toBeGreaterThan(-50)
        expect(box.x, "dica saiu pela direita").toBeLessThan(820 + 50)
        expect(box.y, "dica saiu por baixo").toBeLessThan(1180 + 50)
      }
    }
    await expect(page.locator(COLORABLE_PATH).first()).toBeVisible()
  })
})
