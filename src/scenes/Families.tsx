import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Blur} from '../blur';
import {useT} from '../i18n';
import {B, Backdrop, C, EASE, EASE_IO, FONT, Monitor, Words, monitorHeight, ramp, shot, theme, useIsVertical, useSpr, wallpaper} from '../lib';

const MOVE = 22; // fotogramas que tarda en pasar de un tema al siguiente (acaba en el pulso)

/** Posición continua del carrusel: el tema k queda al centro justo en el pulso first + k - 1. */
const useActive = (n: number, first: number) => {
  const frame = useCurrentFrame();
  let act = 0;
  for (let k = 1; k < n; k++) {
    const at = (first + k - 1) * B;
    act += ramp(frame, at - MOVE, at, EASE_IO);
  }
  return act;
};

const Track: React.FC<{slugs: string[]; first: number; enterFrom: number}> = ({slugs, first, enterFrom}) => {
  const frame = useCurrentFrame();
  const {width: W} = useVideoConfig();
  const V = useIsVertical();
  const enter = useSpr(0, 40);
  const act = useActive(slugs.length, first) + (1 - enter) * enterFrom;
  // Horizontal: monitores; vertical: tarjetas grandes a sangre (recorte del escritorio).
  const cw = V ? 900 : 1060;
  const ch = V ? 600 : monitorHeight(cw);
  const cy = V ? 800 : 548;
  const spacing = cw * (V ? 0.86 : 0.8);
  return (
    <AbsoluteFill>
      {slugs
        .map((slug, i) => ({slug, i, d: i - act}))
        .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
        .map(({slug, i, d}) => {
          const ad = Math.min(Math.abs(d), 2.2);
          const sc = 1 - ad * (V ? 0.18 : 0.24);
          const x = W / 2 + d * spacing - Math.sign(d) * ad * ad * spacing * 0.08;
          const op = Math.max(0, 1 - ad * 0.42);
          if (op <= 0.01) return null;
          const local = frame - (first + i - 1) * B;
          const kb = 1 + Math.max(0, Math.min(2 * B, local)) * 0.0006;
          const style: React.CSSProperties = {
            position: 'absolute',
            left: x - cw / 2,
            top: cy - ch / 2,
            transform: `scale(${sc})`,
            opacity: op,
            filter: ad > 0.05 ? `blur(${ad * 3}px) brightness(${1 - ad * 0.25})` : undefined,
          };
          if (V) {
            return (
              <div
                key={slug}
                style={{
                  ...style,
                  width: cw,
                  height: ch,
                  borderRadius: 28,
                  overflow: 'hidden',
                  boxShadow: `0 40px 110px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12)`,
                }}
              >
                <Img
                  src={shot(slug)}
                  style={{position: 'absolute', height: ch, width: (ch * 16) / 9, left: cw / 2 - ((ch * 16) / 9) * 0.56, transform: `scale(${kb * 1.04})`}}
                />
              </div>
            );
          }
          return (
            <div key={slug} style={style}>
              <Monitor w={cw} reflection glow={ad < 0.5 ? theme(slug).palette.accent : undefined}>
                {({w, h}) => <Img src={shot(slug)} style={{width: w, height: h, transform: `scale(${kb})`, transformOrigin: '50% 40%'}} />}
              </Monitor>
            </div>
          );
        })}
    </AbsoluteFill>
  );
};

/** Carrusel: el activo al centro, los demás se alejan y se desenfocan. Cada cambio cae en un pulso. */
export const Carousel: React.FC<{dur: number; title: string; slugs: string[]; first: number}> = ({title, slugs, first}) => {
  const frame = useCurrentFrame();
  const V = useIsVertical();
  const t = useT();
  const act = useActive(slugs.length, first);
  const cur = Math.round(Math.min(slugs.length - 1, Math.max(0, act)));
  const entering = frame < 24; // entra ya en movimiento: el corte cae sobre el monitor, nunca en vacío
  const moving = entering || slugs.some((_, k) => {
    if (k === 0) return false;
    const at = (first + k - 1) * B;
    return frame >= at - MOVE && frame <= at;
  });
  const mh = V ? 600 : monitorHeight(1060);
  const cy = V ? 800 : 548;
  return (
    <AbsoluteFill>
      <Backdrop tint={theme(slugs[cur]).palette.accent} intensity={0.3} y="55%" />
      <div style={{position: 'absolute', top: V ? 290 : 60, left: 0, right: 0}}>
        <Words text={title} start={0} size={V ? 88 : 92} weight={650} />
      </div>
      <Blur active={moving}>
        <Track slugs={slugs} first={first} enterFrom={-0.5} />
      </Blur>
      {slugs.map((slug, i) => {
        const d = i - act;
        const p = Math.max(0, 1 - Math.abs(d) * 2.2);
        if (p <= 0) return null;
        return (
          <div
            key={slug}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: cy + mh / 2 + (V ? 34 : 60),
              textAlign: 'center',
              fontFamily: FONT,
              opacity: p,
              transform: `translateX(${-d * 80}px)`,
              filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
            }}
          >
            <div style={{fontSize: V ? 60 : 58, fontWeight: 650, color: C.text, letterSpacing: '-0.025em', lineHeight: 1.1}}>
              {theme(slug).name}
            </div>
            <div style={{fontSize: V ? 32 : 30, fontWeight: 400, color: C.dim, marginTop: 6}}>{t.inspiration[slug]}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** «Y uno propio.»: Obsidiana sobre su propio fondo de pantalla. */
export const Propio: React.FC<{dur: number}> = () => {
  const frame = useCurrentFrame();
  const V = useIsVertical();
  const t = useT();
  const th = theme('obsidiana');
  const rise = useSpr(4, 40);
  const mw = V ? 1000 : 1180;
  const mh = monitorHeight(mw);
  const blur = interpolate(frame, [0, 40], [0, 26], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dim = interpolate(frame, [0, 40], [0.15, 0.62], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kb = 1.16 - frame * 0.0004;
  const cy = V ? 780 : 560;
  const label = ramp(frame, 30, 54, EASE);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Img
        src={wallpaper('obsidiana')}
        style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kb})`, filter: `blur(${blur}px)`}}
      />
      <AbsoluteFill style={{background: `rgba(0,0,0,${dim})`}} />
      <div style={{position: 'absolute', top: V ? 290 : 60, left: 0, right: 0}}>
        <Words text={t.own} start={0} size={V ? 104 : 92} weight={650} />
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
        <Monitor w={mw} glow={th.palette.accent} reflection={!V}>
          {({w, h}) => <Img src={shot('obsidiana')} style={{width: w, height: h, transform: `scale(${1.0 + frame * 0.0004})`}} />}
        </Monitor>
      </div>
      <div
        style={{
          position: 'absolute',
          left: V ? 65 : 0,
          right: V ? 65 : 0,
          top: cy + mh / 2 + (V ? 50 : 40),
          textAlign: 'center',
          fontFamily: FONT,
          opacity: label,
          transform: `translateY(${(1 - label) * 20}px)`,
        }}
      >
        <div style={{fontSize: V ? 68 : 58, fontWeight: 650, color: C.text, letterSpacing: '-0.025em'}}>Obsidiana</div>
        <div style={{fontSize: V ? 34 : 30, fontWeight: 400, color: '#c7c7cc', marginTop: 8, lineHeight: 1.3}}>{t.ownDesc}</div>
      </div>
    </AbsoluteFill>
  );
};
