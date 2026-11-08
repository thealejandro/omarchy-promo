import React from 'react';
import {CLIPS} from './clips';
import {MACOS, WINDOWS, s} from './lib';
import {MUSIC_VERTICAL} from './music';
import {Timeline} from './Promo';
import {Close} from './scenes/Close';
import {Carousel, Propio} from './scenes/Families';
import {Intro} from './scenes/Intro';
import {IslandColors, IslandIntro, IslandOpen, LiveClip} from './scenes/Island';
import {OnceTemas} from './scenes/OnceTemas';

/** Versión vertical (1080x1920, ~40 s): reutiliza las escenas con su maquetación vertical. */
export const verticalScenes = () => {
  const list = [
    {id: 'intro', dur: s(3.6), render: (d: number) => <Intro dur={d} />},
    {id: 'once-temas', dur: s(8.917), render: (d: number) => <OnceTemas dur={d} />},
    {id: 'macos', dur: s(5.433), render: (d: number) => <Carousel dur={d} title={'Inspirados\nen macOS.'} slugs={MACOS} per={s(0.75)} />},
    {id: 'windows', dur: s(3.7), render: (d: number) => <Carousel dur={d} title={'Inspirados\nen Windows.'} slugs={WINDOWS} per={s(0.8)} />},
    {id: 'propio', dur: s(3.717), render: (d: number) => <Propio dur={d} />},
    {id: 'isla', dur: s(3.7), render: (d: number) => <IslandIntro dur={d} />},
    CLIPS.islandOpen
      ? {id: 'clip-isla', dur: s(CLIPS.islandOpen.duration), render: (d: number) => <LiveClip dur={d} clip={CLIPS.islandOpen!} />}
      : {id: 'isla-abierta', dur: s(6.017), render: (d: number) => <IslandOpen dur={d} />},
    {id: 'isla-colores', dur: s(2.55), render: (d: number) => <IslandColors dur={d} />},
    {id: 'cierre', dur: s(9.367), render: (d: number) => <Close dur={d} />},
  ];
  return list;
};

export const PromoVertical: React.FC = () => <Timeline scenes={verticalScenes()} music={MUSIC_VERTICAL} />;
