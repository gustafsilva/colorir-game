import { test, expect } from "./helpers/fixtures"
import type { Page } from "@playwright/test"
import { centerOf, touchDrag, type Point } from "./helpers/drag"
import { isTopmostAt, stackingChain, topmostAt } from "./helpers/occlusion"
import {
  BALLOON,
  DUCK,
  DUCK_ACTIVE,
  NEST,
  duckColor,
} from "./helpers/selectors"

const nestOfColor = (color: string) => `[role="img"][aria-label^="Ninho ${color}"]`

async function firstDuck(page: Page) {
  const duck = page.locator(DUCK_ACTIVE).first()
  await expect(duck).toBeVisible()
  const label = (await duck.getAttribute("aria-label")) ?? ""
  return { duck, color: duckColor(label), label }
}

/** Arrasta um patinho até o ninho da mesma cor. */
async function dropDuckInNest(page: Page, color: string, opts = {}) {
  const duck = page.locator(`[role="button"][aria-label="Patinho ${color}"]`).first()
  const nest = page.locator(nestOfColor(color)).first()
  const from = await centerOf(duck)
  const to = await centerOf(nest)
  await touchDrag(page, from, to, { steps: 14, delayMs: 20, ...opts })
}

test.beforeEach(async ({ page }) => {
  await page.goto("duck-nest")
  await expect(page.locator(DUCK).first()).toBeVisible()
  // As animações de chegada (duck-arrive, escalonadas em 250ms) precisam
  // terminar antes de medir posições.
  await page.waitForTimeout(1200)
})

test.describe("Patinhos no Ninho — visibilidade durante o arrasto", () => {
  test("o patinho arrastado continua visível ao passar sobre a grama", async ({ page }) => {
    const { color, label } = await firstDuck(page)
    const duckSel = `[role="button"][aria-label="Patinho ${color}"]`
    const nest = page.locator(nestOfColor(color)).first()

    const from = await centerOf(page.locator(duckSel).first())
    const to = await centerOf(nest)
    const nestBox = (await nest.boundingBox())!

    const occlusions: Array<{
      step: number
      point: Point
      topo: string
      dentroDaGrama: boolean
    }> = []
    let shotTaken = false

    await touchDrag(page, from, to, {
      steps: 18,
      delayMs: 25,
      onMove: async (p, step) => {
        const visible = await isTopmostAt(page, p.x, p.y, duckSel)
        if (visible) return

        const top = await topmostAt(page, p.x, p.y)
        occlusions.push({
          step,
          point: { x: Math.round(p.x), y: Math.round(p.y) },
          topo: top ? `${top.ariaLabel ?? top.tag} — ${top.chain}` : "(nada)",
          // A faixa de grama começa um pouco acima do topo do ninho.
          dentroDaGrama: p.y >= nestBox.y - 40,
        })

        // Evidência no exato instante em que o patinho some.
        if (!shotTaken) {
          shotTaken = true
          await test.info().attach(`oclusao-passo-${step}.png`, {
            body: await page.screenshot(),
            contentType: "image/png",
          })
        }
      },
    })

    if (occlusions.length > 0) {
      await test.info().attach("oclusoes.json", {
        body: JSON.stringify(occlusions, null, 2),
        contentType: "application/json",
      })
      await test.info().attach("cadeia-de-empilhamento.json", {
        body: JSON.stringify(await stackingChain(page, duckSel), null, 2),
        contentType: "application/json",
      })
    }

    expect(
      occlusions,
      `${label} ficou coberto em ${occlusions.length} de 18 pontos do trajeto — ` +
        `a criança perde o patinho de vista bem na hora de mirar no ninho`,
    ).toEqual([])
  })

  test("diagnóstico: quem cria stacking context entre o patinho e a raiz", async ({
    page,
  }) => {
    const { color } = await firstDuck(page)
    const duckSel = `[role="button"][aria-label="Patinho ${color}"]`
    const chain = await stackingChain(page, duckSel)
    await test.info().attach("cadeia-patinho.json", {
      body: JSON.stringify(chain, null, 2),
      contentType: "application/json",
    })
    expect(chain.length).toBeGreaterThan(0)
  })
})

