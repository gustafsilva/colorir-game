# 🖼️ Catálogo de Imagens para Colorir

> Como o catálogo cresce: workflow de busca, conversão e curadoria das imagens
> exibidas na galeria do app.

## Por que este doc existe

As 6 imagens originais (`cat`, `rainbow`, `star`, `butterfly`, `apple`, `sunflower`)
foram desenhadas à mão como SVG. À medida que o catálogo cresce, fazer cada
desenho do zero não escala — a partir da 7ª imagem o catálogo é alimentado
**convertendo line art PNG/JPG da web** com o script `scripts/convert_to_coloring.py`.

Este documento registra o workflow para que ele seja repetível, auditável
(rastrear de onde veio cada imagem) e seguro do ponto de vista de IP.

## Critérios de qualidade da imagem-fonte

Para que o script gere um SVG colorível bom:

- **Line art preto sólido** sobre **fundo branco**
- Formato: **PNG** (preferido), **JPG** ou **WEBP** (converter para PNG antes)
- Resolução: **600–2500 px** funciona bem (muito alta gera muitos pontos no path; muito baixa perde precisão)
- **Linhas fechadas** — se uma região tem buraco na borda, ela vai fundir com regiões vizinhas
- Sem gradientes, sombras, cor ou efeitos
- **Sem moldura externa** — molduras retangulares viram regiões coloríveis indesejadas. Cropar antes.
- **Sem watermark** na área do desenho (cropar a parte inferior se necessário)

Se uma fonte não casar com esses critérios, descarte e procure outra antes
de gastar tempo convertendo.

## Workflow passo-a-passo

A busca é feita **na internet** (Google Images / Pinterest / sites de coloring pages).
Não há repositório local — cada imagem é baixada da web no momento da curadoria.

```
┌───────────┐   ┌──────────┐   ┌────────────┐   ┌─────────┐   ┌────────┐
│ WebSearch │ → │ WebFetch │ → │ curl + sips │ → │ script  │ → │ docs + │
│  (query)  │   │ (extrai  │   │ (baixa PNG  │   │ Python  │   │ teste  │
│           │   │  URL)    │   │  e converte) │   │ (SVG)   │   │        │
└───────────┘   └──────────┘   └────────────┘   └─────────┘   └────────┘
```

1. **`WebSearch`** com query como `<assunto> coloring page line art simple png`
2. **`WebFetch`** nas páginas mais promissoras para extrair URL direta do PNG/WEBP
3. **`curl -L -A 'Mozilla/5.0' -o /tmp/coloring-source/<id>.<ext> '<url>'`**
4. Se não-PNG: **`sips -s format png <input> --out <output>.png`**
5. Cropar watermark/moldura com `cv2.imread + slice` (ver exemplos abaixo)
6. **Rodar o script:**
   ```bash
   cd scripts && source .venv/bin/activate
   python convert_to_coloring.py \
     --input /tmp/coloring-source/<id>.png \
     --id <id> --name "<nome>" --color <crayon-color>
   ```
7. **Preview visual:** `qlmanage -t -s 800 -o /tmp/svg-preview src/assets/svg/<id>.svg`
   e ler o PNG para validar.
8. **Adicionar aria-label** em `src/components/DrawingCard.tsx` (mapa `ariaLabels`)
9. (Opcional, para nomes legíveis) **Renomear IDs** `<id>-region-N` para nomes
   semânticos no SVG. Não é obrigatório — o app aceita qualquer `path[id]`.
10. **Atualizar a tabela abaixo** com a nova entrada e a fonte usada
11. **Testar:** `pnpm dev` e abrir `/coloring/<id>`

### Cropar watermark/moldura

Sites como **SketchJoy** e **CreativeColorLab** colocam watermark no rodapé e às vezes
moldura retangular. Sem cropar, viram regiões coloríveis espúrias. Exemplo:

```bash
source scripts/.venv/bin/activate
python3 -c "
import cv2
img = cv2.imread('/tmp/coloring-source/X.png')
h, w = img.shape[:2]
out = img[80:h-130, 80:w-80]   # corta moldura SketchJoy + watermark
cv2.imwrite('/tmp/coloring-source/X-cropped.png', out)
"
```

## Catálogo inicial (5 imagens piloto adicionadas via script)

