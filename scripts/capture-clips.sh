#!/bin/bash
# Graba los dos clips en vivo del promo en el escritorio 9, sin datos personales (con Silencio activo
# y sin la página Mundo, que enseña ciudades y la ubicación del clima):
#   public/clips/theme-switch.mp4  cambio de tema real (Cupertino → Tahoe → Aero Night → Obsidiana → Fluent Light)
#   public/clips/island-open-<es|en>.mp4  el cursor va al reloj, clic y se abre la isla (en ese idioma)
#   public/island-themes/<es|en>/<tema>.webp  la isla abierta en Inicio con cada uno de los once temas
# Además deja public/clips/<clip>.json con el segundo de cada acción según el registro.
#
# uso: scripts/capture-clips.sh [theme|island|all]   (sin argumento graba todo)
# Dura unos 4 minutos. No toques la PC mientras corre. Al terminar (o si falla, o con Ctrl+C)
# restaura tema, fondo, barra, idioma de la isla, escritorio y cursor, y deja las notificaciones
# en la isla. Los avisos de recarga de Ghostty, lazy.nvim y aether.nvim se apagan solo en las ventanas de
# la demo (opciones de línea de órdenes): no se toca ninguna configuración.
#
# Requisitos: gpu-screen-recorder, ydotool (con ydotoold activo), ffmpeg, jq, ghostty, btop,
# nvim, nautilus. Carpeta ~/tema-demo (proyecto falso, autor «demo») y la config de btop
# con `net_iface = "lo"` en $S/btop/btop.conf (ver infra-runbooks/omarchy-themes/RUNBOOK.md).
set -u
cd "$(dirname "$0")/.."
OUT=$PWD/public/clips
S=${S:-$HOME/.cache/omarchy-capturas}
D=$HOME/tema-demo
WS=9
MON=$(hyprctl monitors -j | jq -r '.[0].name')
IPC=(qs ipc -p /usr/share/omarchy/shell/shell.qml call)
RAW=$(mktemp -d)
mkdir -p "$OUT"

# Comprobaciones previas: nada de esto toca la pantalla.
for c in gpu-screen-recorder ydotool ffmpeg jq ghostty btop nvim nautilus; do
  command -v $c >/dev/null || { echo "falta $c" >&2; exit 1; }
done
[[ -d $D ]] || { echo "falta $D" >&2; exit 1; }
grep -q '^net_iface = "lo"' "$S/btop/btop.conf" || { echo "btop.conf sin net_iface = \"lo\"" >&2; exit 1; }
[[ $(git -C "$D" log -1 --format=%an) == demo ]] || { echo "$D no tiene autor demo" >&2; exit 1; }

# Estado que se restaura al final.
ORIG_THEME=$(omarchy theme current 2>/dev/null)
ORIG_BG=$(basename "$(readlink -f "$HOME/.local/state/omarchy/current/background")")
ORIG_BAR_BG=$(jq -r '.bar.background // "opaque"' ~/.config/omarchy/shell.json)
ORIG_BAR_POS=$(jq -r '.bar.position // "top"' ~/.config/omarchy/shell.json)
ORIG_WS=$(hyprctl activeworkspace -j | jq -r .id)
ORIG_CUR=$(hyprctl cursorpos)
ORIG_NOTIF=$("${IPC[@]}" island state | jq -r .notifications)
ORIG_DND=$(omarchy-shell notifications isDnd 2>/dev/null || echo off)
ORIG_LANG=$(omarchy bar get thealejandro.island language 2>/dev/null); HAD_LANG=$?
SHELL_JSON=$HOME/.config/omarchy/shell.json
REC_PID=

close_demo() {
  for addr in $(hyprctl clients -j | jq -r ".[] | select(.workspace.id==$WS) | .address"); do
    hyprctl dispatch "hl.dsp.window.close({ window = \"address:$addr\" })" >/dev/null
  done
  sleep 1
}

open_demo() {
  # Sin el aviso «Reloaded the configuration» al cambiar de tema (solo estas ventanas).
  local G=(ghostty --app-notifications=no-config-reload)
  setsid -f "${G[@]}" --class=demo.term --working-directory=$D -e fish -C 'clear; eza -l --icons --git --no-user --no-time; echo; git log --oneline --graph -3; echo' >/dev/null 2>&1
  sleep 1.2
  setsid -f "${G[@]}" --class=demo.btop -e btop -c $S/btop/btop.conf >/dev/null 2>&1
  sleep 1.2
  # Sin el aviso «Config Change Detected» de lazy.nvim (solo este nvim; la opción se lee al recargar)
  # ni el «aether.nvim reloaded…» del tema: se filtra vim.notify cuando LazyVim ya puso el suyo.
  setsid -f "${G[@]}" --class=demo.nvim --working-directory=$D -e nvim \
    -c 'lua pcall(function() require("lazy.core.config").options.change_detection.notify = false end)' \
    -c 'lua vim.defer_fn(function() local n = vim.notify; vim.notify = function(m, ...) if type(m) == "string" and m:find("^aether%.nvim") then return end; return n(m, ...) end end, 2500)' \
    src/app.ts >/dev/null 2>&1
  sleep 1.2
  setsid -f nautilus --new-window $D >/dev/null 2>&1
  sleep 4
}

