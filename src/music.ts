// Pista de audio. Ver README.md, sección «Música».
// «Limit 70» de Kevin MacLeod (incompetech.com), CC BY 4.0, editada con scripts/make-music.sh:
// cortes en compás (102,65 BPM), fundidos y -16 LUFS ya incluidos en los .m4a.
// Pon `MUSIC_HORIZONTAL = null` / `MUSIC_VERTICAL = null` para un vídeo sin sonido.
export type Music = {src: string; volume: number};
export const MUSIC_HORIZONTAL: Music | null = {src: 'audio/limit70-h.m4a', volume: 1};
export const MUSIC_VERTICAL: Music | null = {src: 'audio/limit70-v.m4a', volume: 1};
