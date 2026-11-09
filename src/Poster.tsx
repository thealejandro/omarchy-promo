import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {LangProvider, useT, type Lang} from './i18n';
import {C, FONT, Monitor, Words, monitorHeight, shot} from './lib';
import {Aurora, GRAD} from './scenes/Intro';

const SIDE = [
  {slug: 'cupertino-light', x: -560, sc: 0.62, z: 1},
  {slug: 'aero-night', x: 560, sc: 0.62, z: 1},
  {slug: 'big-sur', x: 0, sc: 0.8, z: 2},
];

const PosterBody: React.FC = () => {
  const t = useT();
  const mw = 1100;
  const mh = monitorHeight(mw);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Aurora opacity={0.22} />
      <div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Words text={t.hookA} start={-200} size={110} weight={650} />
        <Words text={t.hookB} start={-200} size={110} weight={300} gradient={GRAD} />
      </div>
      <div style={{position: 'absolute', top: 214, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontSize: 38, color: C.dim}}>
        {t.hookSub}
      </div>
      {SIDE.map((m) => (
        <div
          key={m.slug}
          style={{
            position: 'absolute',
            left: 960 + m.x - mw / 2,
            top: 640 - mh / 2 + (m.z === 1 ? 30 : 0),
            transform: `scale(${m.sc})`,
            zIndex: m.z,
            filter: m.z === 1 ? 'brightness(0.75)' : undefined,
          }}
        >
          <Monitor w={mw} reflection={m.z === 2} glow={m.z === 2 ? '#bf5af2' : undefined}>
            {({w, h}) => <Img src={shot(m.slug)} style={{width: w, height: h}} />}
          </Monitor>
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          bottom: 52,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: 34,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: C.text,
          zIndex: 3,
        }}
      >
        thealejandro.dev/omarchy
      </div>
      <Img src={staticFile('marca/logotipo.svg')} style={{position: 'absolute', right: 56, bottom: 62, width: 210, height: 'auto', zIndex: 3}} />
    </AbsoluteFill>
  );
};

export const Poster: React.FC<{lang: Lang}> = ({lang}) => (
  <LangProvider lang={lang}>
    <PosterBody />
  </LangProvider>
);

// ---------------------------------------------------------------------------
// Portada del reel (1080x1920). Instagram la recorta a 3:4 en la cuadrícula del perfil
// (1080x1440 centrado: y 240-1680), así que todo lo importante va dentro de esa franja.
// ---------------------------------------------------------------------------
const FAN = [
  {slug: 'fluent-light', r: -9, x: -250, y: 40},
  {slug: 'obsidiana', r: 9, x: 250, y: 40},
  {slug: 'big-sur', r: 0, x: 0, y: 0},
];

const CoverBody: React.FC = () => {
  const t = useT();
  const cw = 600;
  const ch = 760;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Aurora opacity={0.3} />
      <div style={{position: 'absolute', top: 330, left: 0, right: 0}}>
        {/* Mismo mensaje que el gancho del reel: quién, para qué y que es gratis. */}
        <Words text={t.hookV} start={-200} size={124} weight={650} />
      </div>
      {FAN.map((f, i) => (
        <div
          key={f.slug}
          style={{
            position: 'absolute',
            left: 540 - cw / 2 + f.x,
            top: 690 + f.y,
            width: cw,
            height: ch,
            borderRadius: 34,
            overflow: 'hidden',
            transform: `rotate(${f.r}deg) scale(${i === 2 ? 1 : 0.86})`,
            filter: i === 2 ? undefined : 'brightness(0.7)',
            boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.14)',
          }}
        >
          <Img src={shot(f.slug)} style={{position: 'absolute', height: ch, width: (ch * 16) / 9, left: cw / 2 - ((ch * 16) / 9) * 0.6}} />
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          top: 1490,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <div style={{fontFamily: FONT, fontSize: 50, fontWeight: 600, color: C.text, letterSpacing: '-0.015em', textAlign: 'center', maxWidth: 950}}>{t.hookSubV}</div>
        <Img src={staticFile('marca/logotipo.svg')} style={{width: 340, height: 'auto'}} />
      </div>
    </AbsoluteFill>
  );
};

export const Cover: React.FC<{lang: Lang}> = ({lang}) => (
  <LangProvider lang={lang}>
    <CoverBody />
  </LangProvider>
);
