# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

Package manager é **pnpm** (não usar npm/yarn/bun). Versão fixada via `packageManager` no `package.json`.

```bash
pnpm dev         # Vite dev server
pnpm build       # tsc -b && vite build → dist/
pnpm lint        # ESLint flat config (eslint.config.js)
pnpm preview     # serve o build
```

Não há suite de testes nem comando de typecheck dedicado — `tsc -b` roda como parte do `build`.

Para rodar o conversor de line art (Python, fora do bundle), ver `scripts/README.md`. Setup uma vez via `python3 -m venv .venv && pip install -r requirements.txt`.

## Arquitetura

App de colorir SPA para crianças (2–5 anos), React 19 + Vite 8 + Tailwind 4 + react-router 7. PWA via `vite-plugin-pwa`. Deploy em GitHub Pages através de `.github/workflows/deploy.yml` no push para `main`.

### Base path acoplado

O app é servido em `/colorir-game/`. Esse caminho aparece em **dois** lugares e tem que casar:
- `vite.config.ts` → `base: "/colorir-game/"`
- `src/router.tsx` → `basename: "/colorir-game/"`

Se mudar um, mudar o outro.

### Duas rotas, um layout

`RootLayout` envolve tudo. Rotas: `/` (`GalleryPage`) e `/coloring/:id` (`ColoringPage`). View transitions entre galeria e colorir usam `viewTransitionName: drawing-${id}` no container.

### Os SVGs são importados de duas formas

Cada desenho em `src/assets/svg/*.svg` é importado em **dois lugares diferentes**, com queries Vite distintas:

- `src/data/drawings.ts` — `import x from "...?url"` → URL para thumbnails da galeria.
- `src/data/drawingSvgContent.ts` — `import x from "...?raw"` → string inline para a tela de colorir (precisa do markup para inserir via `innerHTML`).

Ao adicionar/remover um desenho **os dois arquivos precisam ser atualizados**, mais o map `drawingColors` em `drawings.ts` e o `ariaLabels` em `src/components/DrawingCard.tsx`. O script `scripts/convert_to_coloring.py` automatiza as duas primeiras.

### Convenção de SVG colorível

`ColoringSVG.tsx` faz event delegation por click no container e identifica regiões coloríveis pela presença de `id` no `<path>`:

- `<path id="...">` → colorível, recebe `cursor: pointer` e classe `colorable-path`.
- `<path>` sem id, `<line>`, `<circle>`/`<ellipse>`/`<rect>`/`<polygon>` sem id, `<polyline>` → tratados como line art decorativo, recebem `pointer-events: none` para que o clique passe por baixo até a região colorível.

Pontos sutis:

1. **DOM do SVG não é re-renderizado pelo React.** `ColoringSVG` usa `ref + innerHTML` em vez de `dangerouslySetInnerHTML` — isso evita um flash de zoom/reset que aparecia quando o React recriava o subárvore SVG a cada seleção de cor. Os fills são aplicados imperativamente em um segundo `useEffect`. Se reescrever esse componente usando JSX/`dangerouslySetInnerHTML`, o flash volta.

2. **Paths com área < `MIN_COLORABLE_AREA` (500 unidades²) não contam para 100%.** Em `ColoringPage.tsx`, `countPaths` ignora detalhes minúsculos (olhos, narizes) que toddlers não conseguem acertar — eles continuam coloríveis, só não bloqueiam a celebração de "completo". A área é estimada do bounding box dos números no atributo `d` (não é exata, é boa o suficiente).

### Estado e persistência

- `useColoring` — estado local da página: `selectedColor`, mapa `fills` (pathId → cor), undo stack.
- `useCelebration` — calcula milestones (50%, 75%, 100%) e dispara overlay de confete. Sempre pega o **maior** milestone que o progresso atual satisfaz para não "regredir" quando uma única ação cruza múltiplos limiares.
- `useCompletedDrawings` — persiste em `localStorage` (chave `"coloring-completed"`) os ids de desenhos concluídos. Ouve `storage` event para sync entre abas.
- `useFirstTimeUser` — flag de onboarding (hint da primeira vez).
- `useSoundEffects` — efeitos sonoros (splash, pop, whoosh, click).

### Paleta de cores e tokens visuais

A paleta crayon vive como CSS variables OKLCH em `src/index.css` (`--color-crayon-*`). `useColoring.PALETTE_COLORS` referencia essas variables como `var(--color-crayon-*)`. Para adicionar/ajustar uma cor, mexer em `src/index.css` e em `PALETTE_COLORS` em `src/hooks/useColoring.ts`.

`shadcn` está configurado (`components.json`) com style `radix-nova` e alias `@/` → `src/`. Apenas `button` foi adicionado em `src/components/ui/`. Ícones: `@phosphor-icons/react` (note: `components.json` lista lucide, mas o código importa de phosphor).

### Adicionar um desenho

Workflow completo descrito em `docs/coloring-catalog.md` e `scripts/README.md`. Resumo:

1. Rodar `scripts/convert_to_coloring.py` com line art PNG → gera SVG e auto-registra em `drawings.ts` + `drawingSvgContent.ts`.
2. Renomear manualmente os ids `<id>-region-N` para nomes semânticos (opcional mas recomendado).
3. Adicionar entrada de aria-label em `src/components/DrawingCard.tsx`.
4. Verificar visualmente em `pnpm dev` → `/colorir-game/coloring/<id>`.
