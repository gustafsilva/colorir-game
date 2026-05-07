# Tarefas — Leonardo da Vinci App

> Jogo de colorir para crianças de 2 a 5 anos • React + TypeScript + Vite

---

## 1. Configuração Inicial

- [ ] Instalar e configurar **Tailwind CSS**
- [ ] Configurar **React Router** para navegação entre telas
- [ ] Definir estrutura de pastas (`components/`, `pages/`, `assets/svg/`, `hooks/`, `types/`)
- [ ] Configurar tema base (cores, fontes, tamanhos touch-friendly)
- [ ] Adicionar configuração de **PWA** (manifest, service worker básico)

## 2. Tela Inicial — Galeria de Imagens

- [ ] Criar página `GalleryPage` com grid responsivo de thumbnails
- [ ] Criar componente `DrawingCard` (thumbnail do desenho)
- [ ] Ícones grandes, sem texto — apenas imagens
- [ ] Navegação para a tela de colorir ao tocar no card
- [ ] Layout adaptado para **tablet/celular** (touch-first)
- [ ] Feedback visual ao tocar (animação/destaque)

**Critérios de aceite:**
- Grid exibe 4–6 desenhos com thumbnails SVG
- Botões com touch target mínimo de **48px**
- Sem texto visível — apenas ícones/imagens
- Responsivo: 2 colunas em celular, 3+ em tablet/desktop

## 3. Tela de Colorir

- [ ] Criar página `ColoringPage` com SVG em tela cheia
- [ ] Criar componente `ColorPalette` — paleta fixa no rodapé (6–8 cores vibrantes)
- [ ] Implementar seleção de cor com destaque visual na cor ativa
- [ ] Implementar preenchimento de região SVG ao tocar (`<path>` com `fill`)
- [ ] Botão **Desfazer** (undo) — reverte a última ação
- [ ] Botão **Limpar tudo** — reseta todas as cores do desenho
- [ ] Botão **Voltar** — retorna à galeria
- [ ] Criar/incluir **4–6 desenhos SVG** com regiões bem definidas (animais, frutas, estrelas, arco-íris)

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
