// Clips grabados en vivo (opcionales). Ver README.md, sección «Clips en vivo».
//
// Pon el archivo en public/clips/ y rellena su entrada. Con `null` la escena usa
// las capturas fijas. `start` y `duration` están en segundos (recorte del clip);
// la duración del vídeo se recalcula sola al renderizar.

export type Clip = {
  /** Ruta dentro de public/, p. ej. 'clips/island-open.mp4'. */
  src: string;
  /** Segundo del clip en el que empieza el tramo usado. */
  start?: number;
  /** Segundos que se usan del clip. */
  duration: number;
  /** Texto que aparece sobre el clip. */
  caption?: string;
};

export const CLIPS: {
  /** Sustituye a «Se abre desde el reloj» en la parte de la isla. */
  islandOpen: Clip | null;
  /** Se inserta después de «Toma los colores de tu tema». */
  themeSwitch: Clip | null;
} = {
  islandOpen: null,
  // islandOpen: {src: 'clips/island-open.mp4', start: 0, duration: 6, caption: 'Se abre desde el reloj.'},
  themeSwitch: null,
  // themeSwitch: {src: 'clips/theme-switch.mp4', start: 0, duration: 5, caption: 'Cambia de tema en vivo.'},
};
