import { test, expect, waitForNoCelebration } from "./helpers/fixtures"
import type { Page } from "@playwright/test"
import {
  NAIL_CLEAR,
  NAIL_FOOT_BTN,
  NAIL_HAND_BTN,
  NAIL_SURFACE_GROUP,
  NAIL_UNDO,
} from "./helpers/selectors"

const SURFACE_SVG = '[role="img"][aria-label$="para pintar as unhas"]'
const NAIL = `${SURFACE_SVG} [role="button"]`

async function nailLabels(page: Page): Promise<string[]> {
  return page.locator(NAIL).evaluateAll((els) =>
    els.map((e) => e.getAttribute("aria-label") ?? ""),
  )
}

/**
 * Quantas unhas estão decoradas.
 *
 * A unha é um `path#nail-<id>` cujo fill é `EMPTY_NAIL_FILL` quando vazia
 * (NailParts.tsx:7). Glitter vira um `fill="url(#glitter-pattern)"` e o
 * adesivo é um elemento extra dentro do grupo.
 */
const EMPTY_NAIL_FILL = "oklch(0.97 0.015 60)"

async function decoratedCount(page: Page): Promise<number> {
  return page.evaluate((empty) => {
    const nails = Array.from(document.querySelectorAll('path[id^="nail-"]'))
    return nails.filter((n) => {
      const fill = (n.getAttribute("fill") ?? "").trim()
      if (fill && fill !== empty) return true
      // glitter/adesivo: irmãos extras dentro do mesmo grupo
      const group = n.parentElement
      return Boolean(group && group.children.length > 1)
    }).length
  }, EMPTY_NAIL_FILL)
}

test.beforeEach(async ({ page }) => {
  await page.goto("nail-salon")
  await expect(page.locator(NAIL_SURFACE_GROUP)).toBeVisible()
  await page.waitForTimeout(700)
})

test.describe("Salão de Unhas — mecânica", () => {
  test("a mão tem 5 unhas tocáveis", async ({ page }) => {
    const labels = await nailLabels(page)
    await test.info().attach("unhas-da-mao.json", {
      body: JSON.stringify(labels, null, 2),
      contentType: "application/json",
    })
    expect(labels.length, "a mão deveria expor 5 alvos").toBe(5)
  })

  test("trocar para o pé mostra 5 unhas do pé", async ({ page }) => {
    await page.locator(NAIL_FOOT_BTN).click()
    await page.waitForTimeout(600)
    await expect(page.locator(SURFACE_SVG)).toHaveAttribute(
      "aria-label",
      "Pé para pintar as unhas",
    )
    expect((await nailLabels(page)).length).toBe(5)
  })

  test("pintar as 5 unhas da mão dispara a celebração", async ({ page }) => {
    const labels = await nailLabels(page)
    for (const label of labels) {
      // A celebração dispara em 50% (3ª unha) e cobre a tela inteira,
      // engolindo o toque nas unhas seguintes.
      await waitForNoCelebration(page, 4000)
      await page.locator(`${SURFACE_SVG} [aria-label="${label}"]`).click({ force: true })
      await page.waitForTimeout(250)
    }
    await page.waitForTimeout(800)

    // 5 de 5 = 100% → milestone "complete".
    await expect(
      page.locator('[role="button"][aria-label$=" — toque para continuar"]'),
      "pintar as 5 unhas não disparou a celebração",
    ).toBeVisible({ timeout: 5000 })
    expect(await decoratedCount(page)).toBe(5)
  })

  test("desfazer remove a última pintura", async ({ page }) => {
    const labels = await nailLabels(page)
    await page.locator(`${SURFACE_SVG} [aria-label="${labels[0]}"]`).click()
    await page.waitForTimeout(300)
    const after = await decoratedCount(page)

    await page.locator(NAIL_UNDO).click()
    await page.waitForTimeout(400)
    expect(await decoratedCount(page), "desfazer não removeu a pintura").toBeLessThan(after)
  })

  test("limpar tudo zera a superfície", async ({ page }) => {
    const labels = await nailLabels(page)
    for (const label of labels.slice(0, 3)) {
      await page.locator(`${SURFACE_SVG} [aria-label="${label}"]`).click()
      await page.waitForTimeout(200)
    }
    // 3 de 5 unhas = 60% → dispara a celebração "half", que cobre a tela
    // inteira e engole o clique no botão de limpar.
    await waitForNoCelebration(page)
    await page.locator(NAIL_CLEAR).click()
    await page.waitForTimeout(500)
    expect(await decoratedCount(page)).toBe(0)
  })
})

