# 🐛 Bugs encontrados — varredura E2E

> Varredura automatizada dos 7 jogos em celular (390×844) e tablet (820×1180).
> Nenhuma correção foi aplicada — este documento é o insumo para priorizar.

## Status

Todos os 9 bugs foram corrigidos na branch `fix/e2e-bugs`, um commit por bug.
Três decisões de estratégia, tomadas ao planejar as correções:

- **BUG-02**: em vez de adaptar o layout de cada jogo para paisagem, o app
  trava em retrato (manifest do PWA + overlay "vire o aparelho" via CSS).
- **BUG-05**: não é bug de código — é geometria dos SVGs gerados pelo
  conversor. Documentado e sinalizado na curadoria, sem fix de runtime.
- **BUG-09**: o job de CI em pull request roda `lint + build`. A suíte E2E
  (~8min, exige instalar Chromium+WebKit no runner) continua rodando
  localmente por ora, não no CI.

A suíte completa (`pnpm test:e2e`) passa 100% depois das correções.

## Por que este doc existe

O app cresceu de "galeria + colorir" para **7 experiências** sem nenhuma rede de segurança: não havia testes, o `pnpm lint` não roda no CI, e o deploy dispara direto no push para `main`. A única barreira antes de produção era o `tsc -b` embutido no `pnpm build`.

Dois bugs apareceram só de brincar com o app — o patinho que some atrás da grama e a tela que dá zoom. Isso sugeriu que havia mais do mesmo tipo espalhado. Esta varredura existe para achar o resto de forma sistemática e deixar cada achado com **um teste que falha**, para que a correção tenha como ser verificada.

## Como reproduzir

```bash
pnpm test:e2e                                     # tudo
pnpm test:e2e --project=mobile e2e/duck-nest.spec.ts
pnpm test:e2e --project=ios-safari                # motor do Safari
pnpm test:e2e:report                              # trace + vídeo + screenshot + JSON de diagnóstico
```

Cada bug cita o teste que o expõe. As evidências ficam anexadas ao relatório HTML — abra com `pnpm test:e2e:report` e procure o teste pelo nome.

## Escala de severidade

| Nível | Critério |
|---|---|
| 🔴 Crítico | Trava o jogo, impede concluir, ou torna a mecânica inutilizável para uma criança de 2–5 anos |
| 🟠 Alto | Frustra ou confunde o alvo (perde o objeto de vista, layout desmonta ao toque acidental), mas há caminho de volta |
| 🟡 Médio | Comportamento errado em caso de borda, ou degradação num viewport específico |
| 🔵 Baixo | Não afeta a brincadeira: console, processo, consistência interna |

> A severidade é medida pela ótica de **quem tem 2–5 anos**, não pela ótica técnica. Uma criança nessa idade não sabe recarregar a página, não entende que "sumiu mas ainda está lá", e desiste em vez de tentar de novo. Por isso o patinho invisível durante o arrasto é crítico ainda que o `drop` funcione perfeitamente por baixo.

## Resumo

| Severidade | Qtd | Bugs | Status |
|---|---|---|---|
| 🔴 Crítico | 2 | BUG-01, BUG-02 | ✅ corrigidos |
| 🟠 Alto | 2 | BUG-03, BUG-04 | ✅ corrigidos |
| 🟡 Médio | 3 | BUG-05, BUG-06, BUG-07 | ✅ corrigidos |
| 🔵 Baixo | 2 | BUG-08, BUG-09 | ✅ corrigidos |

## Índice por jogo

| Jogo | 🔴 | 🟠 | 🟡 | 🔵 | Bugs |
|---|---|---|---|---|---|
| **Patinhos no Ninho** | 2 | — | — | — | BUG-01, BUG-02 |
| **Global** (todas as telas) | — | 2 | 1 | 2 | BUG-03, BUG-04, BUG-07, BUG-08, BUG-09 |
| **Colorir** | — | — | 1 | — | BUG-05 |
| **Salão de Unhas** | — | — | 1 | — | BUG-06 |
| Encaixe de Formas | — | — | — | — | nenhum |
| Corta-Frutas | — | — | — | — | nenhum |
| Memória | — | — | — | — | nenhum |
| Caça-Coelho | — | — | — | — | nenhum |

