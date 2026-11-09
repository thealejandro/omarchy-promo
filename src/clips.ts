// Clips grabados en vivo con scripts/capture-clips.sh (escritorio 9, sin datos personales).
// Ver README.md, sección «Clips en vivo».
//
// `marks` son los segundos del clip en los que pasa algo (el cambio de tema, el clic en el reloj):
// las escenas los ponen justo en un pulso de la música. Con `null` las escenas usan capturas fijas.

import type {Lang} from './i18n';

export type Clip = {
  /** Ruta dentro de public/, p. ej. 'clips/island-open.mp4'. */
  src: string;
  /** Duración del clip, en segundos. */
  duration: number;
  /** Segundos del clip con las acciones que se sincronizan con la música. */
  marks: number[];
};

export const CLIPS: {
  /** Cursor al reloj, clic y se abre la isla (Inicio → Calendario), en el idioma del vídeo. marks: [clic]. */
  islandOpen: Record<Lang, Clip> | null;
  /** Cupertino → Tahoe → Aero Night → Obsidiana → Fluent Light. marks: un cambio cada uno. */
  themeSwitch: Clip | null;
} = {
  // marks medidos en el vídeo (primer fotograma que cambia), no en el registro: el grabador va ~0,5 s por detrás.
  islandOpen: {
    es: {src: 'clips/island-open-es.mp4', duration: 6.9, marks: [3.05]},
    en: {src: 'clips/island-open-en.mp4', duration: 6.9, marks: [3.07]},
  },
  themeSwitch: {src: 'clips/theme-switch.mp4', duration: 18.85, marks: [2.98, 6.8, 10.65, 14.48]},
};

/** Temas del clip de cambio de tema, en orden (el primero es el de partida). */
export const THEME_SWITCH_SLUGS = ['cupertino', 'tahoe', 'aero-night', 'obsidiana', 'fluent-light'];