test.describe("Patinhos no Ninho — mecânica", () => {
  test("soltar o patinho no ninho da cor certa o assenta lá", async ({ page }) => {
    const { color } = await firstDuck(page)
    await dropDuckInNest(page, color)
    await page.waitForTimeout(500)

    await expect(
      page.locator(`[role="img"][aria-label="Ninho ${color} com patinho"]`),
    ).toBeVisible()
  })

  test("soltar no ninho da cor errada devolve o patinho ao lago", async ({ page }) => {
    const labels = await page.locator(DUCK_ACTIVE).evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label") ?? ""),
    )
    const nestLabels = await page.locator(NEST).evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label") ?? ""),
    )

    const duckCol = duckColor(labels[0])
    const wrongNest = nestLabels
      .map((l) => l.replace(/^Ninho\s+/, "").replace(/\s+com patinho$/, ""))
      .find((c) => c !== duckCol)

    expect(wrongNest, "precisa existir um ninho de outra cor").toBeTruthy()

    const duck = page.locator(`[role="button"][aria-label="${labels[0]}"]`).first()
    const from = await centerOf(duck)
    const to = await centerOf(page.locator(nestOfColor(wrongNest!)).first())

    await touchDrag(page, from, to, { steps: 12, delayMs: 20 })
    await page.waitForTimeout(600) // RETURN_MS = 320 + folga

    // O ninho errado continua vazio e o patinho voltou (segue arrastável).
    await expect(
      page.locator(`[role="img"][aria-label="Ninho ${wrongNest} com patinho"]`),
    ).toHaveCount(0)
    await expect(duck).not.toHaveAttribute("aria-disabled", "true")
  })

  test("o patinho volta para a posição original depois de um erro", async ({ page }) => {
    const { duck, color } = await firstDuck(page)
    const before = await duck.boundingBox()

    const nestLabels = await page.locator(NEST).evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label") ?? ""),
    )
    const wrong = nestLabels
      .map((l) => l.replace(/^Ninho\s+/, ""))
      .find((c) => c !== color)!

    const from = await centerOf(duck)
    const to = await centerOf(page.locator(nestOfColor(wrong)).first())
    await touchDrag(page, from, to, { steps: 12, delayMs: 20 })
    await page.waitForTimeout(700)

    const after = await duck.boundingBox()
    expect(Math.abs(after!.x - before!.x), "patinho não voltou em X").toBeLessThan(4)
    expect(Math.abs(after!.y - before!.y), "patinho não voltou em Y").toBeLessThan(4)
  })

  test("mira generosa: soltar perto do ninho certo (sem acertar em cheio) funciona", async ({
    page,
  }) => {
    // NEST_HIT_MARGIN = 32px absolutos. Uma criança de 2 anos não acerta o centro.
    const { color } = await firstDuck(page)
    const duck = page.locator(`[role="button"][aria-label="Patinho ${color}"]`).first()
    const nest = page.locator(nestOfColor(color)).first()
    const box = (await nest.boundingBox())!
    const from = await centerOf(duck)

    // 20px acima do topo do ninho — dentro da margem de tolerância.
    await touchDrag(page, from, { x: box.x + box.width / 2, y: box.y - 20 }, {
      steps: 12,
      delayMs: 20,
    })
    await page.waitForTimeout(500)

    await expect(
      page.locator(`[role="img"][aria-label="Ninho ${color} com patinho"]`),
    ).toBeVisible()
  })

  test("soltar entre dois ninhos escolhe o mais próximo, não um aleatório", async ({
    page,
  }) => {
    // As margens de 32px de ninhos adjacentes se sobrepõem em tela estreita.
    // O desempate é por centro mais próximo — este teste prova que funciona.
    const { color } = await firstDuck(page)
    const nests = await page.locator(NEST).evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect()
        return {
          label: e.getAttribute("aria-label") ?? "",
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          right: r.right,
          left: r.left,
        }
      }),
    )
    const target = nests.find((n) => n.label.startsWith(`Ninho ${color}`))!
    const neighbours = nests
      .filter((n) => n.label !== target.label)
      .sort((a, b) => Math.abs(a.cx - target.cx) - Math.abs(b.cx - target.cx))
    const neighbour = neighbours[0]

    // Ponto deslocado do centro do alvo em direção ao vizinho, mas ainda
    // claramente mais perto do alvo (35% do caminho).
    const dropX = target.cx + (neighbour.cx - target.cx) * 0.35
    const duck = page.locator(`[role="button"][aria-label="Patinho ${color}"]`).first()
    const from = await centerOf(duck)

    await touchDrag(page, from, { x: dropX, y: target.cy }, { steps: 12, delayMs: 20 })
    await page.waitForTimeout(500)

    await expect(
      page.locator(`[role="img"][aria-label="Ninho ${color} com patinho"]`),
      `soltar a 35% do caminho até o vizinho deveria contar para ${color}`,
    ).toBeVisible()
  })
})

