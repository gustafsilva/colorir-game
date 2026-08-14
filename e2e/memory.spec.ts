import { test, expect, waitForNoCelebration } from "./helpers/fixtures"
import type { Page } from "@playwright/test"
import { CARD_ANY, CARD_DOWN, CARD_UP, cardFace } from "./helpers/selectors"

/**
 * Resolve a fase virando pares.
 *
 * A única fonte de verdade sobre a face é o aria-label "Carta aberta: X",
 * e a única sobre o pareamento é o `disabled` do botão. O solver aprende
 * as faces virando cartas e depois casa os pares que já conhece.
 */
async function solvePhase(page: Page): Promise<number> {
  const cards = page.locator(CARD_ANY)
  const total = await cards.count()
  const known = new Map<string, Set<number>>()

  const matchedCount = async () =>
    cards.evaluateAll((els) => els.filter((e) => (e as HTMLButtonElement).disabled).length)

  const flip = async (i: number): Promise<string> => {
    await cards.nth(i).click({ force: true })
    await page.waitForTimeout(320)
    const label = (await cards.nth(i).getAttribute("aria-label")) ?? ""
    const face = cardFace(label)
    if (face) {
      const set = known.get(face) ?? new Set<number>()
      set.add(i)
      known.set(face, set)
    }
    return face
  }

  const isMatched = async (i: number) =>
    cards.nth(i).evaluate((e) => (e as HTMLButtonElement).disabled)

  for (let guard = 0; guard < 40 && (await matchedCount()) < total; guard++) {
    // 1) Existe par já conhecido e ainda não pareado?
    let pair: number[] | null = null
    for (const [, idxs] of known) {
      const free: number[] = []
      for (const i of idxs) if (!(await isMatched(i))) free.push(i)
      if (free.length >= 2) {
        pair = free.slice(0, 2)
        break
      }
    }

    if (pair) {
      await flip(pair[0])
      await flip(pair[1])
      await page.waitForTimeout(1100)
      continue
    }

    // 2) Vira cartas ainda DESCONHECIDAS.
    //    Pular as já conhecidas é essencial: sem isso o solver revira
    //    eternamente as mesmas duas primeiras cartas e nunca converge.
    const knownIdx = new Set<number>()
    for (const set of known.values()) for (const i of set) knownIdx.add(i)

    const closed: number[] = []
    for (let i = 0; i < total && closed.length < 2; i++) {
      if (knownIdx.has(i)) continue
      const label = (await cards.nth(i).getAttribute("aria-label")) ?? ""
      if (label === "Carta virada para baixo") closed.push(i)
    }

    // Todas conhecidas mas nenhum par livre encontrado: completa a dupla
    // com uma carta conhecida ainda em jogo, para não travar.
    if (closed.length < 2) {
      for (let i = 0; i < total && closed.length < 2; i++) {
        if (closed.includes(i)) continue
        const label = (await cards.nth(i).getAttribute("aria-label")) ?? ""
        if (label === "Carta virada para baixo") closed.push(i)
      }
    }
    if (closed.length === 0) break

    for (const i of closed) await flip(i)
    await page.waitForTimeout(1100) // lock de 900ms do par errado + folga
  }

  return matchedCount()
}

test.beforeEach(async ({ page }) => {
  await page.goto("memory")
  await expect(page.locator(CARD_DOWN).first()).toBeVisible()
  await page.waitForTimeout(700)
})

