#!/usr/bin/env bash
# Copia el material real (capturas, variantes, fondos, isla) a public/.
# Solo lee archivos: no toca la pantalla ni Omarchy.
set -euo pipefail
cd "$(dirname "$0")/.."
THEMES="cupertino cupertino-light graphite big-sur ventura tahoe fluent fluent-light obsidiana aero aero-night"
CAP="${OMARCHY_CAPTURAS:-$HOME/.cache/omarchy-capturas}"
TH="${OMARCHY_THEMES:-$HOME/.config/omarchy/themes}"
ISLAND="${OMARCHY_ISLAND:-$HOME/Work/omarchy-island}"
mkdir -p public/shots public/extras public/backgrounds public/island public/clips public/audio
for s in $THEMES; do
  cp -f "$CAP/shots/$s.png" "public/shots/$s.png"
  mkdir -p "public/extras/$s"
  cp -f "$CAP/extras/$s/"*.webp "public/extras/$s/"
  bg=$(ls "$TH/$s/backgrounds/" | sort | head -1)
  ffmpeg -loglevel error -y -i "$TH/$s/backgrounds/$bg" -vf "scale=1920:-2" -q:v 3 "public/backgrounds/$s.jpg"
done
cp -f "$ISLAND/docs/island-open.png" "$ISLAND/docs/island-peek.png" public/island/
cp -f /home/jacc/Work/portfolio/src/data/omarchy-themes.json src/themes.json 2>/dev/null || true
echo "listo: public/"
