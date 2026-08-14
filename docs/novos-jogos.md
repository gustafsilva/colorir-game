# Novos jogos — plano e acompanhamento

> **Propósito deste doc:** registrar o plano dos 3 novos mini-jogos e o ponto exato onde o trabalho parou, para qualquer sessão futura (humana ou de agente) retomar sem re-investigar. Atualizar a seção **"Onde parei / próximo passo"** ao final de cada etapa.

## Visão geral

Após pesquisa de mecânicas adequadas a crianças de 2–5 anos (sem fail state, tap/drag, feedback imediato, causa-e-efeito), foram escolhidos 3 jogos para ampliar o catálogo. Cada um vive em **branch própria a partir da `main`**, com ciclo completo: desenvolvimento → lint/build → testes E2E → commits.

| Jogo | Branch | Rota | Conceito |
|---|---|---|---|
| Minhoca Comilona | `feat/worm-game` | `/worm` | Cobrinha adaptada: toca na fruta, a minhoca anda até ela e cresce. Sem morte. 3 fases (4/6/8 frutas). |
| Quebra-cabeça | `feat/puzzle-game` | `/puzzle` | Desenhos do catálogo cortados em 2/4/6 peças grandes de drag & drop com snap generoso. |
| Estoura Bolhas | `feat/bubble-pop-game` | `/bubble-pop` | Bolhas coloridas sobem, toque estoura. Fases 2–3 com cor-alvo (áudio da cor via useSpeech). |

## Status

| Etapa | Minhoca | Quebra-cabeça | Bolhas |
|---|---|---|---|
| Design | ✅ | ✅ | ✅ |
| Branch criada | ✅ | ✅ | ✅ |
| Implementação | ✅ | ✅ | ✅ |
| Lint + build | ✅ | ✅ | ✅ |
| Spec E2E escrito | ✅ | ✅ | ✅ |
| E2E rodando verde | ✅ | ✅ | ✅ |
| Commits + push | ✅ | ✅ | ✅ |

## Onde parei / próximo passo

- **Última atualização:** 2026-08-14
- **Feito:**
  - Pesquisa de mecânicas + design detalhado dos 3 jogos (decisões resumidas abaixo).
  - **Minhoca Comilona pronta** na branch `feat/worm-game` (pushed): 3 commits (`playChomp` no useSoundEffects → jogo completo → suíte E2E). `e2e/minhoca.spec.ts` com 5 testes verdes + smoke/navigation/console-health verdes em todos os projects (158 passed). Verificação visual ok (tabuleiro, hub card).
  - **Quebra-cabeça pronto** na branch `feat/puzzle-game` (pushed): 5 commits (dados+PuzzleArt → hook → página+drag → rota+hub → E2E). `e2e/puzzle.spec.ts` com 7 testes verdes + transversais (162 passed em todos os projects). Nota de teste: "mira generosa" precisa mirar a peça 1 (canto superior) — soltar acima de um lugar com vizinho em cima perde no desempate por distância, o que é o comportamento correto do jogo.
  - **Estoura Bolhas pronto** na branch `feat/bubble-pop-game` (pushed): 5 commits (hook → componentes+css → fix do overlay → página+rota+hub → E2E). **A suíte E2E expôs um bug real no `CelebrationOverlay` compartilhado**: quando a ação que completa a fase acontece no pointerdown (última bolha), o overlay monta entre o down e o up e o click do mesmo toque o dispensava na hora — corrigido com carência de 350ms pós-montagem (commit `fix:` na branch do bubble-pop). Suíte E2E COMPLETA rodada na branch: **410 passed, 0 failed, 29 skipped** (7,4 min).
- **Merge concluído (2026-08-14):** as 4 branches foram mescladas na `main` na ordem worm → puzzle → bubble-pop → docs, com os `index` dos HubCards ajustados para 7/8/9 e os conflitos aditivos resolvidos em router/HomePage/index.css/selectors. Validação pós-merge: lint + build OK; specs novos + smoke/navigation verdes no project mobile (72 passed). O catálogo agora tem **10 jogos**.
- **Próximo passo:** nenhum — leva concluída. Ideias restantes da pesquisa (não implementadas): ligar pontos/traçado, encaixe de formas avançado, cena de adesivos (sticker scene), piano de bichos.

## Decisões técnicas (resumo por jogo)