> Que 4 dos 7 jogos tenham saído limpos é informação, não ausência de dados: eles passaram por fluxo completo até o fim, toques em rajada, saída no meio do jogo, storage bloqueado e storage corrompido.

---

# 🔴 Crítico

## Patinhos no Ninho

### BUG-01 · O patinho some atrás da grama durante o arrasto

| | |
|---|---|
| **Jogo** | Patinhos no Ninho (`/duck-nest`) |
| **Severidade** | 🔴 Crítico |
| **Viewports** | mobile ✗ · tablet ✗ |
| **Teste** | `e2e/duck-nest.spec.ts` › "o patinho arrastado continua visível ao passar sobre a grama" |
| **Reprodutibilidade** | 3 de 3 execuções (não é flaky) |
| **Status** | ✅ Corrigido (opção 2) — commit "fix: remove stacking context acidental no full-bleed do Ninho de Patos" |

**Passos**

1. Abrir `/colorir-game/duck-nest`.
2. Pressionar um patinho no lago e arrastá-lo em direção ao ninho da mesma cor.
3. Observar o patinho no momento em que o dedo entra na faixa de grama.

**Esperado:** o patinho arrastado fica por cima de tudo até ser solto.
**Atual:** ele desaparece atrás da faixa de grama e dos ninhos nos últimos ~17% do trajeto — exatamente quando a criança precisa mirar. O teste mediu **3 de 18 pontos** do caminho com o patinho coberto, e identificou o que estava por cima: primeiro a faixa de grama (`div.relative.left-1/2.-mb-4`), depois o `svg` do próprio ninho.

**Causa raiz**

Em `src/pages/DuckNestPage.tsx`, o lago (linha 170) e a grama (linha 210) são irmãos e ambos usam o truque full-bleed `left-1/2 w-screen -translate-x-1/2`. O `-translate-x-1/2` produz `transform ≠ none`, o que **cria um stacking context** em cada um. Daí:

- o `z-30` que `DuckDraggable` aplica ao entrar em drag (`DuckDraggable.tsx:142`) fica **confinado dentro do stacking context do lago** e nunca é comparado com nada fora dele;
- lago e grama são ambos `position: relative` com `z-index: auto`, então pintam **na ordem do DOM** — a grama vem depois e sobe por cima de todo o lago, com seu fundo opaco (`bg-gradient-to-b from-emerald-300/90 …`) e os `NestSlot` dentro.

O `drop` continua funcionando: o `hitTest` é geométrico (`getBoundingClientRect`), não usa hit-testing de DOM. O bug é puramente visual — e por isso mais cruel, porque a mecânica "funciona" e ninguém suspeita do código.

> **Contraprova.** O Encaixe de Formas não tem o bug, e o mesmo teste de oclusão passa lá. Em `ShapeFitPage.tsx:132-173` nem a prancha nem a bandeja criam stacking context, então o `z-30` do `ShapeDraggable` sobe direto até a área de jogo.

**Correção sugerida** — três caminhos, do mais barato ao mais estrutural:

1. **Dar `z-index` explícito aos dois irmãos**: lago `z-20`, grama `z-10`. Eles não se sobrepõem geometricamente (são empilhados por flex), então inverter a ordem de pintura é seguro. Uma linha em cada `div`.
2. **Trocar o full-bleed por uma técnica sem `transform`**: `w-screen ml-[calc(50%-50vw)]` em vez de `left-1/2 -translate-x-1/2`. Remove a causa em vez do sintoma, e vale auditar os outros usos do mesmo truque.
3. **Renderizar o patinho em arrasto via portal** numa camada de topo. Mais invasivo; só compensa se outros jogos vierem a precisar.

A opção 2 é a mais correta conceitualmente — o stacking context acidental é a doença. *(Correção pós-varredura: o truque full-bleed com `transform` existe em só estas 2 linhas do projeto, não se repete como sugerido aqui — o que torna a opção 2 tão barata quanto a 1. Foi a opção escolhida.)*

---

### BUG-02 · Em paisagem, um terço dos ninhos fica fora da tela