clear_notes() { "${IPC[@]}" notifications dismissAll >/dev/null 2>&1; sleep 0.6; }

# Cursor: movimiento suave (ease in-out) hasta (x, y) en `ms` milisegundos. ydotool solo mueve en
# relativo y Hyprland aplica aceleración, así que en cada paso se corrige con la posición real.
cursor_xy() { hyprctl cursorpos | tr -d ' ' | tr ',' ' '; }
move_to() {
  local tx=$1 ty=$2 ms=${3:-800} steps i x0 y0 cx cy px py
  read -r x0 y0 < <(cursor_xy)
  steps=$((ms / 16))
  for ((i = 1; i <= steps; i++)); do
    read -r px py < <(awk -v i=$i -v n=$steps -v x0=$x0 -v y0=$y0 -v tx=$tx -v ty=$ty 'BEGIN{
      t=i/n; e=(t<0.5)?4*t*t*t:1-((-2*t+2)^3)/2; printf "%d %d", x0+(tx-x0)*e, y0+(ty-y0)*e }')
    read -r cx cy < <(cursor_xy)
    ydotool mousemove -x $((px - cx)) -y $((py - cy)) >/dev/null 2>&1
    sleep 0.012
  done
  for i in 1 2 3; do  # ajuste final
    read -r cx cy < <(cursor_xy)
    ((cx == tx && cy == ty)) && break
    ydotool mousemove -x $((tx - cx)) -y $((ty - cy)) >/dev/null 2>&1
    sleep 0.03
  done
}
click() { ydotool click 0xC0 >/dev/null 2>&1; }

# Grabación: 60 fps constantes, con cursor. Las marcas de tiempo son segundos desde que arranca.
T0=0
LOG=
rec_start() { # rec_start <nombre>
  LOG=$RAW/$1.log; : >"$LOG"
  gpu-screen-recorder -w "$MON" -f 60 -fm cfr -k h264 -q very_high -cursor yes -o "$RAW/$1.mp4" >"$RAW/$1.gsr.log" 2>&1 &
  REC_PID=$!
  T0=$(date +%s.%N)
  sleep 1.2  # margen: el grabador tarda en dar el primer fotograma
}
mark() { echo "$(awk -v a="$T0" -v b="$(date +%s.%N)" 'BEGIN{printf "%.3f", b-a}') $*" | tee -a "$LOG"; }
rec_stop() { # rec_stop <nombre>
  kill -INT "$REC_PID" 2>/dev/null; wait "$REC_PID" 2>/dev/null; REC_PID=
  ffmpeg -loglevel error -y -i "$RAW/$1.mp4" -an -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
    -r 60 -movflags +faststart "$OUT/$1.mp4"
  jq -Rn '[inputs | split(" ") | {t: (.[0] | tonumber), what: (.[1:] | join(" "))}]' "$LOG" >"$OUT/$1.json"
  echo "listo: $OUT/$1.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$1.mp4") s)"
}

restore() {
  [[ -n $REC_PID ]] && kill -INT "$REC_PID" 2>/dev/null && wait "$REC_PID" 2>/dev/null
  "${IPC[@]}" island close >/dev/null 2>&1
  "${IPC[@]}" notifications "${ORIG_NOTIF:-island}" >/dev/null 2>&1
  omarchy-shell notifications setDnd "${ORIG_DND:-off}" >/dev/null 2>&1
  if ((HAD_LANG == 0)); then
    omarchy bar set thealejandro.island language "$(jq -Rn --arg v "$ORIG_LANG" '$v')" --json >/dev/null 2>&1
  else  # no había clave: se quita (mismo archivo, sin cambiar el resto)
    jq 'walk(if type == "object" and .id == "thealejandro.island" then del(.language) else . end)' "$SHELL_JSON" >"$RAW/shell.json" \
      && [[ -s $RAW/shell.json ]] && cat "$RAW/shell.json" >"$SHELL_JSON"
  fi
  omarchy bar position "$ORIG_BAR_POS" >/dev/null 2>&1
  omarchy bar background "$ORIG_BAR_BG" >/dev/null 2>&1
  close_demo
  if [[ -n $ORIG_THEME ]]; then
    omarchy theme set "$ORIG_THEME" >/dev/null 2>&1
    sleep 1.5
    bg=$HOME/.local/state/omarchy/current/theme/backgrounds/$ORIG_BG
    [[ -f $bg ]] && omarchy theme bg set "$bg" >/dev/null 2>&1
  fi
  hyprctl dispatch "hl.dsp.focus({ workspace = \"$ORIG_WS\" })" >/dev/null
  read -r ox oy <<<"$(tr -d ' ' <<<"$ORIG_CUR" | tr ',' ' ')"
  move_to "$ox" "$oy" 300
  rm -rf "$RAW"
  echo "restaurado: idioma de la isla ${ORIG_LANG:-(automático)}, tema $ORIG_THEME, fondo $ORIG_BG, barra $ORIG_BAR_POS/$ORIG_BAR_BG, escritorio $ORIG_WS, notificaciones ${ORIG_NOTIF:-island}, silencio ${ORIG_DND:-off}"
}
trap restore EXIT
trap 'exit 130' INT TERM

