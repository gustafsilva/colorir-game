import { test, expect } from "./helpers/fixtures"
import type { Page } from "@playwright/test"
import { centerOf, touchDrag } from "./helpers/drag"
import { isTopmostAt, topmostAt } from "./helpers/occlusion"
import { HOLE, PIECE, holeShape, pieceShape } from "./helpers/selectors"

const pieceOf = (shape: string) => `[role="button"][aria-label="Peça em forma de ${shape}"]`
const holeOf = (shape: string) => `[role="img"][aria-label^="Buraco em forma de ${shape}"]`
const holeFilled = (shape: string) =>
  `[role="img"][aria-label="Buraco em forma de ${shape} com peça encaixada"]`

async function shapesOnBoard(page: Page) {
  const pieces = await page
    .locator(PIECE)
    .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""))
  const holes = await page
    .locator(HOLE)
    .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""))
  return {
    pieces: pieces.map(pieceShape),
    holes: holes.map(holeShape),
  }
}

async function fitPiece(page: Page, shape: string) {
  const from = await centerOf(page.locator(pieceOf(shape)).first())
  const to = await centerOf(page.locator(holeOf(shape)).first())
  await touchDrag(page, from, to, { steps: 14, delayMs: 20 })
}

test.beforeEach(async ({ page }) => {
  await page.goto("shape-fit")
  await expect(page.locator(PIECE).first()).toBeVisible()
  await page.waitForTimeout(900)
})

test.describe("Encaixe de Formas — mecânica", () => {
  test("a peça encaixa no buraco da mesma forma", async ({ page }) => {
    const { pieces } = await shapesOnBoard(page)
    await fitPiece(page, pieces[0])
    await page.waitForTimeout(500)
    await expect(page.locator(holeFilled(pieces[0]))).toBeVisible()
  })

  test("a peça arrastada continua visível sobre a prancha de buracos", async ({ page }) => {
    // Mesmo teste de oclusão do duck-nest. Aqui é a contraprova: nem a
    // prancha nem a bandeja criam stacking context, então a peça deveria
    // passar por cima o tempo todo.
    const { pieces } = await shapesOnBoard(page)
    const shape = pieces[0]
    const sel = pieceOf(shape)
    const from = await centerOf(page.locator(sel).first())
    const to = await centerOf(page.locator(holeOf(shape)).first())

    const occlusions: unknown[] = []
    await touchDrag(page, from, to, {
      steps: 16,
      delayMs: 25,
      onMove: async (p, step) => {
        if (await isTopmostAt(page, p.x, p.y, sel)) return
        const top = await topmostAt(page, p.x, p.y)
        occlusions.push({ step, ponto: { x: Math.round(p.x), y: Math.round(p.y) }, topo: top?.chain })
      },
    })

    if (occlusions.length) {
      await test.info().attach("oclusoes.json", {
        body: JSON.stringify(occlusions, null, 2),
        contentType: "application/json",
      })
    }
    expect(occlusions, `peça "${shape}" ficou coberta durante o arrasto`).toEqual([])
  })

  test("soltar no buraco errado devolve a peça", async ({ page }) => {
    const { pieces, holes } = await shapesOnBoard(page)
    const wrong = holes.find((h) => h !== pieces[0])
    test.skip(!wrong, "tabuleiro só tem um tipo de buraco")

    const piece = page.locator(pieceOf(pieces[0])).first()
    const before = await piece.boundingBox()
    const from = await centerOf(piece)
    const to = await centerOf(page.locator(holeOf(wrong!)).first())

    await touchDrag(page, from, to, { steps: 12, delayMs: 20 })
    await page.waitForTimeout(700) // RETURN_MS = 320 + folga

    await expect(page.locator(holeFilled(wrong!))).toHaveCount(0)
    const after = await piece.boundingBox()
    expect(Math.abs(after!.x - before!.x) + Math.abs(after!.y - before!.y)).toBeLessThan(4)
  })

  test("o encaixe não depende da cor da peça", async ({ page }) => {
    // As cores rotacionam entre fases de propósito, para a criança
    // parear por FORMA. Confirma que forma é o que manda.
    const { pieces, holes } = await shapesOnBoard(page)
    for (const shape of pieces) {
      expect(holes, `não existe buraco para a peça "${shape}"`).toContain(shape)
    }
  })

  test("mira generosa: soltar perto do buraco certo funciona", async ({ page }) => {
    // SLOT_HIT_MARGIN = 24px absolutos.
    const { pieces } = await shapesOnBoard(page)
    const shape = pieces[0]
    const box = (await page.locator(holeOf(shape)).first().boundingBox())!
    const from = await centerOf(page.locator(pieceOf(shape)).first())

    await touchDrag(page, from, { x: box.x + box.width / 2, y: box.y - 15 }, {
      steps: 12,
      delayMs: 20,
    })
    await page.waitForTimeout(500)
    await expect(page.locator(holeFilled(shape))).toBeVisible()
  })
})