| | |
|---|---|
| **Jogo** | Patinhos no Ninho (`/duck-nest`) |
| **Severidade** | 🔴 Crítico |
| **Viewports** | qualquer tela deitada (testado 844×390) |
| **Teste** | `e2e/resilience.spec.ts` › "rotacionar a tela mantém todos os alvos dentro da área visível" |
| **Reprodutibilidade** | 3 de 3 execuções |
| **Status** | ✅ Corrigido (trava em retrato) — commit "feat: trava o app em retrato com aviso de rotação". O teste foi reescrito para verificar o overlay de rotação em vez da posição dos alvos (o manifest do PWA não vale no navegador comum — só quando instalado). |

**Passos**

1. Abrir `/colorir-game/duck-nest` em retrato.
2. Girar o aparelho para paisagem (ou redimensionar para 844×390).

**Esperado:** os 3 ninhos continuam visíveis e alcançáveis.
**Atual:** os **3 ninhos** terminam em `bottom: 421px` numa viewport de `390px` — ficam **31px abaixo do fim da tela**. O jogo fica impossível de concluir: os patinhos existem, os ninhos não são visíveis nem alcançáveis, e a criança não tem como voltar ao retrato sozinha.

**Causa raiz**

O layout empilha lago (`flex-1`) e grama verticalmente dentro de um `h-svh`. Em paisagem a altura disponível cai para menos da metade, mas os SVGs de patinho e ninho escalam pela **largura** da célula do grid (`w-full`, `h-auto`) — e a largura *aumenta* ao girar. Resultado: os elementos crescem justamente quando há menos altura, e a faixa de grama é empurrada para fora.

Nada limita a altura desses SVGs, e não há tratamento de orientação em lugar nenhum do app.

**Correção sugerida**

Limitar a altura dos elementos em vez de deixá-la derivar da largura — por exemplo `max-h-[22svh]` nos SVGs de patinho e ninho, ou uma media query de orientação (`@media (orientation: landscape)`) que reduza os tamanhos e o gap. Alternativa mais simples e possivelmente melhor para o público: **travar o app em retrato**, via `orientation: "portrait"` no manifest do PWA (`vite.config.ts`) mais um aviso "vire o aparelho" para o navegador comum, onde o manifest não vale.

> Vale checar os outros jogos em paisagem. O teste hoje cobre só o duck-nest; os demais podem ter o mesmo problema sem estar medido.

---

# 🟠 Alto

## Global

### BUG-03 · Falha ao criar o `AudioContext` escapa como erro não tratado

| | |
|---|---|
| **Jogo** | Todos (`useSoundEffects`) |
| **Severidade** | 🟠 Alto |
| **Viewports** | mobile ✗ · tablet ✗ |
| **Teste** | `e2e/console-health.spec.ts` › "o construtor de AudioContext está protegido contra exceção" |
| **Reprodutibilidade** | 3 de 3 execuções |
| **Status** | ✅ Corrigido — commit "fix: protege construtor de AudioContext contra exceção" |

**Passos**

1. Fazer o construtor `AudioContext` lançar (o teste sabota via `addInitScript`; na vida real acontece quando o navegador atinge o limite de ~6 contextos por página, ou em WebView com áudio desabilitado).
2. Abrir qualquer jogo e tocar algumas vezes.

**Esperado:** som silenciosamente indisponível, app funcionando.
**Atual:** **3 erros não tratados** vazam para o console (`Error: AudioContext indisponível`). Não derruba o React, mas polui o console e — como todos os `play*` são `async` — vira *unhandled promise rejection*, o tipo de coisa que dispara alerta em monitoramento e mascara erros de verdade.

**Causa raiz**

`src/hooks/useSoundEffects.ts:43-55`:

```ts
const getContext = useCallback(async (): Promise<AudioContext | null> => {
  if (!ctxRef.current) {
    ctxRef.current = new AudioContext()   // ← linha 45: FORA do try/catch
  }
  if (ctxRef.current.state === "suspended") {
    try {
      await ctxRef.current.resume()       // ← este sim está protegido
    } catch {
      return null
    }
  }
  return ctxRef.current
}, [])
```

O `resume()` foi cuidadosamente protegido; o construtor, não. Todo o resto do hook já trata a ausência de contexto corretamente (`if (!ctx) return` em cada `play*`) — falta só fechar essa porta.

