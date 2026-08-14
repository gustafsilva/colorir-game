import { test, expect, waitForNoCelebration } from "./helpers/fixtures"
import type { Page } from "@playwright/test"
import { BUBBLE, BUBBLE_COUNTER, BUBBLE_TARGET } from "./helpers/selectors"

/** Plural do banner ("Estoure as bolhas azuis") → singular do aria-label
 * da bolha ("Bolha azul"). Laranja e rosa são invariáveis. */
const SINGULAR: Record<string, string> = {
  vermelhas: "vermelha",
  azuis: "azul",
  amarelas: "amarela",
  verdes: "verde",
  roxas: "roxa",
  laranja: "laranja",
  rosa: "rosa",
}

/** Lê "N de M bolhas estouradas" → [N, M]. [NaN, NaN] se o contador não
 * está em cena (tela de Parabéns) — quem chama decide o que fazer. */
async function readCounter(page: Page): Promise<[number, number]> {
  const label = await page
    .locator(BUBBLE_COUNTER)
    .getAttribute("aria-label", { timeout: 2000 })
    .catch(() => null)
  const match = label?.match(/(\d+)\s+de\s+(\d+)/)
  return match ? [Number(match[1]), Number(match[2])] : [NaN, NaN]
}

/** Cor-alvo (singular) lida do banner da fase. */
async function readTarget(page: Page): Promise<string> {
  const label = (await page.locator(BUBBLE_TARGET).getAttribute("aria-label")) ?? ""
  const plural = label.replace(/^Estoure as bolhas\s+/, "").trim()
  return SINGULAR[plural] ?? plural
}

/**
 * Toca a primeira bolha visível do seletor pelo CENTRO do boundingBox via
 * touchscreen.tap. `locator.tap()` normal reprovaria o actionability check
 * de estabilidade (a bolha anima o tempo todo); como ela sobe ~0,1px/ms
 * contra um alvo de ≥72px, o box lido é mira suficiente.
 */
async function tapFirstVisible(page: Page, selector: string): Promise<boolean> {
  const viewport = page.viewportSize()!
  const centers = await page.locator(selector).evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      // Só vale se ESTA bolha é o elemento no ponto — bolhas se sobrepõem
      // e tocar a coordenada de uma escondida estouraria a da frente.
      const topmost = e.contains(document.elementFromPoint(cx, cy))
      return { x: cx, y: cy, topmost }
    }),
  )
  // Fora da faixa do topo (botões/banner) e dentro do viewport
  const candidate = centers.find(
    (c) =>
      c.topmost &&
      c.y > 140 &&
      c.y < viewport.height - 20 &&
      c.x > 10 &&
      c.x < viewport.width - 10,
  )
  if (!candidate) return false
  await page.touchscreen.tap(candidate.x, candidate.y)
  return true
}

/** Estoura bolhas (da cor, se dada) até o contador chegar a `goal`. */
async function popUntil(page: Page, goal: number, color: string | null, deadlineMs = 120_000) {
  const start = Date.now()
  const selector = color ? `button[aria-label="Bolha ${color}"]` : BUBBLE
  while (Date.now() - start < deadlineMs) {
    const [count] = await readCounter(page)
    if (Number.isNaN(count)) return // contador saiu de cena (fim de jogo)
    if (count >= goal) return
    const tapped = await tapFirstVisible(page, selector)
    await page.waitForTimeout(tapped ? 150 : 300)
  }
  const [count] = await readCounter(page)
  throw new Error(`só ${count}/${goal} bolhas estouradas dentro do prazo`)
}

test.beforeEach(async ({ page }) => {
  await page.goto("bubble-pop")
  await expect(page.locator(BUBBLE_COUNTER)).toBeVisible()
  await page.waitForTimeout(600)
})

