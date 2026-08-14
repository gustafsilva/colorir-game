#!/usr/bin/env python3
"""
Converte um line art PNG/JPG em um SVG colorível compatível com o app.

Detecta automaticamente regiões internas fechadas via OpenCV (connected
components no fundo branco) e gera um <path> colorível para cada uma com
IDs genéricos `{drawing-id}-region-N`. O usuário deve renomear esses IDs
manualmente para nomes semânticos (ex: parrot-body, parrot-wing).

Uso:
    python convert_to_coloring.py \\
        --input ~/Downloads/parrot.png \\
        --id parrot \\
        --name papagaio \\
        --color crayon-yellow
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Sequence

import cv2
import numpy as np


VALID_COLORS = {
    "crayon-blue",
    "crayon-red",
    "crayon-yellow",
    "crayon-purple",
    "crayon-green",
    "crayon-orange",
}

VIEWBOX_SIZE = 400
PADDING_FACTOR = 0.95
APPROX_EPSILON = 1.0
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
SVG_DIR = PROJECT_ROOT / "src" / "assets" / "svg"
DRAWINGS_TS = PROJECT_ROOT / "src" / "data" / "drawings.ts"
SVG_CONTENT_TS = PROJECT_ROOT / "src" / "data" / "drawingSvgContent.ts"

ID_RE = re.compile(r"^[a-z][a-z0-9-]*[a-z0-9]$")


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Converte PNG/JPG line art em SVG colorível."
    )
    parser.add_argument("--input", required=True, type=Path, help="PNG ou JPG de entrada")
    parser.add_argument("--id", required=True, help="ID único (lowercase, kebab-case): ex parrot")
    parser.add_argument("--name", required=True, help="Nome em português (ex: papagaio)")
    parser.add_argument(
        "--color",
        required=True,
        choices=sorted(VALID_COLORS),
        help="Cor de borda crayon",
    )
    parser.add_argument(
        "--min-area",
        type=int,
        default=50,
        help="Área mínima de região colorível em pixels² no espaço da imagem original (default: 50)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Sobrescrever SVG e re-registrar mesmo se ID já existe",
    )
    return parser.parse_args(argv)


def kebab_to_camel(s: str) -> str:
    parts = s.split("-")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def ts_object_key(s: str) -> str:
    """IDs com hífen viram chaves quoted em TS — `"foo-bar"` em vez de `foo-bar`."""
    return f'"{s}"' if "-" in s else s


def validate_inputs(args: argparse.Namespace) -> None:
    if not ID_RE.match(args.id):
        sys.exit(f"✗ ID inválido: '{args.id}'. Use lowercase, kebab-case (ex: parrot, blue-bird)")
    if not args.input.exists():
        sys.exit(f"✗ Arquivo não encontrado: {args.input}")
    if args.input.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
        sys.exit(f"✗ Formato não suportado: {args.input.suffix}. Use PNG ou JPG.")


def load_binary(path: Path) -> np.ndarray:
    img = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if img is None:
        sys.exit(f"✗ Não foi possível decodificar a imagem: {path}")
    img = cv2.medianBlur(img, 3)
    _, binary = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary


def find_colorable_regions(binary: np.ndarray, min_area: int) -> list[np.ndarray]:
    """Detecta regiões internas fechadas (componentes brancos que não tocam a borda)."""
    h, w = binary.shape
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        binary, connectivity=4
    )

    regions: list[np.ndarray] = []
    for i in range(1, num_labels):  # 0 é o fundo (linha preta no nosso caso)
        x, y, ww, hh, area = stats[i]
        if area < min_area:
            continue
        if x == 0 or y == 0 or x + ww >= w or y + hh >= h:
            continue
        if area >= 0.95 * h * w:
            continue
        mask = (labels == i).astype(np.uint8) * 255
        contours, _ = cv2.findContours(
            mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_KCOS
        )
        if not contours:
            continue
        biggest = max(contours, key=cv2.contourArea)
        smoothed = cv2.approxPolyDP(biggest, APPROX_EPSILON, closed=True)
        if len(smoothed) >= 3:
            regions.append(smoothed.reshape(-1, 2))
    return regions


def region_center_is_outside(region: np.ndarray) -> bool:
    """True quando o centro do bounding box do path cai fora do próprio
    polígono — regiões côncavas (faixas curvas, contornos em "C") onde o
    toque no centro visual da criança não acerta a região (BUG-05 em
    docs/bugs.md). Não bloqueia nada: a região continua colorível por
    outros pontos, é só um sinal para revisão manual na curadoria."""
    x, y, w, h = cv2.boundingRect(region)
    center = (x + w / 2, y + h / 2)
    contour = region.reshape(-1, 1, 2).astype(np.float32)
    return cv2.pointPolygonTest(contour, center, False) < 0


def find_lineart_contours(binary: np.ndarray) -> list[np.ndarray]:
    """Pega todos os blobs pretos (linha) como contornos, incluindo buracos
    internos, para que `fill-rule="evenodd"` deixe o interior transparente
    (caso contrário o line art seria preenchido como silhueta sólida)."""
    inverted = cv2.bitwise_not(binary)
    contours, _ = cv2.findContours(
        inverted, cv2.RETR_LIST, cv2.CHAIN_APPROX_TC89_KCOS
    )
    out: list[np.ndarray] = []
    for c in contours:
        if cv2.contourArea(c) < 5:
            continue
        smoothed = cv2.approxPolyDP(c, APPROX_EPSILON, closed=True)
        if len(smoothed) >= 3:
            out.append(smoothed.reshape(-1, 2))
    return out


def compute_transform(
    all_points: list[np.ndarray],
) -> tuple[float, float, float]:
    """Retorna (scale, tx, ty) que mapeia o conteúdo para o viewBox 400x400."""
    if not all_points:
        sys.exit("✗ Nenhum conteúdo detectado para gerar SVG")
    stacked = np.vstack(all_points)
    min_xy = stacked.min(axis=0)
    max_xy = stacked.max(axis=0)
    w = max(max_xy[0] - min_xy[0], 1)
    h = max(max_xy[1] - min_xy[1], 1)
    scale = min(VIEWBOX_SIZE / w, VIEWBOX_SIZE / h) * PADDING_FACTOR
    cx = (min_xy[0] + max_xy[0]) / 2
    cy = (min_xy[1] + max_xy[1]) / 2
    tx = VIEWBOX_SIZE / 2 - cx * scale
    ty = VIEWBOX_SIZE / 2 - cy * scale
    return scale, tx, ty


def points_to_path_d(
    points: np.ndarray, scale: float, tx: float, ty: float
) -> str:
    """Converte uma sequência de pontos em string SVG path data fechada."""
    parts: list[str] = []
    for i, (x, y) in enumerate(points):
        nx = x * scale + tx
        ny = y * scale + ty
        cmd = "M" if i == 0 else "L"
        parts.append(f"{cmd}{nx:.2f},{ny:.2f}")
    parts.append("Z")
    return " ".join(parts)


def build_svg(
    drawing_id: str,
    regions: list[np.ndarray],
    lineart: list[np.ndarray],
    scale: float,
    tx: float,
    ty: float,
) -> str:
    lines: list[str] = []
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEWBOX_SIZE} {VIEWBOX_SIZE}">')
    lines.append(f"  <!-- {drawing_id}: gerado por scripts/convert_to_coloring.py -->")
    lines.append("  <!-- Renomeie os IDs region-N para nomes semânticos (ex: -body, -wing) -->")
    lines.append("")
    lines.append("  <!-- Regiões coloríveis -->")
    for i, region in enumerate(regions, start=1):
        d = points_to_path_d(region, scale, tx, ty)
        lines.append(
            f'  <path id="{drawing_id}-region-{i}" d="{d}" '
            f'fill="#FFFFFF" stroke="#4a4a4a" stroke-width="3" '
            f'stroke-linejoin="round" stroke-linecap="round"/>'
        )
    lines.append("")
    lines.append("  <!-- Line art (não colorível) -->")
    if lineart:
        d_combined = " ".join(points_to_path_d(c, scale, tx, ty) for c in lineart)
        lines.append(
            f'  <path d="{d_combined}" fill="#4a4a4a" fill-rule="evenodd"/>'
        )
    lines.append("</svg>")
    lines.append("")
    return "\n".join(lines)


def _insert_after_last_import(text: str, query: str, new_import: str) -> str:
    """Adiciona `new_import` em uma nova linha após o último import que casa `query`."""
    matches = list(re.finditer(query, text))
    if not matches:
        sys.exit(f"✗ Não encontrei imports correspondentes para inserir: {query!r}")
    last = matches[-1]
    end = last.end()
    # avança até depois do \n que termina a linha
    if end < len(text) and text[end] == "\n":
        end += 1
    return text[:end] + new_import + "\n" + text[end:]


def _insert_before_closing(
    text: str,
    decl_marker: str,
    opener: str,
    closer: str,
    new_line: str,
) -> str:
    """Insere `new_line` (com indentação) antes do `closer` que fecha o bloco
    iniciado por `opener` após `decl_marker`."""
    decl_idx = text.find(decl_marker)
    if decl_idx == -1:
        sys.exit(f"✗ Marker não encontrado: {decl_marker!r}")
    open_idx = text.find(opener, decl_idx)
    if open_idx == -1:
        sys.exit(f"✗ Opener '{opener}' não encontrado após marker {decl_marker!r}")
    # Procura o `closer` correspondente assumindo que não há aninhamento do mesmo par
    # dentro do bloco (válido para os manifests que editamos).
    close_idx = text.find(closer, open_idx + 1)
    if close_idx == -1:
        sys.exit(f"✗ Closer '{closer}' não encontrado após opener '{opener}'")
    return text[:close_idx] + new_line + "\n" + text[close_idx:]


def insert_into_drawings_ts(drawing_id: str, name: str, color: str) -> None:
    text = DRAWINGS_TS.read_text()
    var = f"{kebab_to_camel(drawing_id)}Svg"

    if f'id: "{drawing_id}"' in text or f'"@/assets/svg/{drawing_id}.svg' in text:
        sys.exit(
            f"✗ Já existe entrada para '{drawing_id}' em drawings.ts. "
            f"Remova manualmente ou use --force."
        )

    text = _insert_after_last_import(
        text,
        r'import \w+ from "@/assets/svg/[^"]+\.svg\?url"',
        f'import {var} from "@/assets/svg/{drawing_id}.svg?url"',
    )
    text = _insert_before_closing(
        text,
        decl_marker="export const drawings",
        opener="= [",
        closer="]",
        new_line=f'  {{ id: "{drawing_id}", name: "{name}", svgPath: {var} }},',
    )
    text = _insert_before_closing(
        text,
        decl_marker="export const drawingColors",
        opener="= {",
        closer="}",
        new_line=f'  {ts_object_key(drawing_id)}: "{color}",',
    )

    DRAWINGS_TS.write_text(text)


def insert_into_svg_content_ts(drawing_id: str) -> None:
    text = SVG_CONTENT_TS.read_text()
    var = f"{kebab_to_camel(drawing_id)}Svg"

    if f'"@/assets/svg/{drawing_id}.svg' in text or f"\n  {drawing_id}:" in text:
        sys.exit(f"✗ Já existe entrada para '{drawing_id}' em drawingSvgContent.ts.")

    text = _insert_after_last_import(
        text,
        r'import \w+ from "@/assets/svg/[^"]+\.svg\?raw"',
        f'import {var} from "@/assets/svg/{drawing_id}.svg?raw"',
    )
    text = _insert_before_closing(
        text,
        decl_marker="export const drawingSvgContent",
        opener="= {",
        closer="}",
        new_line=f"  {ts_object_key(drawing_id)}: {var},",
    )

    SVG_CONTENT_TS.write_text(text)


def remove_existing_registration(drawing_id: str) -> None:
    """Remove entradas anteriores nos manifests (para --force)."""
    var = f"{kebab_to_camel(drawing_id)}Svg"

    for ts_file in (DRAWINGS_TS, SVG_CONTENT_TS):
        text = ts_file.read_text()
        text = re.sub(
            rf'^import {var} from "@/assets/svg/{drawing_id}\.svg\?(?:url|raw)"\n',
            "",
            text,
            flags=re.MULTILINE,
        )
        text = re.sub(
            rf'^\s*\{{ id: "{drawing_id}", .* \}},\n',
            "",
            text,
            flags=re.MULTILINE,
        )
        text = re.sub(
            rf'^\s*"?{re.escape(drawing_id)}"?: .*,\n',
            "",
            text,
            flags=re.MULTILINE,
        )
        ts_file.write_text(text)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    validate_inputs(args)

    print(f"→ Carregando {args.input.name}...")
    binary = load_binary(args.input)
    h, w = binary.shape
    print(f"  imagem: {w}x{h}")

    regions = find_colorable_regions(binary, args.min_area)
    print(f"→ Detectadas {len(regions)} regiões coloríveis (área ≥ {args.min_area}px²)")
    if not regions:
        print("⚠ Nenhuma região colorível detectada. A imagem precisa ter regiões")
        print("  brancas internas claramente fechadas pelo line art preto.")
        print("  Tente diminuir --min-area ou usar uma imagem com line art mais limpo.")
        return 1

    concave = [i for i, r in enumerate(regions, start=1) if region_center_is_outside(r)]
    if concave:
        ids = ", ".join(f"{args.id}-region-{i}" for i in concave)
        print(f"⚠ {len(concave)} região(ões) côncava(s), revisar na curadoria: {ids}")
        print("  O centro do bbox cai fora do path — toque no meio visual pode não")
        print("  acertar (BUG-05 em docs/bugs.md). Continuam coloríveis por outros")
        print("  pontos; não bloqueia a conclusão do desenho.")

    lineart = find_lineart_contours(binary)
    print(f"→ Detectados {len(lineart)} contornos de line art")

    scale, tx, ty = compute_transform(regions + lineart)
    svg = build_svg(args.id, regions, lineart, scale, tx, ty)

    out_path = SVG_DIR / f"{args.id}.svg"
    if out_path.exists() and not args.force:
        sys.exit(f"✗ Já existe {out_path.relative_to(PROJECT_ROOT)}. Use --force para sobrescrever.")

    if args.force:
        remove_existing_registration(args.id)

    SVG_DIR.mkdir(parents=True, exist_ok=True)
    backup_drawings = DRAWINGS_TS.read_text()
    backup_content = SVG_CONTENT_TS.read_text()
    try:
        out_path.write_text(svg)
        insert_into_drawings_ts(args.id, args.name, args.color)
        insert_into_svg_content_ts(args.id)
    except SystemExit:
        DRAWINGS_TS.write_text(backup_drawings)
        SVG_CONTENT_TS.write_text(backup_content)
        if out_path.exists():
            out_path.unlink()
        raise
    except Exception as e:
        DRAWINGS_TS.write_text(backup_drawings)
        SVG_CONTENT_TS.write_text(backup_content)
        if out_path.exists():
            out_path.unlink()
        sys.exit(f"✗ Falha ao registrar nos manifests: {e}")

    print()
    print(f"✓ SVG gerado: {out_path.relative_to(PROJECT_ROOT)}")
    print(f"✓ Registrado em: src/data/drawings.ts e src/data/drawingSvgContent.ts")
    print()
    print("Próximo passo (manual):")
    print(f"  1. Abra {out_path.relative_to(PROJECT_ROOT)}")
    print(f"  2. Renomeie {args.id}-region-1..{len(regions)} para nomes semânticos")
    print(f"     (ex: {args.id}-body, {args.id}-wing, {args.id}-eye-area)")
    print(f"  3. Rode `pnpm dev` e abra /coloring/{args.id} pra testar")
    return 0


if __name__ == "__main__":
    sys.exit(main())