| ID         | Nome     | Categoria  | Cor crayon       | Query usada                                     | Fonte original                                                                                                       |
| ---------- | -------- | ---------- | ---------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `bear`     | urso     | animais    | `crayon-orange`  | imagem fornecida pelo usuário                   | (substituída — imagem original do sketchjoy era complexa demais)                                                     |
| `number-1` | número 1 | números    | `crayon-blue`    | imagem fornecida pelo usuário                   | (substituída — imagem original do sketchjoy tinha fundo decorativo)                                                  |
| `letter-a` | letra A  | letras     | `crayon-red`     | `letter A coloring page bubble printable`       | https://woojr.com/wp-content/uploads/2009/04/a-232x300.gif                                                           |
| `tree`     | árvore   | natureza   | `crayon-green`   | `simple tree coloring page line art png`        | https://creativecolorlab.com/wp-content/uploads/2024/03/easy-tree-outline-to-color-preschool.jpg                     |
| `peppa-pig`| Peppa Pig| personagens| `crayon-purple`  | imagem fornecida pelo usuário                   | (Peppa de inverno com gorro/cachecol — substituiu a versão sketchjoy)                                                |
| `george-pig`| George  | personagens| `crayon-blue`    | imagem fornecida pelo usuário                   | (George com bola — fonte 1334x1252, line art simples e limpo)                                                        |
| `rebecca-rabbit`| Rebecca| personagens| `crayon-yellow` | imagem fornecida pelo usuário                  | (Rebecca Rabbit — amiga da Peppa)                                                                                     |
| `papai-pig`| Papai Pig| personagens| `crayon-orange` | imagem fornecida pelo usuário                   | (Papai Pig com gravata e maleta — fonte 189x267, upscaled 4x antes da conversão)                                    |

> **Lição aprendida:** as primeiras versões de `bear` e `number-1` vieram do
> sketchjoy.com com fundos decorativos (sol, nuvens, árvores, blocos) que
> geraram 40-66 regiões coloríveis e atrapalharam a experiência. As versões
> finais usam line art simples (apenas o sujeito principal). **Para imagens
> didáticas, prefira fontes minimalistas — menos é mais.**
>
> **Resolução importa:** o George Pig veio em 267x189 (muito baixo) e os
> contornos do SVG ficaram tremidos. Buscar PNGs ≥ 600px sempre que possível.
>
> **Workaround para fontes pequenas:** quando não há fonte de alta resolução
> disponível, fazer upscale 4x via `cv2.resize(..., INTER_CUBIC)` seguido de
> `cv2.threshold(..., OTSU)` antes de rodar o script reduz drasticamente o
> desalinhamento entre regiões coloríveis e line art (usado em `george-pig`
> e `papai-pig`).

> Os 2 papagaio (`parrot`) e tartaruga (`turtle`) anteriores foram adicionados
> durante o desenvolvimento do próprio script — fontes em `image-cache` local.

## Aviso sobre direitos autorais (IP)

**Personagens com IP** (Peppa Pig, Bluey, Mickey Mouse, Numberblocks, etc) são
propriedade de seus respectivos detentores (Entertainment One, BBC, Disney…).
O uso destas imagens é considerado **uso pessoal/educacional** apenas.

⚠️ **Se este app for distribuído publicamente ou comercializado**, todas as
imagens com IP devem ser substituídas por:
- Personagens em domínio público (Pinocchio, Cinderela, Chapeuzinho Vermelho…)
- Personagens originais
- Categorias seguras (animais genéricos, letras, números, natureza, formas)

Imagens de sites como `sketchjoy.com`, `creativecolorlab.com`, `woojr.com`
são tipicamente publicadas para uso pessoal/educacional gratuito — verificar
termos de uso antes de qualquer publicação comercial.

## Como adicionar mais imagens

Use o prompt reutilizável: [`docs/prompts/add-coloring-image.md`](./prompts/add-coloring-image.md)

Cole-o no Claude (Claude Code, Claude.ai, etc) preenchendo os placeholders
e ele executa todo o pipeline.

Checklist manual (caso prefira fazer sozinho):

- [ ] Imagem-fonte casa com os critérios de qualidade
- [ ] PNG salvo em `/tmp/coloring-source/<id>.png`
- [ ] Watermark/moldura cropados (se aplicável)
- [ ] Script rodado com `--id`, `--name`, `--color` corretos
- [ ] Preview gerado via `qlmanage` e validado visualmente
- [ ] Aria-label adicionado em `src/components/DrawingCard.tsx`
- [ ] Entrada nesta tabela atualizada com a URL da fonte
- [ ] `pnpm dev` testado: galeria mostra o card, coloring page funciona

### Cores crayon disponíveis

Defininidas em `src/index.css`. Alterne para variar:
`crayon-blue`, `crayon-red`, `crayon-yellow`, `crayon-purple`, `crayon-green`, `crayon-orange`

## Limitações conhecidas

- **IDs `region-N`**: o script gera IDs genéricos (`bear-region-1`, `bear-region-2`…).
  Para imagens com poucas regiões (letras, números) é fácil renomear; para imagens
  complexas (animais, personagens) com 30+ regiões pode não compensar.
  O app aceita qualquer `path[id]` — IDs genéricos funcionam normalmente.
- **Moldura externa**: imagens SketchJoy têm uma moldura retangular interna que vira
  uma região colorível indesejada. Cropar antes de processar.
- **Letras/números pequenos**: se a imagem tem < 300px, usar `--min-area 30`
  para capturar regiões pequenas (default 50).
- **Validação visual é manual**: o script gera SVG sem erros, mas só o ser humano
  valida se "parece um urso". Não há testes automatizados de qualidade.
