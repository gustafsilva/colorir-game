# Tarefas — Colorir Game

> Jogo de colorir para crianças de 2 a 5 anos • React + TypeScript + Vite

---

## 1. Configuração Inicial ✅

- [x] Instalar e configurar **Tailwind CSS** (v4 com `@tailwindcss/vite`)
- [x] Configurar **React Router** para navegação entre telas (v7, rotas `/` e `/coloring/:id`)
- [x] Definir estrutura de pastas (`components/`, `pages/`, `assets/svg/`, `hooks/`, `types/`, `layouts/`)
- [x] Configurar tema base (fonte Baloo 2, paleta vibrante crayon-*, touch targets 48px)
- [x] Adicionar configuração de **PWA** (manifest, service worker com precache, ícones 192/512px)

## 2. Tela Inicial — Galeria de Imagens

- [x] Criar página `GalleryPage` com grid responsivo de thumbnails
- [x] Criar componente `DrawingCard` (thumbnail do desenho)
- [x] Ícones grandes, sem texto — apenas imagens
- [x] Navegação para a tela de colorir ao tocar no card
- [x] Layout adaptado para **tablet/celular** (touch-first)
- [x] Feedback visual ao tocar (animação/destaque)

**Critérios de aceite:**
- Grid exibe 4–6 desenhos com thumbnails SVG
- Botões com touch target mínimo de **48px**
- Sem texto visível — apenas ícones/imagens
- Responsivo: 2 colunas em celular, 3+ em tablet/desktop

## 3. Tela de Colorir

- [x] Criar página `ColoringPage` com SVG em tela cheia
- [x] Criar componente `ColorPalette` — paleta fixa no rodapé (6–8 cores vibrantes)
- [x] Implementar seleção de cor com destaque visual na cor ativa
- [x] Implementar preenchimento de região SVG ao tocar (`<path>` com `fill`)
- [x] Botão **Desfazer** (undo) — reverte a última ação
- [x] Botão **Limpar tudo** — reseta todas as cores do desenho
- [x] Botão **Voltar** — retorna à galeria
- [x] Criar/incluir **4–6 desenhos SVG** com regiões bem definidas (animais, frutas, estrelas, arco-íris)

**Critérios de aceite:**
- SVG ocupa a área principal da tela
- Paleta de cores visível e acessível o tempo todo
- Toque em região SVG → preenche com a cor selecionada
- Undo funciona corretamente (pilha de ações)
- Limpar reseta o desenho ao estado original
- Sem popups, propagandas ou navegação externa

---

## Backlog (pós-MVP)

- [ ] Salvar/baixar desenho como PNG
- [ ] Ferramenta de desenho livre (pincel)
- [ ] Sons/música de fundo
- [ ] Sistema de adesivos
- [ ] Galeria expansível com mais desenhos
- [ ] Perfis de criança (sem dados sensíveis)
