import { test, expect } from "./helpers/fixtures"
import type { Page } from "@playwright/test"
import { centerOf, touchDrag } from "./helpers/drag"
import { isTopmostAt, topmostAt } from "./helpers/occlusion"
import { PUZZLE_PIECE, puzzlePieceNumber } from "./helpers/selectors"

const pieceOf = (n: string) => `[role="button"][aria-label="Peça do quebra-cabeça ${n}"]`
const slotOf = (n: string) => `[role="img"][aria-label^="Lugar da peça ${n}"]`
const slotFilled = (n: string) =>
  `[role="img"][aria-label="Lugar da peça ${n} com peça encaixada"]`

/** Números das peças na bandeja, na ordem (embaralhada) do DOM. */
async function piecesOnTray(page: Page): Promise<string[]> {
  const labels = await page
    .locator(PUZZLE_PIECE)
    .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""))
  return labels.map(puzzlePieceNumber)
}

async function fitPiece(page: Page, n: string) {
  const from = await centerOf(page.locator(pieceOf(n)).first())
  const to = await centerOf(page.locator(slotOf(n)).first())
  await touchDrag(page, from, to, { steps: 14, delayMs: 20 })
}

test.beforeEach(async ({ page }) => {
  await page.goto("puzzle")
  await expect(page.locator(PUZZLE_PIECE).first()).toBeVisible()
  await page.waitForTimeout(900)
})

test.describe("Quebra-Cabeça — mecânica", () => {
  test("a peça encaixa no seu lugar", async ({ page }) => {
    const pieces = await piecesOnTray(page)
    await fitPiece(page, pieces[0])
    await page.waitForTimeout(500)
    await expect(page.locator(slotFilled(pieces[0]))).toBeVisible()
  })

  test("a peça arrastada continua visível sobre o tabuleiro", async ({ page }) => {
    // Mesmo teste de oclusão do shape-fit: nem o tabuleiro nem a bandeja
    // criam stacking context, então a peça deveria passar por cima sempre.
    const pieces = await piecesOnTray(page)
    const n = pieces[0]
    const sel = pieceOf(n)
    const from = await centerOf(page.locator(sel).first())
    const to = await centerOf(page.locator(slotOf(n)).first())

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
    expect(occlusions, `peça "${n}" ficou coberta durante o arrasto`).toEqual([])
  })

  test("soltar longe do tabuleiro devolve a peça à bandeja", async ({ page }) => {
    const pieces = await piecesOnTray(page)
    const piece = page.locator(pieceOf(pieces[0])).first()
    const before = await piece.boundingBox()
    const from = await centerOf(piece)

    // Canto inferior esquerdo da tela: longe de qualquer lugar do tabuleiro
    await touchDrag(page, from, { x: 20, y: from.y }, { steps: 12, delayMs: 20 })
    await page.waitForTimeout(700) // RETURN_MS = 320 + folga

    const filled = await page
      .locator('[role="img"][aria-label$="com peça encaixada"]')
      .count()
    expect(filled, "nenhum lugar pode ter sido preenchido").toBe(0)
    const after = await piece.boundingBox()
    expect(Math.abs(after!.x - before!.x) + Math.abs(after!.y - before!.y)).toBeLessThan(4)
  })

  test("soltar no lugar errado devolve a peça", async ({ page }) => {
    const pieces = await piecesOnTray(page)
    const wrong = pieces.find((n) => n !== pieces[0])
    test.skip(!wrong, "fase com uma peça só")

    const piece = page.locator(pieceOf(pieces[0])).first()
    const before = await piece.boundingBox()
    const from = await centerOf(piece)
    const to = await centerOf(page.locator(slotOf(wrong!)).first())

    await touchDrag(page, from, to, { steps: 12, delayMs: 20 })
    await page.waitForTimeout(700)

    await expect(page.locator(slotFilled(wrong!))).toHaveCount(0)
    await expect(page.locator(slotFilled(pieces[0]))).toHaveCount(0)
    const after = await piece.boundingBox()
    expect(Math.abs(after!.x - before!.x) + Math.abs(after!.y - before!.y)).toBeLessThan(4)
  })

  test("mira generosa: soltar perto do lugar certo encaixa", async ({ page }) => {
    // SLOT_HIT_MARGIN = 32px absolutos; 20px acima do topo está dentro.
    // Peça 1 (canto superior do tabuleiro): acima dela não há vizinho para
    // o desempate por distância "roubar" o drop.
    const n = "1"
    const box = (await page.locator(slotOf(n)).first().boundingBox())!
    const from = await centerOf(page.locator(pieceOf(n)).first())

    await touchDrag(page, from, { x: box.x + box.width / 2, y: box.y - 20 }, {
      steps: 12,
      delayMs: 20,
    })
    await page.waitForTimeout(500)
    await expect(page.locator(slotFilled(n))).toBeVisible()
  })
})

test.describe("Quebra-Cabeça — fases", () => {
  test("as 3 fases completam (2, 4 e 6 peças) e chegam ao fim", async ({ page, logs }) => {
    test.setTimeout(180_000)

    const counts: number[] = []
    for (let phase = 0; phase < 3; phase++) {
      const pieces = await piecesOnTray(page)
      counts.push(pieces.length)

      await test.info().attach(`fase-${phase + 1}-pecas.json`, {
        body: JSON.stringify(pieces),
        contentType: "application/json",
      })

      for (const n of pieces) {
        await fitPiece(page, n)
        await page.waitForTimeout(400)
      }
      await page.waitForTimeout(3600) // celebração de fase (auto-dismiss 3s)
    }

    expect(counts, "as fases deveriam ter 2, 4 e 6 peças").toEqual([2, 4, 6])
    await expect(page.getByText(/parabéns/i)).toBeVisible({ timeout: 10_000 })
    expect(logs.all(), "console sujo durante a partida completa").toEqual([])
  })

  test("a bandeja nunca vem na ordem exata do tabuleiro", async ({ page }) => {
    // O hook re-embaralha permutações identidade — fase "já pronta" não diverte.
    const pieces = await piecesOnTray(page)
    const sorted = [...pieces].sort((a, b) => Number(a) - Number(b))
    expect(pieces, "bandeja veio na ordem 1..N").not.toEqual(sorted)
  })
})
