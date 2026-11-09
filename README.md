# omarchy-promo

Vídeo promocional (estilo keynote) de los once temas de Omarchy de thealejandro y del
plugin [omarchy-island](https://github.com/thealejandro/omarchy-island), hecho con
[Remotion](https://www.remotion.dev) (React → MP4, render determinista).

Usa capturas y dos clips reales grabados en el escritorio (cambio de tema en vivo y la isla
abriéndose); al renderizar no se graba nada.

## Salidas

Cada vídeo se renderiza en español (`es`) y en inglés (`en`).

| Archivo | Formato | Duración |
| --- | --- | --- |
| `out/omarchy-promo-{es,en}.mp4` | 1920×1080, 60 fps, H.264 yuv420p CRF 18, faststart, AAC, −16 LUFS | 60,0 s |
| `out/omarchy-reel-{es,en}.mp4` | 1080×1920 (Reels y estados de WhatsApp), 60 fps, mismo códec, −14 LUFS | 31,2 s |
| `out/poster-{es,en}.jpg` | 1920×1080 | — |
| `out/cover-{es,en}.jpg` | 1080×1920, portada del reel (lo importante cabe en el recorte 3:4) | — |

## Uso

```bash
npm install
npm run assets     # copia capturas, variantes, fondos e isla a public/ (solo lee archivos)
npm run studio     # vista previa interactiva en el navegador
npm run build      # los cuatro vídeos, pósteres y portadas
# o por separado: npm run render:h:es | render:h:en | render:v:es | render:v:en | poster
```

Vista previa rápida a resolución reducida:

```bash
npx remotion render Reel-es out/preview.mp4 --scale=0.4
```

## Estructura

```
src/
  Root.tsx            composiciones: Promo-{es,en}, Reel-{es,en}, Poster-{es,en}, Cover-{es,en}
  timeline.json       única fuente de los tiempos: escenas en pulsos (100 BPM, 1 pulso = 36 fotogramas)
                      y transición hacia la siguiente; la lee también scripts/make-audio.py
  Timeline.tsx        monta la línea de tiempo con TransitionSeries (cortes secos, slide o «cover»)
  Promo.tsx           qué componente va en cada escena (Promo y Reel)
  i18n.tsx            textos en pantalla en español e inglés
  lib.tsx             datos de temas, fuentes, titulares palabra a palabra, Monitor, ZoomImg…
  blur.tsx            desenfoque de movimiento (CameraMotionBlur) solo en los tramos de movimiento
  clips.ts            clips en vivo y el segundo exacto de cada acción
  music.ts            pistas de audio (horizontal y vertical)
  scenes/             Hook (desfile de temas), OnceTemas, Live (tema en vivo e isla en vivo),
                      Families (carruseles + Obsidiana), Details (esquinas, paleta, barra,
                      claro/oscuro), Island, Close
public/
  shots/ extras/ backgrounds/ island/   material real (npm run assets)
  clips/              clips grabados en vivo (scripts/capture-clips.sh)
  fonts/              Inter y JetBrains Mono (OFL), empaquetadas: render sin red
  marca/logotipo.svg  logotipo de thealejandro (copia de ~/Streaming/marca; no se modifica)
  audio/              sonido final: música + efectos (mix-h.m4a, mix-v.m4a; scripts/make-audio.py)
```

Montaje: no hay fundidos a negro. Cada escena empieza en un pulso de la música; los cambios
son cortes secos en el golpe o transiciones cortas en las que el objeto continúa (la rejilla
sale del tema que cerró el gancho, el carrusel desliza, la escena siguiente cubre a la anterior).

Escenas (horizontal, 60 s): desfile de los once temas a sangre desde el fotograma 0 con
«Omarchy, a tu manera.» → «Once temas.» (la rejilla se reordena por familias) → «Cambia de tema
en vivo.» (clip real, zoom de cámara en cada cambio) → «Inspirados en macOS.» → «Inspirados en
Windows.» → «Y uno propio.» → esquinas y bordes → paleta → barra → claro u oscuro → «Y una isla.»
→ vistazo → «Se abre desde el reloj.» (clip real: la cámara sigue el cursor, anillo en el clic)
→ cualquier borde → colores del tema → cierre de ~5 s con una sola llamada a la acción
(thealejandro.dev/omarchy) y la firma.

Reel (31,2 s): pensado también para estados de WhatsApp, donde casi nadie conoce Omarchy y se
ve sin sonido. Abre con «Hice 11 temas para Linux» y «Para Omarchy. Gratis y de código
abierto.» desde el primer fotograma → en vivo → macOS → Windows → propio → la isla en vivo →
colores → cierre de 7,2 s que entra en seco con el acorde: thealejandro.dev/omarchy en grande,
«Gratis · enlace en el perfil», la firma y debajo las redes (@thealejandro__ en Instagram, X y
Twitch; github.com/thealejandro) y el horario de los directos, como en thealejandro.dev. Todo
el texto queda en la zona segura de Reels (x 65–1015, y 269–1248); las imágenes van a sangre.

## Clips en vivo

`scripts/capture-clips.sh` graba los clips en el escritorio 9 sin datos personales
(Silencio activo, sin la página Mundo ni la ubicación del clima) y restaura el estado al
terminar. Deja `public/clips/<clip>.mp4` y un `.json` con el segundo de cada acción según el
registro de la grabación. En las ventanas de la demo se apagan los avisos de recarga de
Ghostty, lazy.nvim y aether.nvim (opciones de línea de órdenes, sin tocar la configuración).
La isla se graba en español y en inglés (cada vídeo usa la de su idioma) y, de paso, se
fotografía abierta en Inicio con los once temas: `public/island-themes/<es|en>/<tema>.webp`,
que usa «Toma los colores de tu tema».

| Clip | Uso | Marcas (`src/clips.ts`) |
| --- | --- | --- |
| `theme-switch.mp4` | «Cambia de tema en vivo.» | segundos en los que el cambio ya se ve |
| `island-open-<es\|en>.mp4` | «Se abre desde el reloj.» | clic en el reloj |

Las marcas de `src/clips.ts` están medidas sobre el vídeo (no sobre el registro) y deciden en
qué fotograma empieza cada tramo: así el cambio de tema y el clic caen justo en un pulso. Si
falta un clip, la escena usa capturas fijas.

## Sonido

### Música

Suena «Limit 70», de Kevin MacLeod (electrónica tranquila, piano eléctrico y sintetizadores),
llevada de 102,65 a 100 BPM para que un pulso dure exactamente 36 fotogramas:

> «Limit 70» Kevin MacLeod (incompetech.com)
> Licensed under Creative Commons: By Attribution 4.0 License
> http://creativecommons.org/licenses/by/4.0/
>
> Pista: <https://incompetech.filmmusic.io/song/5710-limit-70>

Arreglo (los tiempos salen de `src/timeline.json`):

- **Gancho**: el tema completo arranca en el fotograma 0 con un golpe grave; un tick suave en
  cada tema del desfile.
- **Carruseles y en vivo**: tema completo; un tick en cada cambio de tema que se ve.
- **«Y uno propio.»**: solo las teclas del puente; en las esquinas, percusión ligera.
- **Paleta, barra, claro u oscuro**: vuelve el tema completo.
- **Un pulso de silencio** con un solo crescendo antes de la isla y vuelta con golpe. En el clic
  sobre el reloj la música cae a un paso bajo y se reabre mientras la isla se abre.
- **Cierre**: teclas y, en el pulso 4, un acorde final de Fa# que se apaga en la sala.

### Efectos

Todos son **síntesis propia** (`scripts/make-audio.py`, solo numpy): no hay muestras de terceros
ni voces sintéticas.

| Efecto | Cómo está hecho | Dónde |
| --- | --- | --- |
| Tick de interfaz | ruido filtrado de 2 ms + dos modos resonantes amortiguados + «toc» grave, saturación suave, sala corta | desfile, cambios de tema, carruseles, paleta, barra, clic en el reloj, pestañas |
| Golpe grave | barrido 68→38 Hz con envolvente real, transitorio de ruido grave, saturación asimétrica | fotograma 0, vuelta tras el silencio, firma |
| Tono de la isla | campana suave (parciales 1, 2, 3, 4,07, 5,4), Fa#5 + Do#6, sala larga | se asoma y se abre la isla, firma |
| Crescendo | ruido con paso alto ascendente que acaba en seco | el pulso de silencio antes de la isla |
| Soplido | ruido rosa con paso banda que sube y baja | solo al reordenarse la rejilla |

La tabla de eventos (fotograma, tipo y motivo) está en `cues()`; si cambias tiempos internos de
una escena, actualízala allí. Las duraciones de escena no hace falta tocarlas: se leen de
`src/timeline.json`.

### Regenerar el audio

Requisitos: `python3` con numpy, `ffmpeg` y `rubberband`. El MP3 original no se versiona:

```bash
curl -o "Limit 70.mp3" "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Limit%2070.mp3"
python3 scripts/make-audio.py "Limit 70.mp3"                 # public/audio/mix-h.m4a y mix-v.m4a
python3 scripts/make-audio.py "Limit 70.mp3" --stems /tmp/st  # además: música, efectos y eventos por separado
```

El resultado es determinista. Máster: horizontal a −16 LUFS y reel a −14 LUFS integrados, pico
real ≤ −1 dBTP (limitador con sobremuestreo ×4, medido sobre el AAC final). Ya incluye fundidos
y nivel, así que `src/music.ts` usa volumen 1. Sin sonido: `MUSIC_HORIZONTAL = null` y
`MUSIC_VERTICAL = null`.

**Si publicas el vídeo, incluye el crédito de la música en la descripción** (también sale en
letra pequeña en el cierre).

## Notas

- Textos en español e inglés (`src/i18n.tsx`); los nombres de los temas no se traducen. Nombres
  y descripciones salen de `portfolio/src/data/omarchy-themes.json` (copiado a `src/themes.json`).
- «Contraste AA»: todos los colores de cada paleta tienen ≥ 4,5:1 sobre su fondo (comprobado).
- Logotipo: según `~/Streaming/diseno/MARCA.md` §0 (sin espejar, sin brillos, sombras ni
  degradados; solo fundido y escala al entrar).
- Sin relación con Apple ni Microsoft.

## Licencias

- Código y escenas: [MIT](LICENSE).
- Fuentes: Inter y JetBrains Mono, bajo SIL Open Font License 1.1
  ([Inter-OFL.txt](public/fonts/Inter-OFL.txt), [JetBrainsMono-OFL.txt](public/fonts/JetBrainsMono-OFL.txt)).
- Música: «Limit 70» de Kevin MacLeod ([incompetech.com](https://incompetech.com)), bajo
  [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) (CC BY 4.0).
  Crédito: «Limit 70» Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By
  Attribution 4.0 License, <http://creativecommons.org/licenses/by/4.0/>. Los `.m4a` de
  `public/audio/` contienen una versión arreglada (cortes, silencios, filtros, tempo, volumen) mezclada
  con los efectos; la música **no** entra en la MIT.
- Efectos de sonido: síntesis propia (`scripts/make-audio.py`), bajo la MIT como el resto del código.
- Remotion se instala como dependencia y tiene [su propia licencia](https://www.remotion.dev/license)
  (gratis para personas y equipos pequeños).
- El logotipo (`public/marca/`) y el nombre «thealejandro» son marca del autor: **no** entran en la MIT.
  Si reutilizas el proyecto, cámbialos por los tuyos.
- Fondos y capturas de los temas: de [omarchy-themes](https://github.com/thealejandro/omarchy-themes), MIT.
- Omarchy es de sus autores; este vídeo no es oficial.
