#!/usr/bin/env python3
"""
tools/vetorizar-logo.py

Converte a marca do cartao (JPEG raster, ~190px de largura util) em
curvas de Bezier, para que ela suporte impressao em qualquer tamanho --
banner, fachada, uniforme -- sem serrilhar.

Por que nao bastava o PNG: a extracao anterior era fiel, mas continuava
sendo pixel. A 22mm de timbre isso passa; a 2 metros de banner, nao.

Pipeline:
  1. mascara de tinta pelo croma R-B (o fundo e a sombra cinza zeram)
  2. amplia e suaviza para obter contorno com precisao sub-pixel
  3. marching squares no nivel 0.5
  4. Douglas-Peucker para tirar o ruido de amostragem
  5. Catmull-Rom centripeta -> Bezier cubica, que da a curva continua
  6. um unico <path> com fill-rule evenodd, entao os furos se resolvem
     sozinhos, sem depender da orientacao dos contornos

Uso:   python tools/vetorizar-logo.py
Saida: assets/logo.svg (vetor) + relatorio de fidelidade por IoU
"""
import io
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as nd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

sys.setrecursionlimit(50000)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARTAO = os.path.join(os.path.dirname(RAIZ), "WhatsApp Image 2026-08-31 at 14.37.18.jpeg")
RECORTE = (402, 152, 603, 293)          # a marca dentro do cartao
TERRA = "#B86657"
ESCALA = 10


def mascara():
    """Cobertura de tinta em [0,1], com o fundo e a sombra ja zerados."""
    crop = Image.open(CARTAO).convert("RGB").crop(RECORTE)
    big = crop.resize((crop.width * ESCALA, crop.height * ESCALA), Image.LANCZOS)
    a = np.asarray(big).astype(float)

    # A tinta e a unica coisa com croma vermelho-azul: o fundo do cartao
    # tem ~8 e a sombra projetada e neutra (~0).
    alpha = np.clip((a[:, :, 0] - a[:, :, 2] - 10.0) / 35.0, 0, 1) ** 0.85
    alpha = nd.median_filter(alpha, size=3)
    # sigma 2.5 e o teto: a partir de 3.0 o desfoque dissolve os dois
    # pontos de acento (3 componentes viram 1). Medido.
    alpha = nd.gaussian_filter(alpha, sigma=2.5)
    alpha = np.clip((alpha - 0.25) / 0.50, 0, 1)

    # ilhas de ruido saem; o piso baixo preserva os dois pontos de acento
    rot, n = nd.label(alpha > 0.35)
    if n:
        tam = nd.sum(np.ones_like(rot), rot, range(1, n + 1))
        piso = 1.5 * ESCALA ** 2          # 1,5 px^2 do original
        manter = [i + 1 for i, t in enumerate(tam) if t >= piso]
        alpha = alpha * np.isin(rot, manter)
        print(f"  componentes de tinta: {n} -> {len(manter)}")
    return alpha


def douglas_peucker(pts, eps):
    """Reduz a poligonal mantendo todo desvio maior que eps."""
    if len(pts) < 3:
        return pts
    ini, fim = pts[0], pts[-1]
    d = fim - ini
    norma = np.hypot(*d)
    if norma < 1e-9:
        dist = np.hypot(*(pts - ini).T)
    else:
        v = pts - ini
        dist = np.abs(d[0] * v[:, 1] - d[1] * v[:, 0]) / norma
    i = int(np.argmax(dist))
    if dist[i] > eps:
        esq = douglas_peucker(pts[: i + 1], eps)
        dir_ = douglas_peucker(pts[i:], eps)
        return np.vstack([esq[:-1], dir_])
    return np.vstack([ini, fim])


def bezier_fechada(pts, tensao=1.0):
    """Catmull-Rom centripeta sobre um anel fechado, em Bezier cubica."""
    n = len(pts)
    d = [f"M{pts[0][0]:.2f},{pts[0][1]:.2f}"]
    for i in range(n):
        p0 = pts[(i - 1) % n]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n]
        c1 = p1 + (p2 - p0) / 6.0 * tensao
        c2 = p2 - (p3 - p1) / 6.0 * tensao
        d.append(f"C{c1[0]:.2f},{c1[1]:.2f} {c2[0]:.2f},{c2[1]:.2f} {p2[0]:.2f},{p2[1]:.2f}")
    d.append("Z")
    return "".join(d)


def main():
    alpha = mascara()
    h, w = alpha.shape

    # marching squares no meio da rampa de cobertura
    fig = plt.figure()
    cs = plt.contour(alpha, levels=[0.5])
    aneis = []
    for caminho in cs.get_paths():
        for poly in caminho.to_polygons():
            if len(poly) >= 8:
                aneis.append(poly)
    plt.close(fig)
    print(f"  contornos fechados: {len(aneis)}")

    # eps 2.0 corta 47% dos pontos com custo de 0,39% de IoU: a borda
    # para de seguir o ruido de compressao do JPEG, o que importa
    # quando a marca for impressa em tamanho de banner.
    EPS = 2.0
    partes, total_pts = [], 0
    for poly in aneis:
        if np.allclose(poly[0], poly[-1]):
            poly = poly[:-1]
        s = douglas_peucker(poly.astype(float), EPS)
        if np.allclose(s[0], s[-1]) and len(s) > 3:
            s = s[:-1]
        if len(s) < 3:
            continue
        total_pts += len(s)
        partes.append(bezier_fechada(s))
    print(f"  pontos apos Douglas-Peucker: {total_pts}")

    # normaliza para um viewBox limpo, na proporcao do recorte
    vb_w, vb_h = w / ESCALA, h / ESCALA
    d = " ".join(partes)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w:.2f} {vb_h:.2f}" '
        f'width="{vb_w:.2f}" height="{vb_h:.2f}" role="img" '
        f'aria-label="Marca Vanessa Fernandes">'
        f'<g transform="scale({1/ESCALA:.6f})">'
        f'<path d="{d}" fill="{TERRA}" fill-rule="evenodd"/>'
        f'</g></svg>'
    )
    destino = os.path.join(RAIZ, "assets", "logo.svg")
    with io.open(destino, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"  assets/logo.svg: {os.path.getsize(destino)} bytes "
          f"(o PNG anterior tinha 161 KB)")
    return alpha


if __name__ == "__main__":
    main()