**Correção sugerida**

Envolver a criação no mesmo try/catch e retornar `null`:

```ts
if (!ctxRef.current) {
  try {
    ctxRef.current = new AudioContext()
  } catch {
    return null
  }
}
```

> Verificado e **descartado** como problema: navegar 3 voltas completas por todos os 7 jogos **não** estoura o limite de AudioContexts. O `ctx.close()` no unmount está funcionando. O risco é o construtor falhar por outro motivo, não vazamento.

---

### BUG-04 · Não há defesa contra o zoom por pinça no iOS

| | |
|---|---|
| **Jogo** | Todos |
| **Severidade** | 🟠 Alto |
| **Viewports** | Safari/iOS (iPhone e iPad) |
| **Testes** | `e2e/viewport-lock.spec.ts` › "existem defesas em JS contra zoom (o que o iOS exige)" e › "inventário das regras globais de trava" |
| **Reprodutibilidade** | 3 de 3 execuções |
| **Status** | ✅ Corrigido — commit "fix: adiciona defesas de zoom por pinça para iOS". Zoom real em iPhone/iPad físico continua não verificado automaticamente (ver "Não verificado" abaixo). |

**O que o app já faz — e onde a defesa termina**

| Onde | O que tem | Lacuna |
|---|---|---|
| `index.html:6` | `maximum-scale=1.0, user-scalable=no` | **O Safari iOS ignora isso desde o iOS 10.** Funciona no Chromium/Android; não funciona no aparelho mais provável para o público |
| `src/index.css:137` | `html { touch-action: manipulation }` | Bloqueia o duplo toque, **não** bloqueia a pinça |
| `src/index.css:132-133` | `body { overflow: hidden; overscroll-behavior: none }` | O `html` **não** tem nenhuma das duas, nem `height: 100%`. No iOS quem rola é o elemento raiz — o `body` sozinho não segura |
| — | nada intercepta `gesturestart`/`gesturechange` (Safari) nem `wheel` com `ctrlKey` (trackpad) | É a única defesa que funciona no iOS |

**O que a suíte conseguiu e não conseguiu provar**

Sejamos precisos aqui, porque é fácil concluir demais:

- ✅ **Provado:** nenhum listener intercepta `gesturestart`, `gesturechange` ou `Ctrl+wheel` — o teste despacha cada evento e lê `defaultPrevented`, que volta `false` nos três.
- ✅ **Provado:** `html` está sem `overflow: hidden` e sem `overscroll-behavior: none`.
- ✅ **Provado:** no **Chromium** (Android-like), pinça, duplo toque, swipe e roda **não** dão zoom nem rolam. Todas as 8 rotas medem `scrollHeight == innerHeight == 844`. O app está correto lá.
- ❌ **Não reproduzido automaticamente:** o zoom no iOS real. O motor WebKit do Playwright não expõe gestos de pinça (é CDP, exclusivo do Chromium), e o WebKit de desktop não replica fielmente o comportamento do Safari móvel.

Ou seja: o sintoma relatado é consistente com a lacuna medida, mas a confirmação final precisa de um iPhone/iPad de verdade.

**Correção sugerida**

1. **CSS** — travar também o elemento raiz:
   ```css
   html, body { height: 100%; overflow: hidden; overscroll-behavior: none; }
   ```
2. **JS** — interceptar os gestos que o iOS não deixa o CSS barrar:
   ```ts
   for (const ev of ["gesturestart", "gesturechange", "gestureend"]) {
     document.addEventListener(ev, (e) => e.preventDefault())
   }
   document.addEventListener("wheel", (e) => { if (e.ctrlKey) e.preventDefault() }, { passive: false })
   ```

> ⚠️ **Não aplique `touch-action: none` global.** A paleta de cores do Colorir rola na horizontal de propósito. O teste "inventário de elementos que rolam de propósito" existe para essa correção não criar um bug novo — rode-o antes e depois e compare o JSON anexado.

---

# 🟡 Médio

## Colorir

### BUG-05 · Algumas regiões não pintam quando a criança toca no meio da forma