test.describe("Encaixe de Formas — fases", () => {
  test("as 3 fases completam e chegam ao fim", async ({ page, logs }) => {
    test.setTimeout(180_000)

    for (let phase = 0; phase < 3; phase++) {
      const { pieces } = await shapesOnBoard(page)
      expect(pieces.length, `fase ${phase + 1} sem peças`).toBeGreaterThan(0)

      await test.info().attach(`fase-${phase + 1}-pecas.json`, {
        body: JSON.stringify(pieces),
        contentType: "application/json",
      })

      for (const shape of pieces) {
        await fitPiece(page, shape)
        await page.waitForTimeout(400)
      }
      await page.waitForTimeout(3600) // celebração de fase (auto-dismiss 3s)
    }

    await expect(page.getByText(/parabéns/i)).toBeVisible({ timeout: 10_000 })
    expect(logs.all(), "console sujo durante a partida completa").toEqual([])
  })

  test("a fase 3 tem um par de formas confundíveis", async ({ page }) => {
    test.setTimeout(180_000)
    const CONFUSABLE = [
      ["círculo", "oval"],
      ["quadrado", "retângulo"],
      ["triângulo", "losango"],
    ]

    for (let phase = 0; phase < 2; phase++) {
      const { pieces } = await shapesOnBoard(page)
      for (const shape of pieces) {
        await fitPiece(page, shape)
        await page.waitForTimeout(400)
      }
      await page.waitForTimeout(3600)
    }

    const { pieces } = await shapesOnBoard(page)
    const hasPair = CONFUSABLE.some(
      ([a, b]) => pieces.includes(a) && pieces.includes(b),
    )
    expect(
      hasPair,
      `fase 3 deveria ter um par confundível; veio ${JSON.stringify(pieces)}`,
    ).toBe(true)
  })

  test("na fase confundível, soltar na fronteira não encaixa no par errado", async ({
    page,
  }) => {
    test.setTimeout(180_000)
    for (let phase = 0; phase < 2; phase++) {
      const { pieces } = await shapesOnBoard(page)
      for (const shape of pieces) {
        await fitPiece(page, shape)
        await page.waitForTimeout(400)
      }
      await page.waitForTimeout(3600)
    }

    const { pieces } = await shapesOnBoard(page)
    const shape = pieces[0]
    const holes = await page.locator(HOLE).evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect()
        return {
          label: e.getAttribute("aria-label") ?? "",
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
        }
      }),
    )
    const target = holes.find((h) => h.label.includes(shape))!
    const others = holes
      .filter((h) => h.label !== target.label)
      .sort((a, b) => Math.abs(a.cx - target.cx) - Math.abs(b.cx - target.cx))
    test.skip(others.length === 0, "só há um buraco")

    // 40% do caminho até o vizinho: ainda claramente mais perto do alvo.
    const dropX = target.cx + (others[0].cx - target.cx) * 0.4
    const from = await centerOf(page.locator(pieceOf(shape)).first())
    await touchDrag(page, from, { x: dropX, y: target.cy }, { steps: 12, delayMs: 20 })
    await page.waitForTimeout(500)

    await expect(
      page.locator(holeFilled(shape)),
      `soltar a 40% do vizinho deveria encaixar em "${shape}"`,
    ).toBeVisible()
  })
})