prepare() { # prepare <tema>
  close_demo
  "${IPC[@]}" island close >/dev/null 2>&1
  omarchy bar position top >/dev/null 2>&1
  omarchy bar background glassy >/dev/null 2>&1
  omarchy theme set "$1" >/dev/null 2>&1
  sleep 2
  open_demo
  move_to 1340 640 400  # cursor sobre las ventanas, lejos de la barra
  clear_notes
}

take_theme() {
  prepare cupertino
  rec_start theme-switch
  mark inicio cupertino
  sleep 1.6
  for t in tahoe aero-night obsidiana fluent-light; do
    mark tema "$t"
    omarchy theme set "$t" >/dev/null 2>&1 &
    sleep 3.2
    clear_notes
  done
  sleep 0.8
  mark fin
  rec_stop theme-switch
}

set_lang() { # set_lang <es|en>: idioma de la isla (se restaura al final)
  omarchy bar set thealejandro.island language "\"$1\"" --json >/dev/null 2>&1
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    [[ $("${IPC[@]}" island state | jq -r .lang) == "$1" ]] && return 0
    sleep 0.3
  done
  echo "la isla no cambió a $1" >&2; exit 1
}

take_island() { # take_island <es|en>
  prepare cupertino
  "${IPC[@]}" island page home >/dev/null 2>&1; sleep 0.3; "${IPC[@]}" island close >/dev/null 2>&1
  rec_start "island-open-$1"
  mark inicio
  sleep 0.8
  mark cursor-al-reloj
  move_to 960 14 900
  sleep 0.35
  mark clic-reloj
  click
  sleep 0.4
  [[ $("${IPC[@]}" island state | jq -r .pinned) == true ]] || { mark respaldo-ipc-open; "${IPC[@]}" island open >/dev/null; }
  # Se queda abierta 3 s (Inicio y Calendario) y se corta: la página Mundo no se graba.
  sleep 3
  mark fin
  rec_stop "island-open-$1"
  "${IPC[@]}" island close >/dev/null 2>&1
}

# La isla abierta en Inicio con cada tema, recortada a la zona de la isla (sin el resto del escritorio).
THEMES=(cupertino cupertino-light graphite big-sur ventura tahoe fluent fluent-light aero aero-night obsidiana)
take_shots() { # take_shots <es|en>
  local dir=$PWD/public/island-themes/$1
  mkdir -p "$dir"
  "${IPC[@]}" island close >/dev/null 2>&1
  for t in "${THEMES[@]}"; do
    omarchy theme set "$t" >/dev/null 2>&1
    sleep 2.5
    clear_notes
    "${IPC[@]}" island page home >/dev/null 2>&1
    "${IPC[@]}" island open >/dev/null 2>&1
    sleep 1.2
    grim -o "$MON" "$RAW/shot.png"
    "${IPC[@]}" island close >/dev/null 2>&1
    ffmpeg -loglevel error -y -i "$RAW/shot.png" -vf "crop=800:560:560:0" -c:v libwebp -quality 92 "$dir/$t.webp"
    rm -f "$RAW/shot.png"
    echo "listo: $dir/$t.webp"
    sleep 0.3
  done
}

# Silencio (no molestar) mientras se graba: no entra ninguna notificación real.
omarchy-shell notifications setDnd on >/dev/null 2>&1
hyprctl dispatch "hl.dsp.focus({ workspace = \"$WS\" })" >/dev/null
sleep 0.5
case ${1:-all} in
  theme) take_theme ;;
  island) for l in es en; do set_lang $l; take_island $l; take_shots $l; done ;;
  all) for l in es en; do set_lang $l; take_island $l; take_shots $l; done; take_theme ;;
  *) echo "uso: $0 [theme|island]" >&2; exit 2 ;;
esac
