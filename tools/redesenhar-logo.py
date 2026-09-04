#!/usr/bin/env python3
"""
tools/redesenhar-logo.py

Redesenha a marca com curvas autoradas, em vez de seguir o contorno
pixel a pixel.

Diferenca para tools/vetorizar-logo.py: aquele decimava a poligonal do
contorno com Douglas-Peucker e ligava os pontos com Catmull-Rom, o que
preserva a forma mas herda a ondulacao do JPEG de origem -- 754 pontos
seguindo ruido de compressao. Este ajusta Beziers cubicas por minimos
quadrados com subdivisao adaptativa (Schneider), a mesma coisa que uma
ferramenta de traco faz: poucos segmentos, tangentes continuas, curva
lisa por construcao.

Uso:   python tools/redesenhar-logo.py
Saida: assets/logo.svg + relatorio de fidelidade e de economia de nos
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
RECORTE = (402, 152, 603, 293)
TERRA = "#B86657"
ESCALA = 10


def mascara(sigma=2.5):
    crop = Image.open(CARTAO).convert("RGB").crop(RECORTE)
    big = crop.resize((crop.width * ESCALA, crop.height * ESCALA), Image.LANCZOS)
    a = np.asarray(big).astype(float)
    alpha = np.clip((a[:, :, 0] - a[:, :, 2] - 10.0) / 35.0, 0, 1) ** 0.85
    alpha = nd.median_filter(alpha, size=3)
    alpha = nd.gaussian_filter(alpha, sigma=sigma)
    alpha = np.clip((alpha - 0.25) / 0.50, 0, 1)
    # So o componente principal. As lascas que sobram sao as pontas das
    # asas, estranguladas pela suavizacao e soltas do corpo -- 175 e 294
    # px nesta escala, menos de 3 px^2 do cartao original. Tentei
    # reconectar baixando o corte e com fechamento morfologico: nenhuma
    # combinacao junta as pontas sem trazer ruido de JPEG junto. Soltas,
    # em tamanho de banner, leriam como sujeira.
    rot, n = nd.label(alpha > 0.35)
    if n:
        tam = nd.sum(np.ones_like(rot), rot, range(1, n + 1))
        alpha = alpha * (rot == (int(np.argmax(tam)) + 1))
    return alpha


# ---------------------------------------------------------------- contorno

def contornos(alpha):
    fig = plt.figure()
    cs = plt.contour(alpha, levels=[0.5])
    aneis = []
    for caminho in cs.get_paths():
        for poly in caminho.to_polygons():
            if len(poly) >= 12:
                aneis.append(poly[:-1] if np.allclose(poly[0], poly[-1]) else poly)
    plt.close(fig)
    return aneis


def reamostrar(pts, passo=2.0):
    """Reamostra o anel fechado a passo constante de arco."""
    p = np.vstack([pts, pts[:1]])
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]
    if d[-1] < passo * 4:
        return pts
    n = max(8, int(d[-1] / passo))
    u = np.linspace(0, d[-1], n, endpoint=False)
    return np.c_[np.interp(u, d, p[:, 0]), np.interp(u, d, p[:, 1])]


def suavizar(pts, sigma):
    """Gaussiana periodica sobre as coordenadas: tira a ondulacao do JPEG
    sem deslocar a forma, porque o filtro e simetrico."""
    return np.c_[nd.gaussian_filter1d(pts[:, 0], sigma, mode="wrap"),
                 nd.gaussian_filter1d(pts[:, 1], sigma, mode="wrap")]


# ---------------------------------------------------- ajuste de Bezier

def _bezier(c, t):
    mt = 1 - t
    return (mt ** 3)[:, None] * c[0] + (3 * mt ** 2 * t)[:, None] * c[1] + \
           (3 * mt * t ** 2)[:, None] * c[2] + (t ** 3)[:, None] * c[3]


def _param(pts):
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(pts, axis=0).T))]
    return d / d[-1] if d[-1] > 0 else np.linspace(0, 1, len(pts))


def _ajustar1(pts, t, t1, t2):
    """Least squares para as duas distancias de controle (Schneider)."""
    mt = 1 - t
    A1 = (3 * mt ** 2 * t)[:, None] * t1
    A2 = (3 * mt * t ** 2)[:, None] * t2
    base = (mt ** 3)[:, None] * pts[0] + (t ** 3)[:, None] * pts[-1]
    R = pts - base
    c11 = (A1 * A1).sum(); c12 = (A1 * A2).sum(); c22 = (A2 * A2).sum()
    x1 = (A1 * R).sum(); x2 = (A2 * R).sum()
    det = c11 * c22 - c12 * c12
    if abs(det) < 1e-12:
        seg = np.hypot(*(pts[-1] - pts[0])) / 3.0
        a1 = a2 = seg
    else:
        a1 = (x1 * c22 - c12 * x2) / det
        a2 = (c11 * x2 - x1 * c12) / det
        lim = np.hypot(*(pts[-1] - pts[0]))
        if not (1e-6 < a1 < lim * 2): a1 = lim / 3.0
        if not (1e-6 < a2 < lim * 2): a2 = lim / 3.0
    return np.array([pts[0], pts[0] + t1 * a1, pts[-1] + t2 * a2, pts[-1]])


def _tangente(pts, i, janela=4):
    a = pts[max(0, i - janela)]
    b = pts[min(len(pts) - 1, i + janela)]
    v = b - a
    n = np.hypot(*v)
    return v / n if n > 1e-9 else np.array([1.0, 0.0])


def ajustar(pts, t1, t2, tol, prof=0):
    """Uma cubica; se o erro passar da tolerancia, parte no pior ponto."""
    if len(pts) < 3:
        seg = np.hypot(*(pts[-1] - pts[0])) / 3.0
        return [np.array([pts[0], pts[0] + t1 * seg, pts[-1] + t2 * seg, pts[-1]])]
    t = _param(pts)
    c = _ajustar1(pts, t, t1, t2)
    err = np.hypot(*(_bezier(c, t) - pts).T)
    i = int(np.argmax(err))
    if err[i] <= tol or prof > 14 or i == 0 or i == len(pts) - 1:
        return [c]
    tc = _tangente(pts, i)
    return (ajustar(pts[: i + 1], t1, -tc, tol, prof + 1) +
            ajustar(pts[i:], tc, t2, tol, prof + 1))


def anel_para_bezier(pts, tol):
    """Fecha o anel partindo no ponto de maior curvatura, para que a
    emenda caia num canto natural em vez de no meio de uma curva."""
    # Sigma alto de proposito. Com 3.0 o ajuste seguia o contorno pixel
    # a pixel e herdava a ondulacao da compressao do JPEG: a curva
    # tinha IoU otimo e desenho ruim. O alvo aqui e curva lisa, nao
    # fidelidade de ruido.
    p = suavizar(reamostrar(pts), sigma=18.0)
    n = len(p)
    if n < 6:
        return None, 0
    v1 = p - np.roll(p, 1, axis=0)
    v2 = np.roll(p, -1, axis=0) - p
    ang = np.abs(np.arctan2(v1[:, 0] * v2[:, 1] - v1[:, 1] * v2[:, 0],
                            (v1 * v2).sum(axis=1)))
    k = int(np.argmax(nd.gaussian_filter1d(ang, 2.0, mode="wrap")))
    p = np.roll(p, -k, axis=0)
    fechado = np.vstack([p, p[:1]])
    t1 = _tangente(fechado, 0)
    t2 = -_tangente(fechado, len(fechado) - 1)
    curvas = ajustar(fechado, t1, t2, tol)
    d = [f"M{curvas[0][0][0]:.2f},{curvas[0][0][1]:.2f}"]
    for c in curvas:
        d.append(f"C{c[1][0]:.2f},{c[1][1]:.2f} {c[2][0]:.2f},{c[2][1]:.2f} "
                 f"{c[3][0]:.2f},{c[3][1]:.2f}")
    d.append("Z")
    return "".join(d), len(curvas)


def main():
    alpha = mascara()
    h, w = alpha.shape
    aneis = contornos(alpha)
    # Tolerancia folgada pelo mesmo motivo: menos segmentos, curva mais
    # limpa. De 3,2 para 22 os segmentos caem de 436 para 98.
    TOL = 22.0
    partes, nos = [], 0
    for anel in aneis:
        d, n = anel_para_bezier(anel, TOL)
        if d:
            partes.append(d)
            nos += n
    print(f"  contornos: {len(aneis)} · segmentos de Bezier: {nos}")

    vb_w, vb_h = w / ESCALA, h / ESCALA
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" '
           f'viewBox="0 0 {vb_w:.2f} {vb_h:.2f}" '
           f'width="{vb_w:.2f}" height="{vb_h:.2f}" role="img" '
           f'aria-label="Marca Vanessa Fernandes">'
           f'<g transform="scale({1/ESCALA:.6f})">'
           f'<path d="{" ".join(partes)}" fill="{TERRA}" fill-rule="evenodd"/>'
           f'</g></svg>')
    destino = os.path.join(RAIZ, "assets", "logo.svg")
    with io.open(destino, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"  assets/logo.svg: {os.path.getsize(destino)} bytes")
    return alpha


if __name__ == "__main__":
    main()
