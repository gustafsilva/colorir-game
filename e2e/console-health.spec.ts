import { test, expect } from "./helpers/fixtures"
import { ROUTES } from "./helpers/selectors"

/**
 * Saúde do console.
 *
 * Alvo principal: `useSoundEffects.ts` faz `new AudioContext()` FORA do
 * try/catch. O `resume()` está protegido, mas o construtor não. Como todos
 * os `play*` são async, uma exceção ali vira unhandled promise rejection.
 * Navegadores limitam o número de AudioContexts por página (~6 no Chromium),
 * então navegar repetidamente entre jogos é a forma de provocar.
 *
 * Este spec também roda no project `mobile-reduced-motion`: com
 * reduced-motion ativo, 7 dos 10 sons abortam ANTES de criar o context,
 * então o caminho de código é diferente e a comparação é informativa.
 */

test.describe("saúde do console", () => {
  for (const route of ROUTES) {
    test(`${route.name}: carrega sem erro de console`, async ({ page, logs }) => {
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(1500)

      if (logs.warnings.length) {
        await test.info().attach("avisos.json", {
          body: JSON.stringify(logs.warnings, null, 2),
          contentType: "application/json",
        })
      }
      expect(logs.all()).toEqual([])
    })

    test(`${route.name}: interagir não gera erro`, async ({ page, logs }) => {
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(600)

      // Toques genéricos pela tela — é o que uma criança faz.
      const { width, height } = page.viewportSize()!
      for (const [fx, fy] of [
        [0.5, 0.4],
        [0.3, 0.6],
        [0.7, 0.6],
        [0.5, 0.75],
      ]) {
        await page.touchscreen.tap(width * fx, height * fy)
        await page.waitForTimeout(250)
      }
      await page.waitForTimeout(800)

      expect(logs.all()).toEqual([])
    })
  }

  test("navegar muitas vezes entre jogos não estoura o limite de AudioContext", async ({
    page,
    logs,
  }) => {
    test.setTimeout(180_000)
    const games = ROUTES.filter((r) => r.path !== "")

    // 3 voltas por todos os jogos, tocando em cada um para forçar a
    // criação de um AudioContext por visita.
    for (let round = 0; round < 3; round++) {
      for (const route of games) {
        await page.goto(route.path)
        await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 15_000 })
        const { width, height } = page.viewportSize()!
        await page.touchscreen.tap(width * 0.5, height * 0.5)
        await page.waitForTimeout(200)
      }
    }

    const contexts = await page.evaluate(() => {
      // Sonda: quantos AudioContexts ainda dá para criar antes de falhar.
      const made: AudioContext[] = []
      try {
        for (let i = 0; i < 10; i++) made.push(new AudioContext())
      } catch (e) {
        return { criados: made.length, erro: String(e) }
      } finally {
        made.forEach((c) => c.close().catch(() => {}))
      }
      return { criados: made.length, erro: null }
    })

    await test.info().attach("sonda-audiocontext.json", {
      body: JSON.stringify(contexts, null, 2),
      contentType: "application/json",
    })

    expect(logs.all(), "erro após navegação repetida entre jogos").toEqual([])
  })

  test("o construtor de AudioContext está protegido contra exceção", async ({
    page,
    logs,
  }) => {
    // Sabota o construtor ANTES do app carregar e confirma se um erro ali
    // é tratado ou escapa como unhandled rejection.
    await page.addInitScript(() => {
      const Original = window.AudioContext
      let calls = 0
      // @ts-expect-error — sabotagem deliberada para o teste
      window.AudioContext = function (...args: unknown[]) {
        calls++
        if (calls > 0) throw new Error("AudioContext indisponível (simulado)")
        // @ts-expect-error — repasse
        return new Original(...args)
      }
    })

    await page.goto("memory")
    await expect(page.locator("button[aria-label^='Carta ']").first()).toBeVisible({
      timeout: 15_000,
    })

    const { width, height } = page.viewportSize()!
    for (let i = 0; i < 4; i++) {
      await page.touchscreen.tap(width * 0.4, height * (0.4 + i * 0.05))
      await page.waitForTimeout(300)
    }
    await page.waitForTimeout(1200)

    await test.info().attach("erros-com-audio-sabotado.json", {
      body: JSON.stringify(logs.all(), null, 2),
      contentType: "application/json",
    })

    expect(
      logs.all(),
      "falha ao criar AudioContext escapou — `new AudioContext()` está fora do try/catch em useSoundEffects.ts",
    ).toEqual([])
  })
})
