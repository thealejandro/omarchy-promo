import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Backdrop,
  C,
  EASE,
  EASE_IO,
  FONT,
  INSPIRATION,
  Monitor,
  Words,
  monitorHeight,
  ramp,
  shot,
  theme,
  useIsVertical,
  useSceneFade,
  useSpr,
  wallpaper,
} from '../lib';

/** Carrusel de monitores: el activo al centro, los demás se alejan y se desenfocan. */
export const Carousel: React.FC<{dur: number; title: string; slugs: string[]; per: number}> = ({
  dur,
  title,
  slugs,
  per,
}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const V = useIsVertical();
  const fade = useSceneFade(dur, 14, 20);
  const T0 = 34;
  const move = 34;
  let act = 0;
  for (let k = 1; k < slugs.length; k++) act += ramp(frame, T0 + k * per - move, T0 + k * per, EASE_IO);
  const enter = useSpr(10, 60);
  act += (1 - enter) * -1.2; // entra deslizándose desde la derecha

  const mw = V ? 940 : 1060;
  const mh = monitorHeight(mw);
  const cy = V ? H * 0.47 : 545;
  const spacing = mw * (V ? 0.74 : 0.8);
  const cur = Math.round(Math.min(slugs.length - 1, Math.max(0, act)));
  const accent = theme(slugs[cur]).palette.accent;

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Backdrop tint={accent} intensity={0.3} y="55%" />
      <div style={{position: 'absolute', top: V ? 230 : 70, left: 0, right: 0}}>
        <Words text={title} start={0} size={V ? 92 : 84} weight={600} />
      </div>
      {slugs
        .map((slug, i) => ({slug, i, d: i - act}))
        .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
        .map(({slug, i, d}) => {
          const ad = Math.min(Math.abs(d), 2.2);
          const sc = 1 - ad * 0.24;
          const x = W / 2 + d * spacing - (Math.sign(d) * ad * ad * spacing * 0.08);
          const op = Math.max(0, 1 - ad * 0.42) * enter;
          if (op <= 0.01) return null;
          // Ken Burns lento en el activo
          const local = frame - (T0 + i * per - move);
          const kb = 1 + Math.max(0, Math.min(per + move, local)) * 0.0006;
          return (
            <div
              key={slug}
              style={{
                position: 'absolute',
                left: x - mw / 2,
                top: cy - mh / 2,
                transform: `scale(${sc})`,
                opacity: op,
                filter: ad > 0.05 ? `blur(${ad * 3}px) brightness(${1 - ad * 0.25})` : undefined,
              }}
            >
              <Monitor w={mw} reflection glow={ad < 0.5 ? theme(slug).palette.accent : undefined}>
                {({w, h}) => (
                  <Img src={shot(slug)} style={{width: w, height: h, transform: `scale(${kb})`, transformOrigin: '50% 40%'}} />
                )}
              </Monitor>
            </div>
          );
        })}
      {slugs.map((slug, i) => {
        const d = i - act;
        const p = Math.max(0, 1 - Math.abs(d) * 2.2) * enter;
        if (p <= 0) return null;
        const t = theme(slug);
        return (
          <div
            key={slug}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: cy + mh / 2 + (V ? 120 : 62),
              textAlign: 'center',
              fontFamily: FONT,
              opacity: p,
              transform: `translateX(${-d * 80}px)`,
              filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
            }}
          >
            <div style={{fontSize: V ? 64 : 54, fontWeight: 600, color: C.text, letterSpacing: '-0.025em'}}>
              {t.name}
            </div>
            <div style={{fontSize: V ? 34 : 28, fontWeight: 400, color: C.dim, marginTop: 8}}>
              {INSPIRATION[slug]}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** «Y uno propio.»: Obsidiana sobre su propio fondo de pantalla. */
export const Propio: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {height: H} = useVideoConfig();
  const V = useIsVertical();
  const fade = useSceneFade(dur, 14, 22);
  const t = theme('obsidiana');
  const rise = useSpr(40, 70);
  const mw = V ? 960 : 1180;
  const mh = monitorHeight(mw);
  const blur = interpolate(frame, [30, 110], [0, 26], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dim = interpolate(frame, [30, 110], [0.15, 0.62], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kb = 1.16 - frame * 0.00035;
  const cy = V ? H * 0.5 : 560;
  return (
    <AbsoluteFill style={{opacity: fade, background: '#000', overflow: 'hidden'}}>
      <Img
        src={wallpaper('obsidiana')}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${kb})`,
          filter: `blur(${blur}px)`,
        }}
      />
      <AbsoluteFill style={{background: `rgba(0,0,0,${dim})`}} />
      <div style={{position: 'absolute', top: V ? 250 : 64, left: 0, right: 0}}>
        <Words text="Y uno propio." start={6} size={V ? 104 : 84} weight={600} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: cy - mh / 2,
          marginLeft: -mw / 2,
          opacity: rise,
          transform: `translateY(${(1 - rise) * 120}px) scale(${0.92 + 0.08 * rise})`,
        }}
      >
        <Monitor w={mw} glow={t.palette.accent}>
          {({w, h}) => (
            <Img
              src={shot('obsidiana')}
              style={{width: w, height: h, transform: `scale(${1.0 + Math.max(0, frame - 40) * 0.0004})`}}
            />
          )}
        </Monitor>
      </div>
      <div
        style={{
          position: 'absolute',
          left: V ? 60 : 0,
          right: V ? 60 : 0,
          top: cy + mh / 2 + (V ? 110 : 40),
          textAlign: 'center',
          fontFamily: FONT,
          opacity: ramp(frame, 90, 130, EASE),
          transform: `translateY(${(1 - ramp(frame, 90, 130, EASE)) * 20}px)`,
        }}
      >
        <div style={{fontSize: V ? 72 : 56, fontWeight: 600, color: C.text, letterSpacing: '-0.025em'}}>Obsidiana</div>
        <div style={{fontSize: V ? 34 : 28, fontWeight: 400, color: '#c7c7cc', marginTop: 10}}>
          Negro obsidiana, verde jade y un toque ámbar.
        </div>
      </div>
    </AbsoluteFill>
  );
};
