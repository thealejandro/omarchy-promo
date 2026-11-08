// Pista de audio opcional. Ver README.md, sección «Música».
// - 'audio/pad.m4a' es un pad ambiental sintetizado con ffmpeg (scripts/make-pad.sh): libre de derechos.
// - Para usar una pista libre (CC0/CC-BY con atribución), cópiala a public/audio/ y cambia `src`.
// - Pon `MUSIC = null` para un vídeo sin sonido.
export const MUSIC: {src: string; volume: number} | null = {src: 'audio/pad.m4a', volume: 0.8};
