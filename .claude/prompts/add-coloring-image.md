# Prompt: adicionar nova imagem ao catálogo

> Cole este prompt no Claude (Claude Code, Claude.ai, etc) preenchendo os
> placeholders abaixo. O Claude executa todo o pipeline: busca, baixa,
> converte, registra e testa.

---

## Como usar

1. Substitua os placeholders entre `{{ }}` no prompt abaixo
2. Cole o prompt inteiro no Claude
3. O Claude vai executar os passos automaticamente
4. Quando ele terminar, rode `pnpm dev` e abra `/coloring/{{ID}}` para validar

### Placeholders

| Placeholder      | Descrição                                                        | Exemplo            |
| ---------------- | ---------------------------------------------------------------- | ------------------ |
| `{{ID}}`         | ID kebab-case (lowercase, hífens)                                | `elephant`         |
| `{{NOME}}`       | Nome em português para exibição na galeria                       | `elefante`         |
| `{{CATEGORIA}}`  | Categoria (apenas para o doc): animais, números, letras, etc     | `animais`          |
| `{{COR}}`        | Cor crayon — alterne entre as 6 disponíveis                      | `crayon-blue`      |
| `{{ASSUNTO_EN}}` | Termo em inglês para a busca (resultados melhores)               | `cute elephant`    |

### Cores crayon válidas

`crayon-blue` · `crayon-red` · `crayon-yellow` · `crayon-purple` · `crayon-green` · `crayon-orange`

Tente alternar — se já tem 3 imagens com `crayon-blue`, escolha outra.

---

## Prompt (copie tudo abaixo)

```text
Tarefa: adicionar uma nova imagem ao catálogo de imagens para colorir do app
colorir-game, seguindo o workflow documentado em docs/coloring-catalog.md.

Parâmetros:
- ID: {{ID}}
- Nome (PT-BR): {{NOME}}
- Categoria: {{CATEGORIA}}
- Cor crayon: {{COR}}
- Termo de busca (EN): {{ASSUNTO_EN}}

Passos:

1. BUSCAR a imagem na internet:
   - WebSearch com query: "{{ASSUNTO_EN}} coloring page line art simple png"
   - Se necessário, refinar a query com termos como "cute", "kawaii", "bubble", "outline"
   - WebFetch nas páginas mais promissoras (sketchjoy.com, creativecolorlab.com,
     mondaymandala.com, woojr.com — esses costumam ter URLs diretas de PNG/WEBP).
   - Critérios de aceite (ler docs/coloring-catalog.md):
     - line art preto sólido sobre fundo branco
     - sem watermark grande na área central, sem gradientes/sombras
     - regiões internas claramente fechadas
     - PNG/JPG/WEBP (WEBP precisa converter)
   - Se nenhuma fonte casar com os critérios, PARAR e reportar — não tente
     "consertar" line art ruim.

2. BAIXAR via curl:
   mkdir -p /tmp/coloring-source
   curl -sL -A 'Mozilla/5.0' -o /tmp/coloring-source/{{ID}}.<ext> '<url>'

3. CONVERTER para PNG se necessário (sips no macOS):
   sips -s format png /tmp/coloring-source/{{ID}}.<ext> --out /tmp/coloring-source/{{ID}}.png

4. INSPECIONAR o PNG (Read tool aceita PNG diretamente). Verificar:
   - line art limpo
   - tem watermark ou moldura externa? Se sim, cropar:
     source scripts/.venv/bin/activate
     python3 -c "
     import cv2
     img = cv2.imread('/tmp/coloring-source/{{ID}}.png')
     h, w = img.shape[:2]
     out = img[<top>:h-<bottom>, <left>:w-<right>]   # ajustar pixels
     cv2.imwrite('/tmp/coloring-source/{{ID}}-cropped.png', out)
     "

5. CONVERTER para SVG colorível:
   cd scripts && source .venv/bin/activate
   python convert_to_coloring.py \
     --input /tmp/coloring-source/{{ID}}-cropped.png \
     --id {{ID}} --name "{{NOME}}" --color {{COR}}

   Se for letra/número pequeno (<300px) e detectar 0 regiões: rodar de novo com --min-area 30.

6. PREVIEW visual:
   mkdir -p /tmp/svg-preview
   qlmanage -t -s 800 -o /tmp/svg-preview src/assets/svg/{{ID}}.svg
   # Read /tmp/svg-preview/{{ID}}.svg.png — confirmar que parece o desenho original.

7. ADICIONAR aria-label em src/components/DrawingCard.tsx:
   No mapa `ariaLabels` (depois das entradas existentes), adicionar:
     "{{ID}}": "Colorir o(a) {{NOME}}",
   Use "o" ou "a" gramaticalmente correto para o substantivo.

8. ATUALIZAR a tabela em docs/coloring-catalog.md (seção "Catálogo inicial"):
   Adicionar uma linha com: ID, NOME, CATEGORIA, COR, query usada, URL da fonte.

9. VALIDAR typecheck:
   pnpm tsc -b   # deve sair com exit 0

10. REPORTAR ao usuário:
    - O ID, número de regiões coloríveis detectadas
    - Mostrar o preview do SVG (Read tool)
    - Pedir para o usuário rodar pnpm dev e abrir /coloring/{{ID}}
    - Mencionar se a renomeação manual de IDs `{{ID}}-region-N` para nomes
      semânticos vale a pena (recomendar só se < 10 regiões)

Restrições:
- Use o script scripts/convert_to_coloring.py existente — NÃO modificá-lo.
- Apenas os arquivos listados nos passos podem ser editados; não toque em
  outras partes do app.
- Se a busca retornar imagens com copyright (personagens famosos, logos,
  marcas), avisar ao usuário sobre o risco antes de prosseguir.
- Se algo falhar de forma irrecuperável (URL 404, line art muito ruim,
  script erra), reverter os manifests com:
    git checkout src/data/drawings.ts src/data/drawingSvgContent.ts
  e reportar o erro ao usuário sem deixar arquivos quebrados.
```

---

## Exemplo preenchido

```text
Parâmetros:
- ID: elephant
- Nome (PT-BR): elefante
- Categoria: animais
- Cor crayon: crayon-blue
- Termo de busca (EN): cute elephant
```

E o resto do prompt acima. O Claude faz o trabalho.
