#!/usr/bin/env bash
# Genera public/audio/pad.m4a: pad sintetizado + reverb ligera, -20 LUFS aprox.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/audio
python3 scripts/make-pad.py "${1:-96}"
ffmpeg -loglevel error -y -i public/audio/pad.wav \
  -af "aecho=0.8:0.7:120|260|430:0.32|0.22|0.14,lowpass=f=5200,highpass=f=60,loudnorm=I=-20:TP=-3:LRA=7" \
  -ar 48000 -c:a aac -b:a 192k public/audio/pad.m4a
rm -f public/audio/pad.wav
echo "listo: public/audio/pad.m4a"
