#!/usr/bin/env python3
"""Pad ambiental sintetizado (sin muestras ni licencias de terceros).

Genera public/audio/pad.wav (estéreo, 48 kHz) con acordes suaves que se funden;
scripts/make-pad.sh lo pasa a AAC con un poco de eco/reverb de ffmpeg.
Uso: python3 scripts/make-pad.py [segundos]
"""
import sys, wave
import numpy as np

SR = 48000
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 96.0
CHORD_LEN = 6.0
XF = 2.5

CHORDS = [
    [146.83, 220.00, 369.99, 554.37, 659.26],  # Dmaj9
    [123.47, 185.00, 293.66, 440.00, 659.26],  # Bm11
    [98.00, 146.83, 246.94, 369.99, 440.00],   # Gmaj9
    [110.00, 164.81, 246.94, 329.63, 554.37],  # Asus2
]

n = int(SR * DUR)
t = np.arange(n) / SR
out = np.zeros((n, 2))
rng = np.random.default_rng(7)

k = 0
start = 0.0
while start < DUR:
    chord = CHORDS[k % len(CHORDS)]
    seg_end = start + CHORD_LEN + XF
    i0, i1 = int(start * SR), min(n, int(seg_end * SR))
    tt = t[i0:i1] - start
    L = seg_end - start
    env = np.ones_like(tt)
    a = tt < XF
    env[a] = 0.5 - 0.5 * np.cos(np.pi * tt[a] / XF)
    r = tt > L - XF
    env[r] = 0.5 + 0.5 * np.cos(np.pi * (tt[r] - (L - XF)) / XF)
    for vi, f in enumerate(chord):
        amp = 0.16 / (1 + vi * 0.55)
        lfo = 0.75 + 0.25 * np.sin(2 * np.pi * (0.07 + 0.03 * vi) * tt + rng.uniform(0, 6.28))
        for ch, det in ((0, -0.0025), (1, 0.0025)):
            ff = f * (1 + det)
            ph = rng.uniform(0, 6.28)
            sig = np.sin(2 * np.pi * ff * tt + ph) + 0.18 * np.sin(4 * np.pi * ff * tt + ph)
            out[i0:i1, ch] += amp * lfo * env * sig
    start += CHORD_LEN
    k += 1

# Entrada y salida suaves
fade = int(4 * SR)
out[:fade] *= np.linspace(0, 1, fade)[:, None]
out[-fade:] *= np.linspace(1, 0, fade)[:, None]
out /= np.max(np.abs(out)) / 0.5  # pico a -6 dBFS

pcm = (out * 32767).astype('<i2')
with wave.open('public/audio/pad.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('public/audio/pad.wav', DUR, 's')