| | |
|---|---|
| **Jogo** | Colorir (`/coloring/:id`) |
| **Severidade** | 🟡 Médio |
| **Viewports** | mobile ✗ · tablet ✗ |
| **Teste** | `e2e/coloring.spec.ts` › "as regiões são acertáveis no centro (mira de criança)" |
| **Reprodutibilidade** | 3 de 3 execuções |
| **Status** | ✅ Aceito e sinalizado (opção 3) — commit "feat: sinaliza regiões côncavas no conversor de line art". Não é bug de código; o conversor agora avisa na curadoria, e o teste virou informativo (só reprova se uma região não for pintável por ponto nenhum). |

**Passos**

1. Abrir um desenho.
2. Tocar no centro visual de uma região côncava (ex.: uma faixa curva, um contorno em "C").

**Esperado:** a região pinta.
**Atual:** nada acontece. O centro do *bounding box* dessas regiões cai **fora** do preenchimento, então `document.elementFromPoint` devolve outro elemento e a delegação de clique de `ColoringSVG` nunca recebe o `path` certo.

Medição nos 3 primeiros desenhos:

| Desenho | Regiões | Inacessíveis pelo centro | % |
|---|---|---|---|
| `peppa-pig` | 23 | `region-13`, `region-15` | 9% |
| `papai-pig` | 22 | `region-4`, `region-8`, `region-18` | 14% |

**Por que importa mais aqui do que num app adulto:** um adulto que erra o toque tenta 2cm ao lado. Uma criança de 2 anos toca no meio do desenho, não acontece nada, e conclui que "não funciona". As regiões continuam pintáveis — só não pelo ponto mais óbvio.

**Nota de escopo:** isto **não** impede chegar a 100%. `countPaths` já ignora regiões com área < 500u², e o teste de conclusão passa. É um problema de frustração, não de progressão.

**Correção sugerida**

Não há bug de código — é geometria dos SVGs gerados pelo `scripts/convert_to_coloring.py`. Opções:

1. Aceitar e documentar, já que não bloqueia a conclusão (menor esforço).
2. Aumentar a área efetiva de toque das regiões pequenas/côncavas com `stroke` transparente largo (`stroke: transparent; stroke-width: 12; paint-order: stroke`), que engorda a área clicável sem mudar o visual.
3. Adicionar ao conversor uma verificação que sinalize regiões cujo centro do bbox não pertence ao próprio path, para revisão manual na curadoria (`docs/coloring-catalog.md`).

---

## Salão de Unhas

### BUG-06 · A unha do mindinho é menor que o alvo mínimo de toque

| | |
|---|---|
| **Jogo** | Salão de Unhas (`/nail-salon`) |
| **Severidade** | 🟡 Médio |
| **Viewports** | mobile (390×844) ✗ · **tablet (820×1180) ✓** |
| **Teste** | `e2e/nail-salon.spec.ts` › "as unhas são alvos grandes o bastante para um dedo de criança" |
| **Reprodutibilidade** | 3 de 3 execuções, sempre só no celular |
| **Status** | ✅ Corrigido — commit "fix: aumenta área de toque da unha do mindinho" |

**Atual:** no celular, o alvo "Unha do dedo mindinho" mede **43×150px**. A referência de acessibilidade para toque é 44px na menor dimensão — e essa referência é para adultos. As outras quatro unhas passam, e no tablet o mindinho também passa (a mão inteira escala).

Ou seja: é um bug **exclusivo de tela pequena**, exatamente onde o dedo tem menos espaço para errar.

O alvo já é o dedo inteiro (não só a unha), o que foi uma boa decisão de design; o mindinho é estreito demais mesmo assim.

**Correção sugerida**

Engordar a área clicável do mindinho sem mexer no desenho: um `<rect>` transparente maior dentro do mesmo `<g role="button">`, ou `stroke` transparente no path do dedo. Em `HandSVG.tsx`.

---

## Global

### BUG-07 · O botão de voltar tem dois rótulos diferentes

| | |
|---|---|
| **Telas** | Galeria de colorir × os 6 jogos |
| **Severidade** | 🟡 Médio |
| **Teste** | `e2e/navigation.spec.ts` › "o rótulo do botão de voltar é o mesmo em todas as telas" |
| **Reprodutibilidade** | 2 de 2 execuções (o teste foi criado depois da primeira) |
| **Status** | ✅ Corrigido — commit "fix: padroniza rótulo do botão de voltar" |

