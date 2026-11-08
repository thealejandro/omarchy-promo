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
  audio/              música editada (limit70-h.m4a, limit70-v.m4a; scripts/make-music.sh)
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

## Música

Suena «Limit 70», de Kevin MacLeod (electrónica tranquila a 102,65 BPM, piano eléctrico y
sintetizadores), editada para encajar con el montaje:

> «Limit 70» Kevin MacLeod (incompetech.com)
> Licensed under Creative Commons: By Attribution 4.0 License
> http://creativecommons.org/licenses/by/4.0/
>
> Pista: <https://incompetech.filmmusic.io/song/5710-limit-70>

Los archivos `public/audio/limit70-h.m4a` (88,6 s) y `limit70-v.m4a` (45,1 s) los genera
`scripts/make-music.sh` a partir del original: cortes en compás, fundidos de entrada y salida, un
ajuste de tempo de ~1 % para que el golpe, la subida y el final queden en las escenas «Once temas»,
«Y una isla.» y el cierre, y normalización a −16 LUFS. El original no se versiona:

```bash
curl -o "Limit 70.mp3" "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Limit%2070.mp3"
scripts/make-music.sh "Limit 70.mp3"
```

Los fundidos y el nivel van dentro del audio, así que `src/music.ts` usa volumen 1. Para cambiar
la pista, edita `src/music.ts` (y los compases de `scripts/make-music.sh`); sin sonido:
`MUSIC_HORIZONTAL = null` y `MUSIC_VERTICAL = null`. Si cambias las duraciones de las escenas,
los cortes dejan de caer en el compás: mantén la rejilla de 102,65 BPM.

**Si publicas el vídeo, incluye el crédito de arriba en la descripción.**

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
  `public/audio/` son una versión editada (cortes, fundidos, tempo ±1 %, volumen); **no** entran en la MIT.
- Remotion se instala como dependencia y tiene [su propia licencia](https://www.remotion.dev/license)
  (gratis para personas y equipos pequeños).
- El logotipo (`public/marca/`) y el nombre «thealejandro» son marca del autor: **no** entran en la MIT.
  Si reutilizas el proyecto, cámbialos por los tuyos.
- Fondos y capturas de los temas: de [omarchy-themes](https://github.com/thealejandro/omarchy-themes), MIT.
- Omarchy es de sus autores; este vídeo no es oficial.
