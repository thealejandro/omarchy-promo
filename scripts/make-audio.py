#!/usr/bin/env python3
"""Diseño sonoro del promo: arreglo de «Limit 70» + efectos sintetizados + mezcla final.

Genera public/audio/mix-h.m4a (88,633 s) y public/audio/mix-v.m4a (45,133 s) a partir del MP3
original de Kevin MacLeod (CC BY 4.0, no se versiona). Todo es determinista: mismas entradas,
mismo resultado. Solo usa numpy, ffmpeg y rubberband.

    python3 scripts/make-audio.py "Limit 70.mp3" [--stems DIR] [--only h|v]

Qué hace, por versión:
  1. Arreglo: trocea el original en compases (102,65 BPM), estira cada sección con rubberband
     para que los golpes caigan en el fotograma exacto y las coloca en la línea de tiempo con
     cortes secos, silencios y la capa suave (piano eléctrico) en la intro, «Y uno propio» y el
     cierre.
  2. Automatización por escena: paso bajo, paso alto, estante de agudos y volumen (EQ en el
     dominio STFT, curvas suaves) + envío corto de reverb para que los cortes respiren.
  3. Efectos (síntesis propia): ticks de interfaz, soplidos, golpes graves, tono de la isla,
     soplido inverso; cada uno colocado en un fotograma concreto (tabla CUES_*).
  4. Mezcla: música a -17 LUFS, efectos por debajo, normalización final a -16 LUFS y limitador
     de pico real a -1,5 dBTP (sobremuestreo x4). Codifica AAC 256 kb/s.

Las escenas y sus fotogramas reflejan src/Promo.tsx, src/PromoVertical.tsx y src/scenes/*.
Si cambias duraciones o tiempos internos de escena, actualiza SCENES_* y CUES_* aquí.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np

SR = 48000
FPS = 60
BAR = 2.338102  # duración de un compás en el original (102,65 BPM, 4/4)
T0 = -0.0145  # primer pulso del original
BEAT = BAR / 4
OVERLAP = 14  # fotogramas de solape entre escenas (src/Promo.tsx)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def sec_of_bar(n: float) -> float:
    return n * BAR + T0


def s(x: float) -> int:  # igual que s() de src/lib.tsx
    return round(x * FPS)


def scene_starts(durs: list[tuple[str, float]]) -> dict[str, int]:
    out, t = {}, 0
    for name, d in durs:
        out[name] = t
        t += s(d) - OVERLAP
    out['_end'] = t + OVERLAP
    return out


# --- Escenas (segundos, como en los .tsx) ---------------------------------------------------
SCENES_H = scene_starts([
    ('intro', 5.5), ('once', 10.067), ('macos', 8.9), ('windows', 6.017), ('propio', 5.433),
    ('esquinas', 6.6), ('paleta', 6.583), ('barra', 5.433), ('claro', 6.017), ('isla', 4.867),
    ('vistazo', 3.117), ('abierta', 6.6), ('bordes', 3.7), ('colores', 3.7), ('cierre', 9.367),
])
SCENES_V = scene_starts([
    ('intro', 3.6), ('once', 8.917), ('macos', 5.433), ('windows', 3.7), ('propio', 3.717),
    ('isla', 3.7), ('abierta', 6.017), ('colores', 2.55), ('cierre', 9.367),
])
# Tiempos internos de Close.tsx: caja del comando, URL y firma (fotogramas desde el inicio).
CLOSE_BOX, CLOSE_URL, CLOSE_SIG = 150, 276, 346


# =============================================================================================
# Utilidades de audio
# =============================================================================================
def run(cmd: list[str]) -> str:
    r = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return r.stdout + r.stderr


def load(path: str) -> np.ndarray:
    raw = subprocess.run(
        ['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def save(path: str, x: np.ndarray, extra: list[str] | None = None) -> None:
    data = np.ascontiguousarray(x, dtype=np.float32).tobytes()
    cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-']
    cmd += extra or ['-c:a', 'pcm_f32le']
    cmd += [path]
    subprocess.run(cmd, input=data, check=True)


def db(x: float) -> float:
    return 10 ** (x / 20)


def soft(x: np.ndarray, drive: float) -> np.ndarray:
    """Saturación suave (tanh) normalizada."""
    return np.tanh(drive * x) / np.tanh(drive)


def ffilt(x: np.ndarray, fn) -> np.ndarray:
    """Filtro de fase cero por FFT para sonidos cortos: fn(f) -> ganancia lineal."""
    n = len(x)
    m = 1 << int(np.ceil(np.log2(n + 1)))
    f = np.fft.rfftfreq(m, 1 / SR)
    g = fn(np.maximum(f, 1e-3))
    X = np.fft.rfft(x, m, axis=0)
    X *= g[:, None] if x.ndim == 2 else g
    return np.fft.irfft(X, m, axis=0)[:n]


def lp_mag(f, fc, order=3):
    return 1 / np.sqrt(1 + (f / fc) ** (2 * order))


def hp_mag(f, fc, order=2):
    return 1 / np.sqrt(1 + (fc / f) ** (2 * order))


def stft_filter(x: np.ndarray, maskfn, n: int = 4096, hop: int = 1024) -> np.ndarray:
    """Filtro variable en el tiempo: maskfn(tiempos[s], f[Hz]) -> matriz (marcos x bins)."""
    win = np.hanning(n + 1)[:-1]
    L = len(x)
    xp = np.pad(x, ((n, n + hop), (0, 0)))
    F = 1 + (len(xp) - n) // hop
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = 1e-3
    y = np.zeros_like(xp)
    norm = np.zeros(len(xp))
    w2 = win ** 2
    B = 256
    for b0 in range(0, F, B):
        idx = np.arange(b0, min(F, b0 + B))
        tc = (idx * hop + n / 2 - n) / SR
        M = maskfn(tc, f)
        for ch in range(x.shape[1]):
            fr = np.stack([xp[i * hop:i * hop + n, ch] for i in idx]) * win
            Y = np.fft.rfft(fr, axis=1) * M
            yr = np.fft.irfft(Y, n, axis=1) * win
            for k, i in enumerate(idx):
                y[i * hop:i * hop + n, ch] += yr[k]
        for i in idx:
            norm[i * hop:i * hop + n] += w2
    y /= np.maximum(norm, 1e-9)[:, None]
    return y[n:n + L]


def curve(points: list[tuple[float, float]], t: np.ndarray, log: bool = False) -> np.ndarray:
    """Automatización por puntos (tiempo, valor); interpolación lineal (o logarítmica)."""
    xp = np.array([p[0] for p in points])
    fp = np.array([p[1] for p in points], dtype=float)
    # pasos: tiempos repetidos -> se separan un pelo para que np.interp los respete
    for i in range(1, len(xp)):
        if xp[i] <= xp[i - 1]:
            xp[i] = xp[i - 1] + 1e-4
    if log:
        return np.exp(np.interp(t, xp, np.log(fp)))
    return np.interp(t, xp, fp)


def make_ir(rt60: float, length: float, seed: int, damp: float = 5000, pre: float = 0.012) -> np.ndarray:
    """Respuesta al impulso sintética (sala pequeña): reflexiones tempranas + cola difusa que
    se oscurece con el tiempo. Estéreo decorrelado, energía unitaria."""
    rng = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    env = np.exp(-6.91 * t / rt60)
    bright = rng.standard_normal((n, 2))
    dark = ffilt(rng.standard_normal((n, 2)), lambda f: lp_mag(f, damp, 2))
    mixw = np.exp(-t / (rt60 * 0.18))[:, None]
    ir = (bright * mixw + dark * (1 - mixw)) * env[:, None]
    ir *= np.minimum(1, t / 0.004)[:, None]  # ataque suave de la cola
    for d, g in [(0.007, 0.5), (0.013, 0.35), (0.021, 0.3), (0.034, 0.2)]:  # tempranas
        k = int(d * SR)
        ir[k, 0] += g * rng.choice([-1, 1])
        ir[k + int(0.0013 * SR), 1] += g * rng.choice([-1, 1])
    ir = np.pad(ir, ((int(pre * SR), 0), (0, 0)))
    return ir / np.sqrt((ir ** 2).sum() / 2)


def convolve(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    n = len(x) + len(ir)
    m = 1 << int(np.ceil(np.log2(n)))
    y = np.fft.irfft(np.fft.rfft(x, m, axis=0) * np.fft.rfft(ir, m, axis=0), m, axis=0)
    return y[:len(x)]


def pan(x: np.ndarray, p: float) -> np.ndarray:
    """Mono -> estéreo con ley de potencia constante; p en [-1, 1]."""
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1) * np.sqrt(2)


def ebur128(path: str) -> dict:
    out = run(['ffmpeg', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    summ = out[out.rfind('Summary:'):]
    g = lambda k: float(re.search(k + r':\s+(-?[\d.]+|-inf)', summ).group(1).replace('-inf', '-200'))
    return {'I': g('I'), 'LRA': g('LRA'), 'TP': g('Peak')}


# =============================================================================================
# 1. Arreglo de la música
# =============================================================================================
def stretch(src: np.ndarray, a: float, b: float, tempo: float, tmp: str, pad: float = 0.4):
    """Estira src[a..b] (segundos del original) con rubberband R3. Devuelve (audio, índice de a)."""
    i0, i1 = int((a - pad) * SR), int((b + pad) * SR)
    chunk = np.zeros((i1 - i0, 2))
    lo, hi = max(0, i0), min(len(src), i1)
    chunk[lo - i0:hi - i0] = src[lo:hi]
    fi, fo = os.path.join(tmp, 'rb-in.wav'), os.path.join(tmp, 'rb-out.wav')
    save(fi, chunk)
    run(['rubberband', '-3', '-q', '-T', f'{tempo:.6f}', fi, fo])
    return load(fo), int(round(pad / tempo * SR))


def arrange(src: np.ndarray, sections: list[dict], dur: float, tmp: str) -> np.ndarray:
    """Coloca secciones de compases en la línea de tiempo.

    Cada sección: a, b (compases del original), t (inicio en el vídeo, s), tempo o 'to' (fin en
    el vídeo, s: entonces el tempo se calcula para que encaje), fin (fundido de entrada, s),
    fout (fundido de salida al final, s; 0,02 = corte seco), tail (s que sigue sonando tras b
    para fundir con la sección siguiente).
    """
    out = np.zeros((int(round(dur * SR)), 2))
    for sec in sections:
        sa, sb = sec_of_bar(sec['a']), sec_of_bar(sec['b'])
        tempo = sec.get('tempo') or (sb - sa) / (sec['to'] - sec['t'])
        y, k0 = stretch(src, sa, sb, tempo, tmp)
        body = int(round((sb - sa) / tempo * SR))
        tail = int(round(sec.get('tail', 0.0) * SR))
        seg = y[k0:k0 + body + tail].copy()
        n = len(seg)
        fin = max(1, int(sec.get('fin', 0.004) * SR))
        e = np.ones(n)
        k = np.arange(min(fin, n))
        shape = sec.get('fin_shape', 'lin')
        e[:len(k)] = (k / fin) ** 2.2 if shape == 'slow' else np.sin(np.pi / 2 * k / fin) ** 2
        if tail:  # se funde con la siguiente justo después del límite
            kk = np.arange(tail)
            e[body:body + tail] *= np.cos(np.pi / 2 * kk / tail) ** 2
        fout = int(sec.get('fout', 0) * SR)
        if fout:
            kk = np.arange(fout)
            e[body - fout:body] *= np.cos(np.pi / 2 * kk / fout) ** 2
            e[body:] = 0
        if 'decay' in sec:  # caída exponencial (acorde final)
            tt = np.arange(n) / SR
            e *= np.exp(-tt / sec['decay'])
        seg *= e[:, None]
        p = int(round(sec['t'] * SR))
        m = min(n, len(out) - p)
        out[p:p + m] += seg[:m] * db(sec.get('gain', 0))
    return out


def plan(version: str) -> dict:
    """Arreglo, automatización y golpes de cada versión (tiempos en segundos del vídeo).

    Estructura del original (8 compases: 4 en Fa# mayor, 4 en Re# menor):
      0-7 capa suave (piano eléctrico y pad) | 8-15 + percusión ligera | 16-95 tema completo
      96-103 puente suave | 104-111 + percusión ligera | 112-127 tema completo y final seco.
    """
    if version == 'h':
        SC, tempo = SCENES_H, 1.01107
        hit1 = (SC['once'] + 7) / FPS  # «Once temas.» (fotograma 323)
    else:
        SC, tempo = SCENES_V, 1.01046
        hit1 = (SC['once'] + 7) / FPS  # fotograma 209
    bar = BAR / tempo
    beat = bar / 4
    t_url = (SC['cierre'] + CLOSE_URL) / FPS
    t_sig = (SC['cierre'] + CLOSE_SIG) / FPS
    dur = SC['_end'] / FPS
    f = lambda name, off=0: (SC[name] + off) / FPS

    if version == 'h':
        a_end = hit1 + 10.5 * bar           # 29,664: entra «Y uno propio.»
        light = a_end + 2 * bar             # 34,289: vuelve el pulso (filtrado)
        full = light + 4 * bar              # 43,539: tema completo (2º cambio de paleta)
        cut2 = full + 6 * bar               # 57,414: corte seco antes de «Y una isla.»
        hit2 = cut2 + 2 * beat              # 58,571: golpe de la isla
        close = hit2 + 9 * bar              # 79,384: «Once temas. Una isla.»
        sections = [
            # Intro: solo la capa suave (compases 5,7-7,75), fundido lento; corte seco un pulso antes.
            dict(a=7.75 - (hit1 - beat) * tempo / BAR, b=7.75, t=0.0, tempo=tempo, fin=2.6, fin_shape='slow', fout=0.02),
            dict(a=16, b=26.5, t=hit1, tempo=tempo, fin=0.003, tail=0.012),            # golpe y montaje
            dict(a=102, b=104, t=a_end, tempo=tempo, fin=0.006, tail=0.012),           # «Y uno propio»: solo teclas
            dict(a=104, b=108, t=light, tempo=tempo, fin=0.004, tail=0.012),           # esquinas: percusión ligera
            dict(a=116, b=122, t=full, tempo=tempo, fin=0.003, fout=0.025),            # paleta, barra, claro/oscuro
            dict(a=40, b=49, t=hit2, tempo=tempo, fin=0.003, tail=0.015),              # la isla
            dict(a=97, b=99, t=close, to=t_url, fin=0.006, tail=0.015, gain=0),        # cierre: teclas
            dict(a=127.5, b=128, t=t_url, to=t_sig, fin=0.004, fout=0.012),             # remate de 2 pulsos
            dict(a=16, b=17, t=t_sig, tempo=tempo, fin=0.002, decay=0.9, fout=0.3),   # acorde final (Fa#)
        ]
        # Escalones de volumen (dB): la capa suave queda claramente por debajo del tema completo.
        gain = [(0, -5), (hit1 - 0.01, -5), (hit1, 0), (f('macos'), -1), (f('windows'), -1.5),
                (a_end - 0.01, -1.5), (a_end, -7), (light - 0.01, -7), (light, -5), (full - 0.01, -2.5),
                (full, -0.5), (cut2, -0.5), (hit2, 0), (f('vistazo'), 0), (f('vistazo', 12), -4),
                (f('abierta'), -4), (f('abierta', 30), -2), (f('bordes'), -1), (close - 0.01, -1),
                (close, -7), (t_url - 0.01, -8), (t_url, -1), (t_sig, 0)]
        lp = [(0, 260), (hit1 - beat - 0.15, 4200), (hit1 - 0.01, 4200), (hit1, 20000),
              (f('windows'), 20000), (a_end - 0.08, 1500),                       # Windows se oscurece
              (a_end, 2600), (light - 0.01, 2400), (light, 1100), (full - 0.1, 9000), (full, 20000),
              (f('claro', 188) - 0.05, 20000), (f('claro', 188) + 0.35, 1300), (cut2, 1300),  # «oscuro»
              (hit2, 20000), (f('abierta', 40), 20000), (f('abierta', 46), 850), (f('abierta', 56), 850),
              (hit2 + 5 * bar, 20000),                                              # se reabre en 1,5 compases
              (close - 0.01, 20000), (close, 3000), (t_url - 0.01, 2200), (t_url, 2500), (t_sig, 20000),
              (t_sig + 0.05, 20000), (dur, 1200)]
        hp = [(0, 20), (f('vistazo'), 20), (f('vistazo', 12), 170), (f('abierta'), 170), (f('abierta', 12), 20), (dur, 20)]
        shelf = [(0, 0), (f('claro'), 0), (f('claro', 20), 2.5), (f('claro', 185), 2.5), (f('claro', 195), 0), (dur, 0)]
        silences = [(hit1 - beat, hit1), (cut2, hit2)]
    else:
        a_end = hit1 + 7.5 * bar            # 20,837: «Y uno propio.»
        cut2 = a_end + bar                  # 23,151: corte seco
        hit2 = cut2 + 2 * beat              # 24,308: «Y una isla.»
        close = hit2 + 5 * bar              # 35,877
        sections = [
            dict(a=7.75 - (hit1 - beat) * tempo / BAR, b=7.75, t=0.0, tempo=tempo, fin=1.9, fin_shape='slow', fout=0.02),
            dict(a=16, b=23.5, t=hit1, tempo=tempo, fin=0.003, tail=0.012),
            dict(a=103, b=104, t=a_end, tempo=tempo, fin=0.006, fout=0.025),
            dict(a=40, b=45, t=hit2, tempo=tempo, fin=0.003, tail=0.015),
            dict(a=101, b=103, t=close, to=t_url, fin=0.006, tail=0.015),
            dict(a=127.5, b=128, t=t_url, to=t_sig, fin=0.004, fout=0.012),
            dict(a=16, b=17, t=t_sig, tempo=tempo, fin=0.002, decay=0.9, fout=0.3),
        ]
        gain = [(0, -5), (hit1 - 0.01, -5), (hit1, 0), (f('macos'), -1), (f('windows'), -1.5),
                (a_end - 0.01, -1.5), (a_end, -7), (cut2, -7), (hit2, 0), (f('abierta'), -2),
                (f('colores'), -1), (close - 0.01, -1), (close, -7), (t_url - 0.01, -8), (t_url, -1), (t_sig, 0)]
        lp = [(0, 260), (hit1 - beat - 0.15, 4200), (hit1 - 0.01, 4200), (hit1, 20000),
              (f('windows'), 20000), (a_end - 0.08, 1500), (a_end, 2400), (cut2, 2000),
              (hit2, 20000), (f('abierta', 40), 20000), (f('abierta', 46), 850), (f('abierta', 56), 850),
              (hit2 + 3.5 * bar, 20000),
              (close - 0.01, 20000), (close, 3000), (t_url - 0.01, 2200), (t_url, 2500), (t_sig, 20000),
              (t_sig + 0.05, 20000), (dur, 1200)]
        hp = [(0, 20), (dur, 20)]
        shelf = [(0, 0), (dur, 0)]
        silences = [(hit1 - beat, hit1), (cut2, hit2)]
    return dict(SC=SC, dur=dur, sections=sections, gain=gain, lp=lp, hp=hp, shelf=shelf,
                hit1=hit1, hit2=hit2, t_url=t_url, t_sig=t_sig, close=close, silences=silences, bar=bar)


def music_bus(src: np.ndarray, P: dict, tmp: str) -> np.ndarray:
    x = arrange(src, P['sections'], P['dur'], tmp)

    def mask(tc, f):
        lpc = curve(P['lp'], tc, log=True)[:, None]
        hpc = curve(P['hp'], tc, log=True)[:, None]
        sh = curve(P['shelf'], tc)[:, None]
        M = np.where(lpc >= 19000, 1.0, lp_mag(f[None, :], lpc, 3))
        M = M * np.where(hpc <= 21, 1.0, hp_mag(f[None, :], hpc, 2))
        M = M * (1 + (db(sh) - 1) / (1 + (5000 / f[None, :]) ** 2))
        return M

    x = stft_filter(x, mask)
    t = np.arange(len(x)) / SR
    x *= db(curve(P['gain'], t))[:, None]
    # Envío de reverb corto: los cortes secos dejan una cola natural en vez de un hueco digital.
    wet = convolve(x, make_ir(1.5, 2.4, seed=7, damp=4200))
    # Más reverb en el acorde final para que se apague en la sala.
    send = curve([(0, -24), (P['t_sig'] - 0.01, -24), (P['t_sig'], -13), (P['dur'], -13)], t)
    x = x + wet * db(send)[:, None]
    return x


# =============================================================================================
# 2. Efectos (síntesis propia)
# =============================================================================================
IR_SMALL = None
IR_HALL = None


def irs():
    global IR_SMALL, IR_HALL
    if IR_SMALL is None:
        IR_SMALL = make_ir(0.35, 0.6, seed=11, damp=6000, pre=0.004)
        IR_HALL = make_ir(1.9, 3.0, seed=13, damp=3500, pre=0.02)
    return IR_SMALL, IR_HALL


def env_ad(n: int, att: float, dec: float) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.minimum(1, t / att)
    return np.sin(np.pi / 2 * a) ** 2 * np.exp(-np.maximum(0, t - att) / dec)


def finish(y: np.ndarray, peak_db: float) -> np.ndarray:
    return y / (np.abs(y).max() + 1e-12) * db(peak_db)


def sfx_tick(rng, pitch=1.0, bright=1.0, p=0.0):
    """Clic de interfaz: transitorio de ruido filtrado + dos modos resonantes amortiguados
    (madera/plástico) + un 'toc' grave, saturación ligera y sala corta."""
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n) * np.exp(-t / 0.0016)
    noise = ffilt(noise, lambda f: hp_mag(f, 2200, 2) * lp_mag(f, 9000 * bright, 2))
    f1 = 1850 * pitch * (1 + rng.uniform(-0.01, 0.01))
    body = (np.sin(2 * np.pi * f1 * t + rng.uniform(0, 6)) * np.exp(-t / 0.012) * 0.55
            + np.sin(2 * np.pi * f1 * 2.71 * t) * np.exp(-t / 0.005) * 0.25
            + np.sin(2 * np.pi * 410 * pitch * t) * np.exp(-t / 0.009) * 0.35)
    y = noise * 1.2 + body
    y *= np.minimum(1, t / 0.0004)  # sin escalón digital
    y = soft(y / np.abs(y).max(), 1.6)
    st = pan(y, p)
    small, _ = irs()
    st = st + convolve(np.pad(st, ((0, int(0.4 * SR)), (0, 0))), small)[:len(st)] * 0.18
    return st, int(0.0006 * SR)  # el transitorio está al principio


def sfx_whoosh(rng, dur=0.8, peak=0.55, lo=300, hi=2600, p0=-0.5, p1=0.5):
    """Soplido: ruido rosa estéreo con paso banda que sube y baja, envolvente asimétrica y
    movimiento de panorama."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = rng.standard_normal((n, 2))
    w = ffilt(w, lambda f: 1 / np.sqrt(np.maximum(f, 20)))  # rosa
    pk = peak * dur

    def mask(tc, f):
        u = np.clip(tc / pk, 0, None)
        fc = np.where(tc < pk, lo * (hi / lo) ** np.clip(u, 0, 1),
                      hi * (lo * 1.6 / hi) ** np.clip((tc - pk) / (dur - pk), 0, 1))[:, None]
        q = np.log2(f[None, :] / fc)
        return np.exp(-0.5 * (q / 0.9) ** 2)

    y = stft_filter(np.pad(w, ((2048, 2048), (0, 0))), mask, n=1024, hop=256)[2048:2048 + n]
    e = np.where(t < pk, (t / pk) ** 2.4, np.exp(-(t - pk) / (0.22 * (dur - pk) + 1e-3)))
    e *= np.minimum(1, (dur - t) / 0.02)  # sin corte al final
    pp = np.interp(t, [0, dur], [p0, p1])
    a = (pp + 1) * np.pi / 4
    y = y * e[:, None]
    y = np.stack([y[:, 0] * np.cos(a) * 1.2 + y[:, 1] * 0.2, y[:, 1] * np.sin(a) * 1.2 + y[:, 0] * 0.2], axis=1)
    return y, int(pk * SR)


def sfx_sub(rng, f0=68, f1=38, decay=0.42, click=0.25):
    """Golpe grave: barrido de tono descendente con envolvente real, transitorio de ruido
    grave y saturación asimétrica (armónicos pares para que se note en altavoces pequeños)."""
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    freq = f1 + (f0 - f1) * np.exp(-t / 0.09)
    ph = 2 * np.pi * np.cumsum(freq) / SR
    y = np.sin(ph) * env_ad(n, 0.004, decay)
    y += 0.12 * np.sin(2 * ph + 0.7) * env_ad(n, 0.004, decay * 0.5)
    nz = rng.standard_normal(n) * np.exp(-t / 0.006)
    y += click * ffilt(nz, lambda f: lp_mag(f, 900, 2) * hp_mag(f, 60, 1))
    y = soft(y + 0.18 * y ** 2, 1.4)
    y = ffilt(y, lambda f: hp_mag(f, 26, 2))
    y *= np.minimum(1, (t[-1] - t) / 0.05)
    st = pan(y, 0)
    small, _ = irs()
    st += convolve(np.pad(st, ((0, int(0.6 * SR)), (0, 0))), small)[:n] * 0.10
    return st, int(0.004 * SR)


def bell(rng, freq, n, gain=1.0, decay=1.1):
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    # parciales tipo celesta/vibráfono suave: 1, 2, 3, 4,07, 5,4 con caídas más cortas arriba
    for r, a, d in [(1, 1.0, 1.0), (2.0, 0.28, 0.45), (3.0, 0.07, 0.3), (4.07, 0.06, 0.18), (5.4, 0.025, 0.1)]:
        for ch, cents in ((0, -3), (1, 3)):
            fr = freq * r * 2 ** (cents / 1200)
            out[:, ch] += a * np.sin(2 * np.pi * fr * t + rng.uniform(0, 6)) * env_ad(n, 0.007, decay * d)
    mallet = ffilt(rng.standard_normal(n) * np.exp(-t / 0.003), lambda f: lp_mag(f, 3500, 2) * hp_mag(f, 300, 1))
    out += 0.08 * mallet[:, None]
    return soft(out * gain / np.abs(out).max(), 1.3)


def sfx_tone(rng, notes, decay=1.1, wet=0.32):
    """Tono suave (isla): una o dos notas de campana suave con sala larga."""
    n = int(3.2 * SR)
    y = np.zeros((n, 2))
    for freq, off, g in notes:
        k = int(off * SR)
        y[k:] += bell(rng, freq, n - k, g, decay)
    _, hall = irs()
    y = y + convolve(y, hall) * wet
    y *= np.minimum(1, (n / SR - np.arange(n) / SR) / 0.3)[:, None]
    return y, int(0.007 * SR)


def sfx_swell(rng, dur=1.0):
    """Soplido inverso que desemboca en el golpe: ruido con paso alto que sube y corte seco."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = ffilt(rng.standard_normal((n, 2)), lambda f: 1 / np.sqrt(np.maximum(f, 20)))

    def mask(tc, f):
        fc = (500 * (5000 / 500) ** np.clip(tc / dur, 0, 1))[:, None]
        return hp_mag(f[None, :], fc, 1) * lp_mag(f[None, :], fc * 3, 1)

    y = stft_filter(np.pad(w, ((2048, 2048), (0, 0))), mask, n=1024, hop=256)[2048:2048 + n]
    e = (t / dur) ** 3.2 * np.minimum(1, (dur - t) / 0.008)
    return y * e[:, None], n  # se alinea por el final


# --- Tabla de eventos ----------------------------------------------------------------------
# (tipo, fotograma o segundos, nivel de pico dBFS antes de normalizar, parámetros, motivo)
PEAK = dict(tick=-27, tick_s=-32, whoosh=-27, whoosh_s=-31, sub=-15, sub_s=-18, tone=-24, tone_s=-28, swell=-30)


def cues(version: str, P: dict) -> list[dict]:
    SC = P['SC']
    out: list[dict] = []

    def add(kind, frame=None, sec=None, why='', **kw):
        t = sec if sec is not None else frame / FPS
        out.append(dict(kind=kind, t=t, frame=round(t * FPS, 2), why=why, **kw))

    V = version == 'v'
    # Golpes en la música
    add('sub', sec=P['hit1'], why='«Once temas.»: vuelve la música tras el silencio')
    add('swell', sec=P['hit2'], why='soplido inverso hacia «Y una isla.»')
    add('sub', sec=P['hit2'], why='«Y una isla.»: golpe tras el corte seco')
    # Once temas: monitor, montaje, rejilla, reordenado, etiquetas
    o = SC['once']
    D = 22 if V else 26
    T_GRID = 96 + D * 11
    T_SORT = T_GRID + (70 if V else 90)
    add('whoosh_s', o + 96, why='entra el monitor del montaje', dur=0.6, lo=250, hi=1800)
    for i in range(1, 11):
        add('tick', o + 96 + D * i + 1, why=f'montaje: tema {i + 1} de 11', pitch=1 + 0.012 * i, p=(-1) ** i * 0.15)
    add('whoosh', o + T_GRID + 20, why='el monitor se encoge a la rejilla', dur=0.9, lo=300, hi=3000, peak=0.45)
    for i in range(10):
        add('tick_s', o + T_GRID + 16 + 3 * i, why='rejilla: aparecen las tarjetas', pitch=1.25 + 0.03 * i,
            p=-0.6 + 0.12 * i, bright=0.8)
    add('whoosh_s', o + T_SORT + 27, why='se reordena por familias', dur=0.9, lo=220, hi=1500, p0=0.4, p1=-0.4)
    for i in range(3):
        add('tick_s', o + T_SORT + 34 + 8 * i, why='etiqueta de familia', pitch=0.92 + 0.04 * i)
    # Carruseles
    for name, n, per in (('macos', 6, 45 if V else 75), ('windows', 4, 48 if V else 78)):
        add('whoosh_s', SC[name] + 28, why=f'entra el carrusel ({name})', dur=0.7, lo=280, hi=2000, p0=0.7, p1=0)
        for k in range(1, n):
            add('tick', SC[name] + 34 + per * k - 17, why=f'{name}: cambia el tema ({k + 1}/{n})',
                pitch=0.96 + 0.015 * k, p=0.15)
    add('whoosh_s', SC['propio'] + 72, why='«Y uno propio.»: sube Obsidiana', dur=1.1, lo=140, hi=900, p0=0, p1=0)
    if not V:
        add('tick_s', SC['esquinas'] + 196, why='esquinas: Big Sur pasa a Ventura', pitch=0.9)
        for i in range(10):
            add('tick_s', SC['paleta'] + 78 + 4 * i, why='paleta: llegan los colores', pitch=1.1 + 0.025 * i,
                p=-0.5 + 0.1 * i, bright=0.7)
        for k, st in enumerate((150, 235, 320)):
            add('tick', SC['paleta'] + st + 13, why=f'paleta: cambia el tema ({k + 2}/4)', pitch=1.0 + 0.02 * k)
        for k, st in enumerate((120, 215)):
            add('tick', SC['barra'] + st + 8, why=('barra: cristal' if k == 0 else 'barra: transparente'), pitch=0.94)
        add('tick', SC['claro'] + 188, why='claro → oscuro (la música se oscurece)', pitch=0.85)
    # Isla
    i0 = SC['isla']
    add('whoosh_s', i0 + 112, why='entra el monitor con la isla', dur=0.8, lo=200, hi=1600, p0=-0.2, p1=0.2)
    if not V:
        add('tone_s', SC['vistazo'] + 50, why='la isla se asoma (cambio de canción)', notes=[(1108.73, 0, 1.0)])
    a0 = SC['abierta']
    add('tone', a0 + 46, why='se abre la isla desde el reloj', notes=[(739.99, 0, 1.0), (1108.73, 0.085, 0.8)])
    for k in range(1, 4):
        add('tick_s', a0 + 90 + 28 * k - 22, why=f'isla: pestaña {k + 1}', pitch=1.15 + 0.03 * k)
    add('whoosh_s', a0 + 225, why='zoom a la agenda', dur=0.7, lo=260, hi=1700)
    for k, ft in enumerate((218, 288, 320)):
        add('tick_s', a0 + ft, why='isla: aparece una función', pitch=1.0 + 0.04 * k)
    if not V:
        add('tick_s', SC['bordes'] + 106, why='la isla cambia de borde', pitch=0.95)
    # Cierre
    c0 = SC['cierre']
    add('tick_s', c0 + CLOSE_BOX + 4, why='aparece la tarjeta del comando', pitch=0.9)
    add('tick', c0 + CLOSE_URL, why='aparece thealejandro.dev/omarchy (entra el remate)', pitch=1.05)
    add('sub_s', sec=P['t_sig'], why='firma: acorde final', f0=60, f1=36, decay=0.7)
    add('tone_s', sec=P['t_sig'], why='firma: nota final', notes=[(739.99, 0.0, 0.7), (1108.73, 0.0, 0.45)], decay=1.6)
    return sorted(out, key=lambda c: c['t'])


def sfx_bus(version: str, P: dict, dur: float) -> tuple[np.ndarray, list[dict]]:
    n = int(round(dur * SR))
    bus = np.zeros((n, 2))
    C = cues(version, P)
    for idx, c in enumerate(C):
        rng = np.random.default_rng(1000 + idx + (0 if version == 'h' else 500))
        k = c['kind']
        base = k.removesuffix('_s')
        if base == 'tick':
            y, on = sfx_tick(rng, c.get('pitch', 1), c.get('bright', 1), c.get('p', 0))
        elif base == 'whoosh':
            y, on = sfx_whoosh(rng, c.get('dur', 0.8), c.get('peak', 0.55), c.get('lo', 300), c.get('hi', 2600),
                               c.get('p0', -0.5), c.get('p1', 0.5))
        elif base == 'sub':
            y, on = sfx_sub(rng, c.get('f0', 68), c.get('f1', 38), c.get('decay', 0.42))
        elif base == 'tone':
            y, on = sfx_tone(rng, c['notes'], c.get('decay', 1.1))
        elif base == 'swell':
            y, on = sfx_swell(rng)
        else:
            raise ValueError(k)
        jitter = rng.uniform(-1.2, 1.2) if base == 'tick' else 0
        y = finish(y, PEAK[k] + jitter)
        p = int(round(c['t'] * SR)) - on
        a, b = max(0, p), min(n, p + len(y))
        bus[a:b] += y[a - p:b - p]
    return bus, C


# =============================================================================================
# 3. Mezcla y máster
# =============================================================================================
def master(mix: np.ndarray, out_m4a: str, tmp: str, target=-16.0, ceil_db=-1.5) -> dict:
    wav = os.path.join(tmp, 'mix.wav')
    lim = os.path.join(tmp, 'lim.wav')
    save(wav, mix)
    gain = target - ebur128(wav)['I']
    for _ in range(3):
        run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-af',
             f'volume={gain:.3f}dB,aresample={SR * 4},alimiter=limit={db(ceil_db):.4f}:attack=2:release=80:level=0:latency=1,'
             f'aresample={SR}', '-c:a', 'pcm_f32le', lim])
        m = ebur128(lim)
        if abs(m['I'] - target) < 0.1:
            break
        gain += target - m['I']
    run(['ffmpeg', '-loglevel', 'error', '-y', '-i', lim, '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', out_m4a])
    return ebur128(out_m4a)


def build(version: str, src: np.ndarray, stems: str | None, tmp: str) -> None:
    P = plan(version)
    dur = P['dur']
    print(f'[{version}] arreglo y automatización…', flush=True)
    mus = music_bus(src, P, tmp)
    save(os.path.join(tmp, 'mus.wav'), mus)
    mus *= db(-17 - ebur128(os.path.join(tmp, 'mus.wav'))['I'])
    print(f'[{version}] efectos…', flush=True)
    fx, C = sfx_bus(version, P, dur)
    mix = mus + fx
    # fundido final de seguridad (los últimos 0,25 s ya están casi en silencio)
    t = np.arange(len(mix)) / SR
    mix *= np.clip((dur - t) / 0.25, 0, 1)[:, None]
    out = os.path.join(ROOT, 'public', 'audio', f'mix-{version}.m4a')
    m = master(mix, out, tmp)
    print(f'[{version}] {out}: I={m["I"]} LUFS, LRA={m["LRA"]} LU, pico real={m["TP"]} dBTP')
    if stems:
        os.makedirs(stems, exist_ok=True)
        save(os.path.join(stems, f'music-{version}.wav'), mus)
        save(os.path.join(stems, f'sfx-{version}.wav'), fx)
        with open(os.path.join(stems, f'cues-{version}.json'), 'w') as fh:
            json.dump(dict(cues=C, hit1=P['hit1'], hit2=P['hit2'], silences=P['silences'], close=P['close'],
                           t_url=P['t_url'], t_sig=P['t_sig'], dur=dur, bar=P['bar']), fh, ensure_ascii=False, indent=1)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('src', help='MP3 original de «Limit 70»')
    ap.add_argument('--stems', help='carpeta donde dejar música, efectos y tabla de eventos por separado')
    ap.add_argument('--only', choices=['h', 'v'])
    a = ap.parse_args()
    src = load(a.src)
    if abs(len(src) / SR - 301.66) > 0.5:
        sys.exit('No parece el MP3 original de «Limit 70» (301,66 s).')
    with tempfile.TemporaryDirectory() as tmp:
        for v in (['h', 'v'] if not a.only else [a.only]):
            build(v, src, a.stems, tmp)


if __name__ == '__main__':
    main()