test.describe("Estoura Bolhas — mecânica", () => {
  test("contador começa em 0 e a meta da fase 1 é 8", async ({ page }) => {
    expect(await readCounter(page)).toEqual([0, 8])
    // Fase 1 é livre: sem banner de cor-alvo
    await expect(page.locator(BUBBLE_TARGET)).toHaveCount(0)
  })

  test("tocar uma bolha estoura e incrementa o contador", async ({ page, logs }) => {
    // Espera uma bolha entrar na área tocável
    let tapped = false
    for (let i = 0; i < 40 && !tapped; i++) {
      tapped = await tapFirstVisible(page, BUBBLE)
      if (!tapped) await page.waitForTimeout(300)
    }
    expect(tapped, "nenhuma bolha entrou na área visível").toBe(true)

    await expect(page.locator(BUBBLE_COUNTER)).toHaveAttribute(
      "aria-label",
      /^[1-9]\d* de 8/,
      { timeout: 3000 },
    )
    expect(logs.all()).toEqual([])
  })

  test("bolha que chega ao topo some sem penalidade", async ({ page, logs }) => {
    test.setTimeout(60_000)
    // Não toca em nada por um ciclo inteiro de subida (9,5s + jitter 1,5s)
    await page.waitForTimeout(13_000)

    expect(await readCounter(page), "escapar não pode contar nem punir").toEqual([0, 8])
    // O spawn contínuo repõe: sempre há bolhas em cena
    await expect(page.locator(BUBBLE).first()).toBeVisible()
    expect(logs.all()).toEqual([])
  })
})

test.describe("Estoura Bolhas — fases", () => {
  test("as 3 fases completam, com cor-alvo anunciada nas fases 2 e 3", async ({
    page,
    logs,
  }) => {
    test.setTimeout(420_000)

    // Fase 1: livre, 8 bolhas
    expect(await readCounter(page)).toEqual([0, 8])
    await popUntil(page, 8, null)
    await page.waitForTimeout(3600) // celebração auto-dismiss
    await waitForNoCelebration(page)

    // Fases 2 e 3: banner com a cor-alvo
    const goals: number[] = [8]
    for (let phase = 1; phase < 3; phase++) {
      await expect(page.locator(BUBBLE_TARGET)).toBeVisible({ timeout: 5000 })
      const target = await readTarget(page)
      const [, goal] = await readCounter(page)
      goals.push(goal)

      await test.info().attach(`fase-${phase + 1}.json`, {
        body: JSON.stringify({ target, goal }),
        contentType: "application/json",
      })

      // Cor errada não conta: se uma distratora aparecer, toca nela
      const before = (await readCounter(page))[0]
      let wrongTapped = false
      const deadline = Date.now() + 10_000
      while (!wrongTapped && Date.now() < deadline) {
        const labels = await page
          .locator(BUBBLE)
          .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""))
        const wrong = labels.find((l) => l && l !== `Bolha ${target}`)
        if (wrong) {
          wrongTapped = await tapFirstVisible(page, `button[aria-label="${wrong}"]`)
        }
        if (!wrongTapped) await page.waitForTimeout(300)
      }
      if (wrongTapped) {
        await page.waitForTimeout(500)
        expect(
          (await readCounter(page))[0],
          "bolha de cor errada não pode contar",
        ).toBe(before)
      }

      await popUntil(page, goal, target)
      await page.waitForTimeout(3600)
      await waitForNoCelebration(page)
    }

    expect(goals, "as fases deveriam pedir 8, 5 e 6 bolhas").toEqual([8, 5, 6])
    await expect(page.getByText(/parabéns/i)).toBeVisible({ timeout: 10_000 })
    expect(logs.all()).toEqual([])
  })
})

test.describe("Estoura Bolhas — robustez", () => {
  test("aba em background limpa o campo e volta sem quebrar", async ({ page, logs }) => {
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true })
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await page.waitForTimeout(400)
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: false, configurable: true })
      document.dispatchEvent(new Event("visibilitychange"))
    })

    // O jogo continua: contador visível e o spawn repõe bolhas
    await expect(page.locator(BUBBLE_COUNTER)).toBeVisible()
    await expect(page.locator(BUBBLE).first()).toBeVisible({ timeout: 5000 })
    expect(logs.all()).toEqual([])
  })

  test("sair no meio do jogo não deixa timer órfão", async ({ page, logs }) => {
    await tapFirstVisible(page, BUBBLE)
    await page.goto("")
    await page.waitForTimeout(2000)
    expect(logs.all()).toEqual([])
  })
})