test.describe("Patinhos no Ninho — progressão de fases", () => {
  test("completar as 3 fases leva ao modo balões e depois ao fim", async ({ page, logs }) => {
    test.setTimeout(180_000)

    for (let phase = 0; phase < 3; phase++) {
      const labels = await page.locator(DUCK_ACTIVE).evaluateAll((els) =>
        els.map((e) => e.getAttribute("aria-label") ?? ""),
      )
      expect(labels.length, `fase ${phase + 1} deveria ter 3 patinhos`).toBe(3)

      for (const label of labels) {
        await dropDuckInNest(page, duckColor(label))
        await page.waitForTimeout(400)
      }

      // Celebração de fase: auto-dismiss em 3s (advancePhase é idempotente).
      await page.waitForTimeout(3600)
    }

    // Depois da 3ª fase entra o bônus dos balões (60s).
    await expect(page.getByText("Estoure os balões!")).toBeVisible({ timeout: 10_000 })
    await expect(page.locator(BALLOON).first()).toBeVisible()

    expect(logs.all(), "console sujo durante a partida completa").toEqual([])
  })

  test("o lago não deixa buracos conforme os patinhos assentam", async ({ page }) => {
    // duck.dropped aplica `opacity-0 pointer-events-none`, mas o elemento
    // CONTINUA ocupando sua célula do grid. Verifica se o resultado visual
    // é aceitável (patinhos restantes não "pulam" de posição).
    const before = await page.locator(DUCK).evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect()
        return { label: e.getAttribute("aria-label"), x: Math.round(r.x), y: Math.round(r.y) }
      }),
    )

    const { color } = await firstDuck(page)
    await dropDuckInNest(page, color)
    await page.waitForTimeout(600)

    const after = await page.locator(DUCK).evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect()
        return { label: e.getAttribute("aria-label"), x: Math.round(r.x), y: Math.round(r.y) }
      }),
    )

    for (const b of before) {
      if (b.label === `Patinho ${color}`) continue
      const a = after.find((x) => x.label === b.label)
      expect(a, `${b.label} sumiu do DOM`).toBeTruthy()
      expect(
        Math.abs(a!.x - b.x) + Math.abs(a!.y - b.y),
        `${b.label} mudou de lugar quando outro patinho foi assentado`,
      ).toBeLessThan(4)
    }
  })
})

test.describe("Patinhos no Ninho — robustez", () => {
  test("sair da página no meio de um arrasto não gera erro", async ({ page, logs }) => {
    const { color } = await firstDuck(page)
    const duck = page.locator(`[role="button"][aria-label="Patinho ${color}"]`).first()
    const from = await centerOf(duck)

    // Começa o gesto e navega para fora ANTES do pointerup.
    // NestSlot registra `() => ref.current!.getBoundingClientRect()` com
    // non-null assertion — ler isso durante o desmonte seria TypeError.
    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: Math.round(from.x), y: Math.round(from.y), id: 1 }],
    })
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: Math.round(from.x), y: Math.round(from.y + 60), id: 1 }],
    })
    await cdp.detach().catch(() => {})

    await page.goto("")
    await page.waitForTimeout(600)

    expect(logs.all(), "erro ao desmontar durante arrasto").toEqual([])
  })
})