test.describe("Memória — mecânica", () => {
  test("clicar numa carta a vira", async ({ page }) => {
    const card = page.locator(CARD_DOWN).first()
    await card.click()
    await page.waitForTimeout(300)
    await expect(page.locator(CARD_UP)).toHaveCount(1)
  })

  test("clicar duas vezes na MESMA carta não conta como par", async ({ page }) => {
    const card = page.locator(CARD_ANY).first()
    await card.click()
    await page.waitForTimeout(250)
    await card.click()
    await page.waitForTimeout(600)

    // Continua aberta e sozinha — não pode ter "casado" consigo mesma.
    await expect(card).not.toBeDisabled()
    const open = await page.locator(CARD_UP).count()
    expect(open, "a mesma carta clicada 2× não pode virar um par").toBe(1)
  })

  test("rajada de toques não abre uma terceira carta", async ({ page, logs }) => {
    // O hook usa cardsRef/openRef/lockRef justamente para se defender
    // de dedinhos batendo na tela. Máximo de 2 abertas ao mesmo tempo.
    const cards = page.locator(CARD_ANY)
    const total = await cards.count()

    await Promise.all(
      Array.from({ length: Math.min(total, 4) }, (_, i) =>
        cards.nth(i).dispatchEvent("click"),
      ),
    )
    await page.waitForTimeout(150)

    // Conta só as abertas AINDA EM JOGO: uma carta já pareada continua
    // com a face à mostra (e `disabled`), e isso é correto.
    const openUnmatched = await page.locator(CARD_UP).evaluateAll(
      (els) => els.filter((e) => !(e as HTMLButtonElement).disabled).length,
    )
    expect(
      openUnmatched,
      `${openUnmatched} cartas abertas e não pareadas ao mesmo tempo — o limite é 2`,
    ).toBeLessThanOrEqual(2)
    expect(logs.all()).toEqual([])
  })

  test("tocar durante o lock do par errado não quebra o estado", async ({ page, logs }) => {
    const cards = page.locator(CARD_ANY)
    const total = await cards.count()

    // Vira duas cartas de faces DIFERENTES, para cair no lock de 900ms.
    // Só considera cartas ainda em jogo — uma já pareada fica `disabled`.
    let found = false
    for (let i = 0; i < total - 1 && !found; i++) {
      for (let j = i + 1; j < total && !found; j++) {
        const usable = await cards
          .nth(i)
          .evaluate((e) => !(e as HTMLButtonElement).disabled)
        const usableJ = await cards
          .nth(j)
          .evaluate((e) => !(e as HTMLButtonElement).disabled)
        if (!usable || !usableJ) continue

        await cards.nth(i).click({ force: true })
        await page.waitForTimeout(280)
        const faceA = cardFace((await cards.nth(i).getAttribute("aria-label")) ?? "")
        await cards.nth(j).click({ force: true })
        await page.waitForTimeout(280)
        const faceB = cardFace((await cards.nth(j).getAttribute("aria-label")) ?? "")

        if (faceA && faceB && faceA !== faceB) {
          found = true
          break
        }
        await page.waitForTimeout(1100) // era par: deixa assentar
      }
    }
    expect(found, "não foi possível formar um par errado").toBe(true)

    // Durante os 900ms de lock, martela todas as cartas.
    for (let i = 0; i < total; i++) {
      await cards.nth(i).dispatchEvent("click").catch(() => {})
    }
    await page.waitForTimeout(1300)

    const open = await page.locator(CARD_UP).evaluateAll(
      (els) => els.filter((e) => !(e as HTMLButtonElement).disabled).length,
    )
    expect(open, "sobraram cartas abertas depois do lock").toBeLessThanOrEqual(2)
    expect(logs.all()).toEqual([])
  })
})

test.describe("Memória — fases", () => {
  test("as 3 fases completam (2, 3 e 4 pares) e chegam ao fim", async ({ page, logs }) => {
    test.setTimeout(240_000)

    const counts: number[] = []
    for (let phase = 0; phase < 3; phase++) {
      // A celebração da fase anterior cobre a tela (fixed inset-0 z-[60])
      // e engole os toques nas cartas da fase nova.
      await waitForNoCelebration(page)
      const total = await page.locator(CARD_ANY).count()
      counts.push(total)
      const solved = await solvePhase(page)
      expect(solved, `fase ${phase + 1} não foi resolvida`).toBe(total)
      await page.waitForTimeout(3600)
    }

    await test.info().attach("cartas-por-fase.json", {
      body: JSON.stringify(counts),
      contentType: "application/json",
    })
    expect(counts, "as fases deveriam ter 4, 6 e 8 cartas").toEqual([4, 6, 8])
    await expect(page.getByText(/parabéns/i)).toBeVisible({ timeout: 10_000 })
    expect(logs.all()).toEqual([])
  })

  test("carta já pareada fica desabilitada e não reabre", async ({ page }) => {
    const cards = page.locator(CARD_ANY)
    const total = await cards.count()

    // Resolve a fase inteira: é a forma determinística de garantir que
    // existe pelo menos um par fechado, sem depender de acertar o timing
    // do lock de 900ms.
    const matched = await solvePhase(page)
    expect(matched, "a fase não foi resolvida").toBe(total)

    // Todas pareadas: desabilitadas e com a face à mostra.
    for (let i = 0; i < total; i++) {
      await expect(cards.nth(i), `carta ${i} deveria estar desabilitada`).toBeDisabled()
    }

    // Tocar de novo numa carta pareada não pode reabri-la nem quebrar nada.
    const labelBefore = await cards.nth(0).getAttribute("aria-label")
    await cards.nth(0).dispatchEvent("click").catch(() => {})
    await page.waitForTimeout(400)
    expect(await cards.nth(0).getAttribute("aria-label")).toBe(labelBefore)
  })
})