test.describe("Salão de Unhas — undo entre superfícies", () => {
  test("desfazer depois de trocar de superfície não apaga a superfície errada", async ({
    page,
  }) => {
    // O undo stack é GLOBAL, com `surface` embutido em cada ação.
    // Pintar na mão → trocar pro pé → desfazer: o que some?
    const handLabels = await nailLabels(page)
    await page.locator(`${SURFACE_SVG} [aria-label="${handLabels[0]}"]`).click()
    await page.waitForTimeout(300)
    const handPainted = await decoratedCount(page)
    expect(handPainted, "a mão deveria ter 1 unha pintada").toBeGreaterThan(0)

    await page.locator(NAIL_FOOT_BTN).click()
    await page.waitForTimeout(600)
    const footBefore = await decoratedCount(page)

    await page.locator(NAIL_UNDO).click()
    await page.waitForTimeout(500)
    const footAfter = await decoratedCount(page)

    // O pé estava vazio; desfazer uma ação da MÃO não pode mexer nele.
    expect(
      footAfter,
      "desfazer com o pé aberto alterou o pé, mas a ação era da mão",
    ).toBe(footBefore)

    // E a mão deve ter voltado ao estado anterior.
    await page.locator(NAIL_HAND_BTN).click()
    await page.waitForTimeout(600)
    expect(
      await decoratedCount(page),
      "a ação da mão não foi desfeita",
    ).toBeLessThan(handPainted)
  })
})

test.describe("Salão de Unhas — layout", () => {
  test("a mão cabe inteira na área visível", async ({ page }) => {
    // NailSalonPage.tsx:209 usa max-h-[55vh]/[60vh] — `vh`, enquanto todo
    // o resto do app usa `svh`. Em navegador móvel com barra de URL, `vh`
    // é MAIOR que a área realmente visível, então a mão pode ser cortada.
    //
    // Atenção: em headless não existe barra de URL, então vh === svh aqui.
    // Este teste mede o caso ideal; o corte real precisa de device físico.
    const svg = page.locator(SURFACE_SVG)
    const box = (await svg.boundingBox())!
    const vp = page.viewportSize()!

    await test.info().attach("medidas-da-mao.json", {
      body: JSON.stringify({ box, viewport: vp }, null, 2),
      contentType: "application/json",
    })

    expect(box.y, "topo da mão acima da tela").toBeGreaterThanOrEqual(-1)
    expect(
      box.y + box.height,
      `a mão termina em ${Math.round(box.y + box.height)}px numa tela de ${vp.height}px`,
    ).toBeLessThanOrEqual(vp.height + 1)
  })

  test("as unhas são alvos grandes o bastante para um dedo de criança", async ({ page }) => {
    // O alvo é o DEDO inteiro (g role=button), não só a unha — por design.
    // Referência de acessibilidade para toque: 44px.
    const boxes = await page.locator(NAIL).evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect()
        return { label: e.getAttribute("aria-label"), w: Math.round(r.width), h: Math.round(r.height) }
      }),
    )
    await test.info().attach("alvos-de-toque.json", {
      body: JSON.stringify(boxes, null, 2),
      contentType: "application/json",
    })

    const small = boxes.filter((b) => Math.min(b.w, b.h) < 44)
    expect(
      small,
      `alvos menores que 44px: ${JSON.stringify(small)}`,
    ).toEqual([])
  })
})
