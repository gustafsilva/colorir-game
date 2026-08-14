import { test as base, expect } from "@playwright/test"

export interface ConsoleLog {
  /** Erros de runtime não capturados (window.onerror). */
  pageErrors: string[]
  /** console.error(...) e unhandled promise rejections reportadas pelo browser. */
  consoleErrors: string[]
  /** console.warn(...) — informativo, não falha teste. */
  warnings: string[]
  /** Todos juntos, formatados. Vazio = página limpa. */
  all(): string[]
}

/**
 * Ruído conhecido que não é bug do app — filtrado para os testes de
 * saúde de console não virarem falso positivo.
 */
const IGNORE = [
  /Download the React DevTools/i,
  /\[vite\] connect(ing|ed)/i,
  /Failed to load resource.*favicon/i,
]

function isNoise(text: string): boolean {
  return IGNORE.some((re) => re.test(text))
}

export const test = base.extend<{ logs: ConsoleLog }>({
  logs: async ({ page }, use) => {
    const pageErrors: string[] = []
    const consoleErrors: string[] = []
    const warnings: string[] = []

    page.on("pageerror", (err) => {
      const text = `${err.name}: ${err.message}`
      if (!isNoise(text)) pageErrors.push(text)
    })

    page.on("console", (msg) => {
      const text = msg.text()
      if (isNoise(text)) return
      if (msg.type() === "error") consoleErrors.push(text)
      else if (msg.type() === "warning") warnings.push(text)
    })

    const logs: ConsoleLog = {
      pageErrors,
      consoleErrors,
      warnings,
      all: () => [
        ...pageErrors.map((e) => `[pageerror] ${e}`),
        ...consoleErrors.map((e) => `[console.error] ${e}`),
      ],
    }

    await use(logs)
  },
})

export { expect }

/**
 * Espera o overlay de celebração sair de cena.
 *
 * `useCelebration` faz auto-dismiss em 3s, e o overlay é um
 * `fixed inset-0 z-[60]` que intercepta TODOS os toques enquanto está
 * visível — inclusive os do botão "Limpar tudo". Sem isso, qualquer
 * clique logo após atingir um milestone estoura o timeout.
 */
export async function waitForNoCelebration(
  page: import("@playwright/test").Page,
  timeout = 8000,
) {
  const overlay = page.locator('[role="button"][aria-label$=" — toque para continuar"]')
  if (await overlay.count()) {
    await overlay.first().click({ force: true }).catch(() => {})
  }
  await overlay.first().waitFor({ state: "detached", timeout }).catch(() => {})
  await page.waitForTimeout(200)
}

/**
 * Estado limpo: as 4 chaves de localStorage do app. Nenhum estado de jogo
 * é persistido — só flags de tutorial e o high score do caça-coelho.
 */
export async function clearStorage(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    try {
      localStorage.clear()
    } catch {
      /* modo privado */
    }
  })
}
