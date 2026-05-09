# scripts/

Ferramentas internas (não fazem parte do bundle do app).

## convert_to_coloring.py

Converte um line art PNG/JPG em um SVG colorível compatível com o app
(`viewBox="0 0 400 400"`, paths com `id` para regiões coloríveis).

### Setup (uma vez)

```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Uso

```bash
source .venv/bin/activate  # se ainda não estiver ativo
python convert_to_coloring.py \
  --input ~/Downloads/parrot.png \
  --id parrot \
  --name papagaio \
  --color crayon-yellow
```

O script:

1. Detecta regiões internas fechadas via OpenCV (connected components).
2. Gera `src/assets/svg/<id>.svg` com `<path id="<id>-region-N">` para cada região.
3. Auto-registra a entrada em `src/data/drawings.ts` e `src/data/drawingSvgContent.ts`.

Depois você precisa **renomear manualmente** os IDs `region-1..N` no SVG
gerado para nomes semânticos (ex: `parrot-body`, `parrot-wing`,
`parrot-eye-area`). É um detalhe que nenhum algoritmo automático resolve.

### Flags

| Flag | Default | Descrição |
|---|---|---|
| `--input` | (obrigatório) | PNG ou JPG do line art |
| `--id` | (obrigatório) | ID kebab-case (ex: `parrot`, `blue-bird`) |
| `--name` | (obrigatório) | Nome em português (ex: `papagaio`) |
| `--color` | (obrigatório) | Cor de borda crayon (ver lista abaixo) |
| `--min-area` | `50` | Área mínima (px²) para uma região ser colorível |
| `--force` | off | Sobrescreve SVG e re-registra mesmo se ID já existe |

### Cores de borda válidas

- `crayon-blue`
- `crayon-red`
- `crayon-yellow`
- `crayon-purple`
- `crayon-green`
- `crayon-orange`

### Dicas de qualidade do input

- **Line art preto sólido sobre fundo branco**, sem gradientes ou sombras.
- **PNG é melhor que JPG** (sem artefatos de compressão).
- Resolução intermediária (~600–1500px) funciona bem; muito alta gera muitos pontos no path.
- Linhas precisam estar **fechadas** — se uma área tiver buraquinho na borda, vai vazar e fundir com regiões vizinhas.
- Pupilas pretas e bigodes finos viram parte do "line art" (não coloríveis), igual ao `cat.svg` original.

### Verificando o resultado

```bash
pnpm dev
# abra http://localhost:5173/coloring/<id>
```

Verifique:
- Line art aparece corretamente
- Cliques aplicam cor nas regiões
- Nada "vaza" para fora do desenho

Se uma região não está colorível ou está colorindo área errada, edite o SVG manualmente: ajuste/remova/divida o `<path id="...">` correspondente.
