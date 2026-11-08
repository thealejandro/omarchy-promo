// Pista de audio final (música + efectos), ver README.md, sección «Sonido».
// «Limit 70» de Kevin MacLeod (incompetech.com), CC BY 4.0, arreglada con scripts/make-audio.py:
// silencios, cortes secos, filtros por escena y efectos de síntesis propia ya mezclados,
// -16 LUFS y pico real ≤ -1 dBTP incluidos en los .m4a, por eso el volumen es 1.
// Pon `MUSIC_HORIZONTAL = null` / `MUSIC_VERTICAL = null` para un vídeo sin sonido.
export type Music = {src: string; volume: number};
export const MUSIC_HORIZONTAL: Music | null = {src: 'audio/mix-h.m4a', volume: 1};
export const MUSIC_VERTICAL: Music | null = {src: 'audio/mix-v.m4a', volume: 1};
