import { test, expect } from "./helpers/fixtures"
import { ROUTES } from "./helpers/selectors"

/**
 * Smoke: prova que a suíte consegue dirigir o app.
 *
 * Falha aqui = problema de infraestrutura de teste (baseURL, seletor
 * inexistente), NÃO bug do app. Todo o resto depende disto passar.
 */
test.describe("smoke — a suíte consegue abrir e reconhecer cada tela", () => {
  for (const route of ROUTES) {
    test(`${route.name} carrega e expõe seu seletor-âncora`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 15_000 })
    })
  }
})
