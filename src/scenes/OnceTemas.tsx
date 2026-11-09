import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame, useVideoConfig} from 'remotion';
import {Blur} from '../blur';
import {useT} from '../i18n';
import {B, Backdrop, C, EASE, EASE_IO, FONT, MACOS, WINDOWS, Words, ramp, shot} from '../lib';
import {PARADE} from './Hook';

type Rect = {x: number; y: number; w: number; h: number};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
});

// Rejilla de 4 columnas en el orden del desfile del gancho.
const gridA = (W: number): Record<string, Rect> => {
  const cols = 4;
  const gap = 26;
  const cw = 372;
  const ch = Math.round((cw * 9) / 16);
  const top = 236;
  const out: Record<string, Rect> = {};
  PARADE.forEach((slug, i) => {
    const r = Math.floor(i / cols);
    const inRow = Math.min(cols, PARADE.length - r * cols);
    const rowW = inRow * cw + (inRow - 1) * gap;
    out[slug] = {x: (W - rowW) / 2 + (i % cols) * (cw + gap), y: top + r * (ch + gap), w: cw, h: ch};
  });
  return out;
};

// Misma rejilla, agrupada por familia (macOS arriba; Windows y el propio abajo).
const gridB = (W: number, labels: [string, string, string]) => {
  const out: Record<string, Rect> = {};
  const cw = 272;
  const ch = Math.round((cw * 9) / 16);
  const gap = 20;
  const y1 = 340;
  const y2 = y1 + ch + 130;
  const x1 = (W - (6 * cw + 5 * gap)) / 2;
  MACOS.forEach((s, i) => (out[s] = {x: x1 + i * (cw + gap), y: y1, w: cw, h: ch}));
  const big = 90;
  const x2 = (W - (5 * cw + 3 * gap + big)) / 2;
  WINDOWS.forEach((s, i) => (out[s] = {x: x2 + i * (cw + gap), y: y2, w: cw, h: ch}));
  const xo = x2 + 4 * cw + 3 * gap + big;
  out.obsidiana = {x: xo, y: y2, w: cw, h: ch};
  return {
    rects: out,
    labels: [
      {text: labels[0], x: x1, y: y1 - 62},
      {text: labels[1], x: x2, y: y2 - 62},
      {text: labels[2], x: xo, y: y2 - 62},
    ],
  };
};

const T_SORT = 4 * B; // se reordena en el pulso 4
const SORT_D = 50;


const Cards: React.FC<{A: Record<string, Rect>; Bg: Record<string, Rect>}> = ({A, Bg}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const shrink = ramp(frame, 0, 30, EASE_IO);
  const sortT = ramp(frame, T_SORT, T_SORT + SORT_D, EASE_IO);
  const full: Rect = {x: 0, y: 0, w: W, h: H};
  const lead = PARADE[PARADE.length - 1];

  return (
    <AbsoluteFill>
      {PARADE.map((slug, i) => {
        const isLead = slug === lead;
        const pop = isLead ? 1 : ramp(frame, 8 + i * 2, 30 + i * 2, EASE);
        const from = isLead ? lerpRect(full, A[slug], shrink) : A[slug];
        const r = lerpRect(from, Bg[slug], sortT);
        const lift = Math.sin(sortT * Math.PI) * (i % 2 === 0 ? -34 : 34);
        return (
          <div
            key={slug}
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y + lift,
              width: r.w,
              height: r.h,
              borderRadius: isLead ? lerp(0, 10, shrink) : 10,
              overflow: 'hidden',
              opacity: pop,
              zIndex: isLead ? 2 : 1,
              transform: `scale(${0.86 + 0.14 * pop})`,
              filter: pop < 1 ? `blur(${(1 - pop) * 10}px)` : undefined,
              boxShadow: '0 18px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.10)',
            }}
          >
            <Img src={shot(slug)} style={{width: '100%', height: '100%'}} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Solo horizontal: Cupertino (el último del desfile) se encoge a la rejilla y llegan los demás. */
export const OnceTemas: React.FC<{dur: number}> = () => {
  const frame = useCurrentFrame();
  const {width: W} = useVideoConfig();
  const t = useT();
  const A = gridA(W);
  const Bg = gridB(W, [t.famMac, t.famWin, t.famOwn]);
  return (
    <AbsoluteFill>
      <Backdrop tint="#5e5ce6" intensity={0.22} />
      <div style={{position: 'absolute', top: 56, left: 0, right: 0, opacity: ramp(frame, 10, 24)}}>
        <Words text={t.once} start={8} size={110} weight={650} />
      </div>
      <Blur active={frame >= T_SORT && frame <= T_SORT + SORT_D}>
        <Cards A={A} Bg={Bg.rects} />
      </Blur>
      {Bg.labels.map((l, i) => {
        const p = ramp(frame, T_SORT + 34 + i * 8, T_SORT + 60 + i * 8, EASE);
        return (
          <div
            key={l.text}
            style={{
              position: 'absolute',
              left: l.x,
              top: l.y,
              fontFamily: FONT,
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: '-0.015em',
              color: C.text,
              opacity: p,
              transform: `translateY(${(1 - p) * 14}px)`,
              filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
