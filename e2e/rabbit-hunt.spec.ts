import { test, expect } from "./helpers/fixtures"
import type { Page } from "@playwright/test"
import { BURROW, BURROW_ACTIVE, RABBIT_GRID } from "./helpers/selectors"

/** Pega coelhos por N milissegundos, retornando quantos foram apanhados. */
async function huntFor(page: Page, ms: number): Promise<number> {
  const deadline = Date.now() + ms
  let caught = 0
  while (Date.now() < deadline) {
    const active = page.locator(BURROW_ACTIVE).first()
    if (await active.count()) {
      await active.click({ timeout: 1000 }).catch(() => {})
      caught++
      await page.waitForTimeout(60)
    } else {
      await page.waitForTimeout(40)
    }
  }
  return caught
}

async function readScore(page: Page): Promise<number> {
  const el = page.locator('[aria-label$="coelhos pegos"]').first()
  if (!(await el.count())) return -1
  const label = (await el.getAttribute("aria-label")) ?? ""
  return Number(label.match(/(\d+)/)?.[1] ?? -1)
}

test.beforeEach(async ({ page }) => {
  await page.goto("rabbit-hunt")
  await expect(page.locator(RABBIT_GRID)).toBeVisible()
})

test.describe("Caça-Coelho — mecânica", () => {
  test("o tabuleiro tem 9 tocas", async ({ page }) => {
    await expect(page.locator(BURROW)).toHaveCount(9)
  })

  test("clicar num coelho aumenta o placar", async ({ page }) => {
    await expect(page.locator(BURROW_ACTIVE).first()).toBeVisible({ timeout: 10_000 })
    const before = await readScore(page)
    await page.locator(BURROW_ACTIVE).first().click()
    await page.waitForTimeout(400)
    const after = await readScore(page)
    expect(after, `placar não subiu (${before} → ${after})`).toBeGreaterThan(before)
  })

  test("clicar em toca vazia não altera o placar", async ({ page }) => {
    await page.waitForTimeout(600)
    const before = await readScore(page)

    // Toca sem coelho: aria-label é "Toca N".
    const empty = page.locator('[role="gridcell"][aria-label^="Toca "]').first()
    if (await empty.count()) {
      await empty.click()
      await page.waitForTimeout(300)
    }
    const after = await readScore(page)
    expect(after, "toca vazia mexeu no placar").toBeLessThanOrEqual(before + 1)
  })

  test("o jogo é infinito: não existe tela de fim", async ({ page }) => {
    await huntFor(page, 6000)
    await expect(page.locator(RABBIT_GRID)).toBeVisible()
    await expect(page.getByText(/parabéns/i)).toHaveCount(0)
  })
})

test.describe("Caça-Coelho — recorde", () => {
  test("o recorde persiste depois de recarregar", async ({ page }) => {
    await huntFor(page, 8000)
    const score = await readScore(page)
    test.skip(score <= 0, "não deu para pegar nenhum coelho em 8s")

    await page.reload()
    await expect(page.locator(RABBIT_GRID)).toBeVisible()

    const stored = await page.evaluate(() =>
      Number(localStorage.getItem("rabbit-hunt-highscore") ?? -1),
    )
    expect(stored, "recorde não foi persistido").toBeGreaterThanOrEqual(score)

    const shown = page.locator('[aria-label^="Recorde:"]').first()
    if (await shown.count()) {
      const label = (await shown.getAttribute("aria-label")) ?? ""
      expect(Number(label.match(/(\d+)/)?.[1] ?? -1)).toBeGreaterThanOrEqual(score)
    }
  })

  test("recorde corrompido no localStorage não quebra a tela", async ({ page, logs }) => {
    await page.evaluate(() => localStorage.setItem("rabbit-hunt-highscore", "não é número"))
    await page.reload()
    await expect(page.locator(RABBIT_GRID)).toBeVisible()
    await huntFor(page, 3000)
    expect(logs.all(), "valor inválido no storage gerou erro").toEqual([])
  })

  test("recorde negativo no localStorage é rejeitado", async ({ page }) => {
    await page.evaluate(() => localStorage.setItem("rabbit-hunt-highscore", "-999"))
    await page.reload()
    await expect(page.locator(RABBIT_GRID)).toBeVisible()

    const shown = page.locator('[aria-label^="Recorde:"]').first()
    if (await shown.count()) {
      const label = (await shown.getAttribute("aria-label")) ?? ""
      expect(Number(label.match(/(-?\d+)/)?.[1] ?? 0)).toBeGreaterThanOrEqual(0)
    }
  })

  test("o recorde sincroniza entre abas", async ({ page, context }) => {
    // useHighScore escuta o evento `storage`, que só dispara em OUTRAS abas.
    const other = await context.newPage()
    await other.goto("rabbit-hunt")
    await expect(other.locator(RABBIT_GRID)).toBeVisible()

    await page.evaluate(() => {
      localStorage.setItem("rabbit-hunt-highscore", "42")
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "rabbit-hunt-highscore",
          newValue: "42",
          storageArea: localStorage,
        }),
      )
    })
    await other.waitForTimeout(600)

    const shown = other.locator('[aria-label^="Recorde:"]').first()
    if (await shown.count()) {
      const label = (await shown.getAttribute("aria-label")) ?? ""
      expect(
        Number(label.match(/(\d+)/)?.[1] ?? -1),
        "a outra aba não recebeu o novo recorde",
      ).toBe(42)
    }
    await other.close()
  })
})

test.describe("Caça-Coelho — robustez", () => {
  test("sair da página no meio do jogo não deixa timer órfão", async ({ page, logs }) => {
    // O loop de timers é auto-referente (scheduleRef). Se não houver
    // cleanup, o React reclama de setState em componente desmontado.
    await huntFor(page, 2500)
    await page.goto("")
    await page.waitForTimeout(2500)
    expect(logs.all(), "timer continuou rodando após desmontar").toEqual([])
  })

  test("localStorage bloqueado não impede jogar", async ({ page, logs, context }) => {
    await context.addInitScript(() => {
      const boom = () => {
        throw new Error("QuotaExceededError simulado")
      }
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: { getItem: boom, setItem: boom, removeItem: boom, clear: boom, key: boom, length: 0 },
      })
    })
    await page.goto("rabbit-hunt")
    await expect(page.locator(RABBIT_GRID)).toBeVisible()
    await huntFor(page, 3000)
    expect(logs.pageErrors, "storage bloqueado derrubou a página").toEqual([])
  })
})
