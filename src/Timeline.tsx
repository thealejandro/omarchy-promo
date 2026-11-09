import React from 'react';
import {AbsoluteFill, Audio, Easing, staticFile} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {LangProvider, type Lang} from './i18n';
import type {Music} from './music';
import timeline from './timeline.json';

export type Version = 'h' | 'v';
type Entry = {id: string; beats: number; tr?: number; fx?: string};
export type SceneRender = (dur: number) => React.ReactNode;

export const BEAT = timeline.beat;
export const entries = (v: Version) => timeline[v] as Entry[];

/** Fotograma (absoluto) en el que empieza cada escena: siempre en un pulso. */
export const sceneStarts = (v: Version) => {
  const out: Record<string, number> = {};
  let t = 0;
  for (const e of entries(v)) {
    out[e.id] = t;
    t += e.beats * BEAT;
  }
  out._end = t;
  return out;
};

/** Duración total: la suma de los pulsos (las transiciones se solapan dentro de la escena saliente). */
export const totalFrames = (v: Version) => entries(v).reduce((a, e) => a + e.beats * BEAT, 0);

// ---------------------------------------------------------------------------
// «cover»: la escena nueva aparece encima (opacidad, escala y desenfoque) mientras la anterior
// sigue entera debajo y se aleja un poco. Nunca pasa por negro.
// ---------------------------------------------------------------------------
const Cover: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{transform: `scale(${1 + 0.05 * p})`, filter: `brightness(${1 - 0.35 * p})`}}>{children}</AbsoluteFill>;
  }
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(1, p * 1.6),
        transform: `scale(${1.06 - 0.06 * p})`,
        filter: p < 1 ? `blur(${(1 - p) * 16}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
const cover = (): TransitionPresentation<Record<string, never>> => ({component: Cover, props: {}});

const presentation = (fx?: string) => (fx === 'slide' ? slide({direction: 'from-right'}) : cover());
const EASE_T = Easing.bezier(0.33, 0, 0.15, 1);

export const Timeline: React.FC<{
  version: Version;
  lang: Lang;
  scenes: Record<string, SceneRender>;
  music: Music | null;
}> = ({version, lang, scenes, music}) => {
  const list = entries(version);
  return (
    <LangProvider lang={lang}>
      <AbsoluteFill style={{background: '#000'}}>
        <TransitionSeries>
          {list.flatMap((e, i) => {
            const tr = i < list.length - 1 ? (e.tr ?? 0) : 0;
            const dur = e.beats * BEAT + tr;
            const render = scenes[e.id];
            if (!render) throw new Error(`Falta la escena «${e.id}» (${version})`);
            const seq = (
              <TransitionSeries.Sequence key={e.id} name={e.id} durationInFrames={dur} premountFor={30}>
                {render(dur)}
              </TransitionSeries.Sequence>
            );
            if (!tr) return [seq];
            return [
              seq,
              <TransitionSeries.Transition
                key={`${e.id}-tr`}
                timing={linearTiming({durationInFrames: tr, easing: EASE_T})}
                presentation={presentation(e.fx) as TransitionPresentation<Record<string, unknown>>}
              />,
            ];
          })}
        </TransitionSeries>
        {/* Música, efectos y nivel ya van mezclados en el audio: ver scripts/make-audio.py */}
        {music ? <Audio src={staticFile(music.src)} volume={music.volume} /> : null}
      </AbsoluteFill>
    </LangProvider>
  );
};
