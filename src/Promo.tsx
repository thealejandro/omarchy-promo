import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {CLIPS} from './clips';
import {MACOS, WINDOWS, s} from './lib';
import {MUSIC_HORIZONTAL, type Music} from './music';
import {Bars, Corners, LightDark, Palette} from './scenes/Details';
import {Carousel, Propio} from './scenes/Families';
import {Close} from './scenes/Close';
import {Intro} from './scenes/Intro';
import {IslandColors, IslandEdges, IslandIntro, IslandOpen, IslandPeek, LiveClip} from './scenes/Island';
import {OnceTemas} from './scenes/OnceTemas';

export const OVERLAP = 14;

type Scene = {id: string; dur: number; render: (dur: number) => React.ReactNode};

/** Escenas del vídeo horizontal, en orden. Las duraciones están en fotogramas (60 fps). */
export const horizontalScenes = (): Scene[] => {
  const list: Scene[] = [
    {id: 'intro', dur: s(5.5), render: (d) => <Intro dur={d} />},
    {id: 'once-temas', dur: s(10.067), render: (d) => <OnceTemas dur={d} />},
    {id: 'macos', dur: s(8.9), render: (d) => <Carousel dur={d} title="Inspirados en macOS." slugs={MACOS} per={s(1.25)} />},
    {id: 'windows', dur: s(6.017), render: (d) => <Carousel dur={d} title="Inspirados en Windows." slugs={WINDOWS} per={s(1.3)} />},
    {id: 'propio', dur: s(5.433), render: (d) => <Propio dur={d} />},
    {id: 'esquinas', dur: s(6.6), render: (d) => <Corners dur={d} />},
    {id: 'paleta', dur: s(6.583), render: (d) => <Palette dur={d} />},
    {id: 'barra', dur: s(5.433), render: (d) => <Bars dur={d} />},
    {id: 'claro-oscuro', dur: s(6.017), render: (d) => <LightDark dur={d} />},
    {id: 'isla', dur: s(4.867), render: (d) => <IslandIntro dur={d} />},
    {id: 'isla-vistazo', dur: s(3.117), render: (d) => <IslandPeek dur={d} />},
  ];
  if (CLIPS.islandOpen) {
    const c = CLIPS.islandOpen;
    list.push({id: 'clip-isla', dur: s(c.duration), render: (d) => <LiveClip dur={d} clip={c} />});
  } else {
    list.push({id: 'isla-abierta', dur: s(6.6), render: (d) => <IslandOpen dur={d} />});
  }
  list.push({id: 'isla-bordes', dur: s(3.7), render: (d) => <IslandEdges dur={d} />});
  list.push({id: 'isla-colores', dur: s(3.7), render: (d) => <IslandColors dur={d} />});
  if (CLIPS.themeSwitch) {
    const c = CLIPS.themeSwitch;
    list.push({id: 'clip-tema', dur: s(c.duration), render: (d) => <LiveClip dur={d} clip={c} />});
  }
  list.push({id: 'cierre', dur: s(9.367), render: (d) => <Close dur={d} />});
  return list;
};

export const totalFrames = (scenes: Scene[]) =>
  scenes.reduce((a, sc) => a + sc.dur, 0) - OVERLAP * (scenes.length - 1);

export const Timeline: React.FC<{scenes: Scene[]; music?: Music | null}> = ({scenes, music = MUSIC_HORIZONTAL}) => {
  let t = 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {scenes.map((sc) => {
        const from = t;
        t += sc.dur - OVERLAP;
        return (
          <Sequence key={sc.id} name={sc.id} from={from} durationInFrames={sc.dur}>
            {sc.render(sc.dur)}
          </Sequence>
        );
      })}
      {/* Fundidos y nivel (-16 LUFS) ya van horneados en el audio: ver scripts/make-music.sh */}
      {music ? <Audio src={staticFile(music.src)} volume={music.volume} /> : null}
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => <Timeline scenes={horizontalScenes()} />;