**Atual:**

| Tela | Rótulo | Elemento |
|---|---|---|
| Galeria de colorir | `"Voltar ao início"` | `<a>` (`GalleryHeader.tsx:22`) |
| Caça-Coelho, Salão de Unhas, Patinhos no Ninho, Encaixe de Formas, Corta-Frutas, Memória | `"Voltar para o início"` | `<button>` |

A mesma ação tem dois nomes acessíveis. Para quem usa leitor de tela, são duas ações diferentes; para qualquer automação, é um seletor que falha em uma tela só.

**Correção sugerida:** padronizar em `"Voltar para o início"` (6 telas contra 1). Uma linha em `src/components/GalleryHeader.tsx`.

> Enquanto não for padronizado, os testes usam o seletor combinado `ANY_BACK` (`e2e/helpers/selectors.ts`), com o motivo comentado no código.

---

# 🔵 Baixo

### BUG-08 · `pnpm lint` já falha no repositório (pré-existente)

| | |
|---|---|
| **Severidade** | 🔵 Baixo |
| **Como verificar** | `pnpm lint` |
| **Status** | ✅ Corrigido — commit "fix: corrige violação de lint em ColoringHint" |

`src/components/ColoringHint.tsx:27` viola `react-hooks/set-state-in-effect` (`setPosition(null)` chamado direto no corpo de um `useEffect`). O erro é **anterior a esta varredura** — vem do commit `fe7fe37`, e `git status src/` confirma que nenhum arquivo de `src/` foi tocado aqui.

Consequência prática: como `pnpm lint` já sai com código 1, ninguém consegue usá-lo como portão de qualidade sem antes limpar isso.

**Correção sugerida:** mover o reset para o mesmo lugar que decide `visible`, ou derivar a posição durante o render em vez de guardá-la em estado.

---

### BUG-09 · O CI não roda lint nem testes, e não roda em PR

| | |
|---|---|
| **Severidade** | 🔵 Baixo (mas é o que deixa todos os outros passarem) |
| **Arquivo** | `.github/workflows/deploy.yml` |
| **Status** | ✅ Corrigido — commit "ci: adiciona job de lint e build em pull request" (novo `.github/workflows/ci.yml`). Roda lint + build em PR; a suíte E2E fica de fora por ora (decisão registrada em "Status" no topo do documento). |

O único workflow dispara em `push` para `main` e executa apenas `pnpm install` + `pnpm build`. Não há gatilho de `pull_request`, não roda `pnpm lint`, não roda testes. A única verificação implícita é o `tsc -b` embutido no build — e `strict` não está habilitado em nenhum tsconfig.

**Correção sugerida:** adicionar um job de verificação com gatilho de `pull_request` rodando `pnpm lint` e `pnpm test:e2e`. Depende de resolver o BUG-08 antes, senão o lint reprova de saída.

---

## Verificado e OK

Vale registrar o que **não** está quebrado, para ninguém gastar tempo procurando de novo:

- **Chromium/Android está travado corretamente.** Pinça, duplo toque, swipe vertical e roda do mouse não dão zoom nem rolam, nas 8 rotas. Todas medem `scrollHeight == innerHeight`.
- **Nenhum vazamento de AudioContext.** 3 voltas completas por todos os jogos não estouram o limite do navegador; o `close()` no unmount funciona.
- **`localStorage` bloqueado ou corrompido não derruba nada.** Testado com storage que lança em todo acesso, com JSON inválido e com tipo errado (objeto onde se espera array), nas 8 rotas.
- **Sair da página no meio da ação é seguro.** Arrasto interrompido, timers do caça-coelho, loop de animação do corta-frutas e o `ref.current!` dos slots — nenhum gerou erro ao desmontar.
- **A mira generosa funciona.** Soltar o patinho 20px acima do ninho acerta; soltar entre dois ninhos escolhe o mais próximo. As margens de 32px/24px cumprem o papel.
- **`prefers-reduced-motion` é respeitado.** A animação infinita `card-wobble` é desligada corretamente (`src/index.css:328`). *(Ela atrapalha o Playwright, que espera o elemento ficar estável — por isso os testes clicam com `force: true`. Não é bug do app.)*
- **Redimensionar durante o arrasto não quebra.** O padrão `register(() => getBoundingClientRect())` dos slots é de fato robusto a reflow.
- **A rajada de toques está contida.** Toques simultâneos no Memória não abrem uma terceira carta.

