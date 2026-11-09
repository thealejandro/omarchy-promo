import React from 'react';
import {CLIPS} from './clips';
import {LangProvider, useLang, useT, type Lang} from './i18n';
import {MACOS, WINDOWS} from './lib';
import {MUSIC_HORIZONTAL, MUSIC_VERTICAL} from './music';
import {Timeline, type SceneRender, type Version} from './Timeline';
import {Close} from './scenes/Close';
import {Bars, Corners, LightDark, Palette} from './scenes/Details';
import {Carousel, Propio} from './scenes/Families';
import {Hook} from './scenes/Hook';
import {IslandColors, IslandEdges, IslandIntro, IslandOpen, IslandPeek} from './scenes/Island';
import {LiveIsland, LiveTheme} from './scenes/Live';
import {OnceTemas} from './scenes/OnceTemas';

export type PromoProps = {lang: Lang};

/** Escenas por id; el orden y la duración (en pulsos) están en src/timeline.json. */
const useScenes = (v: Version): Record<string, SceneRender> => {
  const t = useT();
  const V = v === 'v';
  const lang = useLang();
  const island = CLIPS.islandOpen?.[lang] ?? null; // la isla habla el idioma del vídeo
  return {
    hook: (d) => <Hook dur={d} />,
    once: (d) => <OnceTemas dur={d} />,
    live: (d) => <LiveTheme dur={d} changes={V ? 3 : 4} />,
    // El primer cambio del carrusel cae en el pulso 2 (horizontal) o 1 (vertical).
    macos: (d) => <Carousel dur={d} title={V ? t.macV : t.mac} slugs={MACOS} first={V ? 1 : 2} />,
    windows: (d) => <Carousel dur={d} title={V ? t.winV : t.win} slugs={WINDOWS} first={V ? 1 : 2} />,
    propio: (d) => <Propio dur={d} />,
    esquinas: (d) => <Corners dur={d} />,
    paleta: (d) => <Palette dur={d} />,
    barra: (d) => <Bars dur={d} />,
    claro: (d) => <LightDark dur={d} />,
    isla: (d) => <IslandIntro dur={d} />,
    vistazo: (d) => <IslandPeek dur={d} />,
    abierta: (d) => (island ? <LiveIsland dur={d} clip={island} /> : <IslandOpen dur={d} />),
    bordes: (d) => <IslandEdges dur={d} />,
    colores: (d) => <IslandColors dur={d} />,
    cierre: (d) => <Close dur={d} />,
  };
};

const Scenes: React.FC<{v: Version; lang: Lang}> = ({v, lang}) => (
  <Timeline version={v} lang={lang} scenes={useScenes(v)} music={v === 'h' ? MUSIC_HORIZONTAL : MUSIC_VERTICAL} />
);

// useT() lee el idioma del contexto, así que la lista de escenas se arma dentro del proveedor.
export const Promo: React.FC<PromoProps> = ({lang}) => (
  <LangProvider lang={lang}>
    <Scenes v="h" lang={lang} />
  </LangProvider>
);

export const Reel: React.FC<PromoProps> = ({lang}) => (
  <LangProvider lang={lang}>
    <Scenes v="v" lang={lang} />
  </LangProvider>
);
