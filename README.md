# omarchy-promo

Vídeo promocional (estilo keynote) de los once temas de Omarchy de thealejandro y del
plugin [omarchy-island](https://github.com/thealejandro/omarchy-island), hecho con
[Remotion](https://www.remotion.dev) (React → MP4, render determinista).

Solo usa capturas reales: nada se graba de la pantalla al renderizar.

## Salidas

| Archivo | Formato | Duración |
| --- | --- | --- |
| `out/omarchy-promo.mp4` | 1920×1080, 60 fps, H.264 yuv420p CRF 18, faststart, AAC | ~88,6 s |
| `out/omarchy-promo-vertical.mp4` | 1080×1920, 60 fps, mismo códec | ~45,1 s |
| `out/poster.jpg` | 1920×1080 | — |

## Uso

```bash
npm install
npm run assets     # copia capturas, variantes, fondos e isla a public/ (solo lee archivos)
npm run studio     # vista previa interactiva en el navegador
npm run build      # renderiza los dos vídeos y el póster
# o por separado: npm run render | npm run render:vertical | npm run poster
```

Vista previa rápida a media resolución:

```bash
npx remotion render Promo out/preview.mp4 --scale=0.5
```

## Estructura

```
src/
  Root.tsx            composiciones: Promo, PromoVertical, Poster
  Promo.tsx           lista de escenas del vídeo horizontal (duraciones en segundos)
  PromoVertical.tsx   lista de escenas del vertical (mismas escenas, maquetación vertical)
  lib.tsx             datos de temas, fuentes, titulares palabra a palabra, Monitor, ZoomImg…
  clips.ts            clips en vivo opcionales
  music.ts            pistas de audio (horizontal y vertical)
  scenes/             Intro, OnceTemas, Families (carrusel + Obsidiana), Details
                      (esquinas, paleta, barra, claro/oscuro), Island, Close
public/
  shots/ extras/ backgrounds/ island/   material real (npm run assets)
  fonts/              Inter y JetBrains Mono (OFL), empaquetadas: render sin red
  marca/logotipo.svg  logotipo de thealejandro (copia de ~/Streaming/marca; no se modifica)
  audio/              sonido final: música + efectos (mix-h.m4a, mix-v.m4a; scripts/make-audio.py)
  clips/              aquí van los clips grabados en vivo
```

Escenas (horizontal): «Omarchy, a tu manera.» → «Once temas.» (montaje + rejilla que se
reordena por familia) → «Inspirados en macOS.» → «Inspirados en Windows.» → «Y uno propio.»
→ esquinas y bordes con degradado (dolly) → paleta (los colores salen de la captura y
cambian de tema) → barra opaca / cristal / transparente → claro u oscuro (barrido) →
«Y una isla.» (vistazo, se abre desde el reloj, páginas, agenda, hora mundial, clima,
cualquier borde, colores del tema) → comando de instalación, thealejandro.dev/omarchy y firma
con el logotipo («Hecho por thealejandro»).

## Clips en vivo

La composición tiene dos huecos preparados para clips grabados (no incluidos):

| Hueco | Archivo sugerido | Qué sustituye |
| --- | --- | --- |
| `islandOpen` | `public/clips/island-open.mp4` | la escena «Se abre desde el reloj» (capturas fijas) |
| `themeSwitch` | `public/clips/theme-switch.mp4` | se inserta tras «Toma los colores de tu tema» |

1. Graba el clip (16:9, idealmente 1920×1080 a 60 fps; se recorta con `object-fit: cover`).
2. Cópialo a `public/clips/`.
3. En `src/clips.ts` descomenta/rellena su entrada:
   ```ts
   islandOpen: {src: 'clips/island-open.mp4', start: 1.5, duration: 6, caption: 'Se abre desde el reloj.'},
   ```
   `start` y `duration` son segundos del clip; la duración total del vídeo se recalcula sola.
4. `npm run build`.

El clip se muestra dentro del mismo marco de monitor, sin audio.

## Sonido

### Música

Suena «Limit 70», de Kevin MacLeod (electrónica tranquila a 102,65 BPM, piano eléctrico y
sintetizadores), arreglada para el montaje:

> «Limit 70» Kevin MacLeod (incompetech.com)
> Licensed under Creative Commons: By Attribution 4.0 License
> http://creativecommons.org/licenses/by/4.0/
>
> Pista: <https://incompetech.filmmusic.io/song/5710-limit-70>

El arreglo es minimalista y respira con la imagen; no suena igual todo el rato:

- **Intro**: solo la capa suave (piano eléctrico), casi en silencio, con un paso bajo que se va
  abriendo. Se corta en seco un pulso antes de «Once temas.» y vuelve con el tema completo.
- **Carruseles**: tema completo; en «Inspirados en Windows» el filtro se va cerrando.
- **«Y uno propio.»**: se queda en las teclas del puente (−7 dB, filtradas); en las esquinas
  vuelve la percusión ligera y el filtro se abre hasta que entra el tema en la paleta.
- **Claro u oscuro**: agudos un poco más brillantes en el claro; al pasar a oscuro, paso bajo.
- **Silencio** de dos pulsos antes de «Y una isla.», con un soplido inverso casi inaudible, y
  regreso con golpe. Al abrirse la isla la música se hunde (paso bajo a 850 Hz) y se reabre.
- **Cierre**: otra vez solo teclas; al aparecer la URL entra un remate de dos pulsos que acaba en
  seco sobre la firma, con un acorde final de Fa# que se apaga en la sala.

Cada sección se estira con rubberband (±4 % como mucho) para que los golpes caigan en su
fotograma; los cambios armónicos respetan la progresión del original (4 compases en Fa# y 4 en Re#m).

### Efectos

Todos son **síntesis propia** (`scripts/make-audio.py`, solo numpy): no hay muestras de terceros
ni voces sintéticas.

| Efecto | Cómo está hecho | Dónde |
| --- | --- | --- |
| Tick de interfaz | ruido filtrado de 2 ms + dos modos resonantes amortiguados + «toc» grave, saturación suave, sala corta; tono y nivel varían en cada uno | cambios de tema (montaje, carruseles, paleta, barra, claro/oscuro), tarjetas, pestañas de la isla, URL |
| Soplido | ruido rosa estéreo con paso banda que sube y baja y paneo en movimiento | entrada del monitor, rejilla, reordenado, carruseles, «Y uno propio», zoom |
| Golpe grave | barrido 68→38 Hz con envolvente real, transitorio de ruido grave, saturación asimétrica | «Once temas.», «Y una isla.», firma |
| Tono de la isla | campana suave (parciales 1, 2, 3, 4,07, 5,4), Fa#5 + Do#6, sala larga | se asoma y se abre la isla, firma |
| Soplido inverso | ruido con paso alto ascendente que acaba en seco | silencio antes de «Y una isla.» |

Los efectos van siempre por debajo de la música (ticks y soplidos entre −20 y −40 dB por debajo
en RMS; los golpes graves casi solo aportan sub). La tabla completa de eventos (fotograma, tipo y
motivo) está en `cues()` dentro del script; si cambias duraciones o tiempos internos de escena,
actualiza `SCENES_*` y `cues()`.

### Regenerar el audio

Requisitos: `python3` con numpy, `ffmpeg` y `rubberband`. El MP3 original no se versiona:

```bash
curl -o "Limit 70.mp3" "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Limit%2070.mp3"
python3 scripts/make-audio.py "Limit 70.mp3"                 # public/audio/mix-h.m4a y mix-v.m4a
python3 scripts/make-audio.py "Limit 70.mp3" --stems /tmp/st  # además: música, efectos y eventos por separado
```

El resultado es determinista. La mezcla sale a −16 LUFS integrados con pico real ≤ −1 dBTP
(limitador con sobremuestreo ×4) y ya incluye fundidos y nivel, así que `src/music.ts` usa
volumen 1. Sin sonido: `MUSIC_HORIZONTAL = null` y `MUSIC_VERTICAL = null`.

**Si publicas el vídeo, incluye el crédito de la música en la descripción.**

## Notas

- Los textos están en español; nombres y descripciones salen de
  `portfolio/src/data/omarchy-themes.json` (copiado a `src/themes.json`).
- «Contraste AA»: todos los colores de cada paleta tienen ≥ 4,5:1 sobre su fondo (comprobado).
- La isla aún no muestra notificaciones: el vídeo no las menciona.
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