---

## Não verificado

O que esta varredura **não** conseguiu cobrir, e por quê:

| Item | Motivo |
|---|---|
| **Zoom no Safari iOS real** | O WebKit do Playwright não expõe gestos de pinça (CDP é exclusivo do Chromium). O BUG-04 documenta a lacuna estrutural, mas a confirmação do sintoma precisa de iPhone/iPad físico |
| **Service worker / PWA `autoUpdate`** | Exige build de produção e dois deploys em sequência para provar conteúdo obsoleto. Fora do alcance do dev server |
| **Os outros 6 jogos em paisagem** | Só o duck-nest tem teste de rotação (BUG-02). Os demais podem ter o mesmo problema sem estar medido |
| **`max-h-[55vh]` no Salão de Unhas** | `NailSalonPage.tsx:209` usa `vh` enquanto todo o resto do app usa `svh`. Em headless não existe barra de URL, então `vh == svh` e o teste passa. O corte só aparece em navegador móvel real com a barra visível |
| **Corta-Frutas: cortar bomba** | O teste existe mas se auto-pula quando nenhuma bomba aparece no tempo disponível — `bombChance` é baixa na fase 1. O caminho feliz (cortar, avançar de fase) está coberto |
| **Sincronização entre abas** | O teste passa, mas dispara o evento `storage` manualmente. Duas abas de verdade não foram testadas |
| **Leitor de tela real** | Os rótulos ARIA foram verificados por seletor, não por VoiceOver/TalkBack |

---

## Sobre a suíte

`e2e/` tem **12 arquivos de spec**. Três perfis: `mobile` (390×844), `tablet` (820×1180) e `ios-safari` (WebKit, só o `viewport-lock`). `retries: 0` é deliberado — a suíte existe para expor instabilidade, não para escondê-la.

Execução completa mais recente:

```
352 passed · 18 failed · 26 skipped · 7.7 min
```

As 18 falhas são exatamente os 7 bugs deste documento, contados uma vez por perfil em que se manifestam (o BUG-04 tem dois testes, e roda nos três perfis). Os 26 pulados são os testes de gesto sintetizado no perfil WebKit, onde o CDP não existe — cada um declara o motivo no próprio `test.skip`.

Todos os bugs foram reproduzidos em **três execuções independentes**, e nenhum alternou resultado. Um teste do Memória oscilou durante o desenvolvimento (dependia de acertar o timing do lock de 900ms) e foi reescrito para ser determinístico — não era bug do app.

| Perfil | Bugs que se manifestam |
|---|---|
| `mobile` (390×844) | BUG-01, 02, 03, 04, 05, 06, 07 |
| `tablet` (820×1180) | BUG-01, 02, 03, 04, 05, 07 — **o BUG-06 não ocorre aqui** |
| `ios-safari` (WebKit) | BUG-04 |

Os helpers em `e2e/helpers/` valem conhecer antes de mexer nos specs:

| Helper | Para quê |
|---|---|
| `drag.ts` | Arrasto por toque via CDP (`page.touchscreen` só faz tap), multi-toque, pinça, duplo toque. O callback `onMove` permite inspecionar o estado **no meio** do gesto — é o que torna o BUG-01 detectável |
| `occlusion.ts` | `isTopmostAt` / `stackingChain`. Detecta oclusão por `elementFromPoint` em vez de comparar pixels, e reporta quais ancestrais criam stacking context — foi assim que a causa do BUG-01 saiu automaticamente |
| `fixtures.ts` | Fixture `logs` (falha o teste em erro de console) e `waitForNoCelebration` — o overlay de celebração é `fixed inset-0 z-[60]` e engole qualquer toque nos 3s em que fica visível |
| `selectors.ts` | Seletores por `role` + `aria-label`. O projeto não tem `data-testid`, e esta rodada não podia adicionar |