### Minhoca Comilona
- Grid 6×8; minhoca inicial de 3 células; fruta é `<button>` do tamanho da célula (reusa `FruitSVG` do fruit-slice; posição aleatória fora do corpo, distância ≥2 da cabeça; kind cicla deterministicamente).
- Toque na fruta → `setInterval(step, 260ms)` com pathfinding Manhattan (eixo de maior |delta|); sem obstáculos nem morte; ao comer não faz pop do rabo (cresce), som novo `playChomp` em `useSoundEffects`, minhoca para e espera novo toque.
- Andar é 100% CSS: segmentos como divs absolutos com `translate(x*100%, y*100%)` + `transition 260ms linear`; reduced-motion → sem transition (teleporta). Renderizar rabo→cabeça; keys contadas a partir do rabo.
- Comprimento persiste entre fases (recompensa visível; 21 segmentos ao final).
- Hook `useWormGame` no padrão StrictMode de `useMemoryGame` (lógica em handlers/refs, nunca em setState updaters); página espelha `MemoryGamePage`.
- E2E `e2e/minhoca.spec.ts` sem seed (fruta sempre é um button com aria-label).

### Quebra-cabeça
- **Corte por crop de `viewBox`** (todos os SVGs são `0 0 400 400`, sem `<defs>`/`url(#)`): renderizar o SVG inteiro com `viewBox` do retângulo da peça — sem clipPath, sem conflito de ids (ids são removidos após aplicar fills).
- Fases: `apple` 2 peças (1×2), `fish` 4 (2×2), `butterfly` 6 (2×3); fills curados por região em `src/data/puzzles.ts` (paleta crayon) — peças coloridas, não line art branco.
- `PuzzleArt` usa ref+innerHTML (padrão `ColoringSVG`, exigência do CLAUDE.md); silhueta guia = mesma arte com `opacity-25 grayscale`.
- Drag copiado de `ShapeDraggable` (`setPointerCapture`, `touch-none`, `translate3d` via ref); hit-test na página com margem de 32px e desempate por distância ao centro; peça errada volta com cubic-bezier 320ms; encaixada fica `opacity-0` mantendo lugar na bandeja.
- E2E `e2e/puzzle.spec.ts` no padrão de `shape-fit.spec.ts` (touchDrag CDP, labels numerados lidos do DOM).

### Estoura Bolhas
- Generaliza o padrão do `BalloonField` (bônus do Duck Nest): subida por CSS keyframe `translateY` (hit-area acompanha transform; compositor), estouro no `onPointerDown` (nunca onClick), despawn por `onAnimationEnd`.
- Subida no `<button>`, wobble/pop num `<div>` interno (transforms não podem competir — lição do FruitField).
- 7 cores crayon (sem white); máx. 6 bolhas; `PHASE_CONFIGS` com `targetBias 0.45` nas fases de cor-alvo; cor errada = wobble suave, sem punição; bolha que escapa no topo não penaliza.
- Cor-alvo anunciada por banner com bolha-exemplo + `useSpeech.speak(cor)` (MP3s em inglês, decisão educativa existente); banner é button que repete o áudio.
- Reduced-motion: subida continua (é mecânica), sem drift e 1,6× mais lenta (`bubble-rise-calm`) — precedente do balloon-rise.
- E2E `e2e/bubble-pop.spec.ts`: tap por coordenada (`boundingBox` + `touchscreen.tap`) porque `locator.tap()` reprova estabilidade em elemento animando.

## Integração (padrão canônico, igual aos 7 jogos existentes)

Cada jogo: `src/pages/<X>Page.tsx` + `src/hooks/use<X>.ts` + componentes em `src/components/game/` + edições em `src/router.tsx`, `src/pages/HomePage.tsx` (HubCard), `src/index.css` (keyframes), `e2e/helpers/selectors.ts` (constantes + ROUTES) + novo spec E2E. Botão voltar com aria-label exato "Voltar para o início"; zero `data-testid`; touch targets ≥44px; máquina `mode: "playing"|"phaseComplete"|"finished"`.

## Merge (quando for a hora)

- As 3 branches tocam `router.tsx`, `HomePage.tsx`, `index.css` e `selectors.ts` — conflitos triviais de linhas adicionadas.
- **Atenção:** as 3 usam `index={7}` no `<HubCard>` (correto isoladamente). Ao mesclar a 2ª e a 3ª, ajustar para 8 e 9.
- Verificação por PR: CI roda lint + build. E2E é local (`pnpm test:e2e`) por decisão registrada em `docs/bugs.md`.
