#!/usr/bin/env bash
# Edita "Limit 70" (Kevin MacLeod, CC BY 4.0) para los dos vídeos: cortes en compás, fundidos,
# pequeño ajuste de tempo para que el golpe, la isla y la tarjeta de cierre caigan en compás,
# y normalización a -16 LUFS. El original (102,65 BPM, 4/4) se descarga de
# https://incompetech.com/music/royalty-free/mp3-royaltyfree/Limit%2070.mp3 y NO se versiona.
# Uso: scripts/make-music.sh "Limit 70.mp3"   (genera public/audio/limit70-h.m4a y limit70-v.m4a)
set -euo pipefail
src="${1:?uso: make-music.sh <Limit 70.mp3>}"
out="$(cd "$(dirname "$0")/.." && pwd)/public/audio"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

# Rejilla del original: 102,65 BPM, primer pulso en -0,0145 s. Compás n empieza en n*BAR+T0.
BAR=2.338102; T0=-0.0145; XF=0.04

# build <nombre> <duración vídeo s> <tempo> <precarga s del vídeo hasta el golpe> <segmentos "a:b" en compases...>
build() {
  local name="$1" vdur="$2" tempo="$3" pre="$4"; shift 4
  local i=0 inputs=() fc="" last=""
  local first=1
  for seg in "$@"; do
    local a="${seg%%:*}" b="${seg##*:}"
    local ta tb
    if [ $first = 1 ]; then ta=$(awk -v p="$pre" -v t="$tempo" -v B=$BAR -v T=$T0 -v a="$a" 'BEGIN{printf "%.4f", a*B+T-p*t}'); first=0
    else ta=$(awk -v B=$BAR -v T=$T0 -v a="$a" -v x=$XF 'BEGIN{printf "%.4f", a*B+T-x}'); fi
    tb=$(awk -v B=$BAR -v T=$T0 -v b="$b" -v x=$XF 'BEGIN{printf "%.4f", b*B+T+((b==128)?0:x)}')
    fc+="[0:a]atrim=${ta}:${tb},asetpts=PTS-STARTPTS[s$i];"
    i=$((i+1))
  done
  local chain="[s0]"
  for ((j=1;j<i;j++)); do fc+="${chain}[s$j]acrossfade=d=$(awk -v x=$XF 'BEGIN{print 2*x}'):c1=tri:c2=tri[x$j];"; chain="[x$j]"; done
  fc+="${chain}rubberband=tempo=${tempo}:transients=crisp:pitchq=quality,"
  fc+="atrim=0:${vdur},afade=t=in:st=0:d=1.4:curve=qsin,afade=t=out:st=$(awk -v v="$vdur" 'BEGIN{print v-0.7}'):d=0.7:curve=qsin[o]"
  ffmpeg -loglevel error -y -i "$src" -filter_complex "$fc" -map "[o]" -ar 48000 -ac 2 "$tmp/$name.wav"
  # normalización a -16 LUFS en dos pasadas (lineal), techo -1,5 dBTP
  local m
  m=$(ffmpeg -nostats -i "$tmp/$name.wav" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  local g=(input_i input_tp input_lra input_thresh target_offset); local v=()
  for k in "${g[@]}"; do v+=("$(echo "$m" | grep "\"$k\"" | sed 's/[^0-9.-]//g')"); done
  ffmpeg -loglevel error -y -i "$tmp/$name.wav" -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${v[0]}:measured_TP=${v[1]}:measured_LRA=${v[2]}:measured_thresh=${v[3]}:offset=${v[4]}:linear=true,aresample=48000" \
    -c:a aac -b:a 256k -movflags +faststart "$out/$name.m4a"
}

# Horizontal (88,633 s): golpe en «Once temas» (compás 16 del original), subida en «Y una isla»
# (compás 40, tras el compás 39 en calma; se quita el 35), último fraseo (120-127) y final sobre el cierre.
build limit70-h 88.6333 1.01107 5.3833 16:35 36:45 120:128
# Vertical (45,133 s): mismo golpe, subida en la isla y los 4 últimos compases bajo la tarjeta.
build limit70-v 45.1333 1.01046 3.4833 16:24 39:45 124:128
