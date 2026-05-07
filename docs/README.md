# 🎨 Leonardo da Vinci App

> Jogo de colorir virtual para crianças de 2 a 5 anos — inspirado no estilo Bobbie Goods.

## Visão Geral

Um site simples e interativo onde crianças pequenas podem colorir desenhos com toques/cliques. O foco é na experiência lúdica, com interface grande, colorida e sem texto — ideal para crianças que ainda não leem.

## Público-Alvo

- Crianças de **2 a 5 anos**
- Uso supervisionado por pais/responsáveis
- Dispositivos: **tablet e celular** (touch-first), com suporte a desktop

## Stack Técnica (MVP)

| Camada     | Tecnologia                      |
| ---------- | ------------------------------- |
| Framework  | React + TypeScript              |
| Build      | Vite                            |
| Estilo     | Tailwind CSS                    |
| Hospedagem | GitHub Pages ou Vercel (grátis) |
| Imagens    | SVG (paths com `fill`)          |

> **Por que SVG?** Cada região do desenho é um `<path>` clicável. A criança toca na região e ela é preenchida com a cor selecionada. Simples, sem necessidade de flood-fill complexo.

## Funcionalidades — MVP

### 1. Tela Inicial (Galeria)

- Grade com **thumbnails** dos desenhos disponíveis
- Ícones grandes e sem texto
- Ao tocar em um desenho, abre a tela de colorir

### 2. Tela de Colorir

- **Desenho SVG** exibido em tela cheia
- **Paleta de cores** fixa na parte inferior (6–8 cores vibrantes)
- Toque em uma **cor** para selecioná-la
- Toque em uma **região do desenho** para preenchê-la com a cor selecionada
- Botão de **desfazer** (undo) — volta a última ação
- Botão de **limpar tudo** — reseta o desenho
- Botão de **voltar** — retorna à galeria

### 3. Desenhos Incluídos (MVP)

- 4–6 desenhos simples em SVG com regiões bem definidas
- Temas infantis: animais, frutas, estrelas, arco-íris

### 4. UX / Acessibilidade Infantil

- Botões grandes (mínimo 48px touch target)
- Sem texto — apenas ícones
- Feedback visual ao tocar (animação/destaque na cor e na região)
- Sem popups, propagandas ou navegação externa
- Cores da paleta com borda de destaque na cor ativa

## Funcionalidades — Futuro (pós-MVP)

- 💾 Salvar/baixar desenho como imagem (PNG)
- 🖌️ Ferramenta de desenho livre (pincel)
- 🎵 Sons/música de fundo
- ⭐ Sistema de "adesivos" para colar no desenho
- 📱 PWA (instalar como app no celular)
- 🌐 Mais desenhos (galeria expansível)
- 👤 Perfis de criança (sem dados sensíveis)

## Fluxo Principal

```
┌─────────────┐     toque no desenho     ┌──────────────────┐
│   Galeria    │ ──────────────────────►  │  Tela de Colorir │
│  (thumbnails)│                          │                  │
└─────────────┘  ◄──────────────────────  │  [paleta] [undo] │
                     botão voltar         └──────────────────┘
```

1. Criança abre o app → vê a **galeria**
2. Toca em um desenho → abre a **tela de colorir**
3. Seleciona uma **cor** na paleta
4. Toca nas **regiões** do desenho para pintá-las
5. Pode **desfazer** ou **limpar** a qualquer momento
6. Botão **voltar** retorna à galeria
