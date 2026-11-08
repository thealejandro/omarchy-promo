import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT, Monitor, Words, monitorHeight, shot} from './lib';
import {Aurora, GRAD} from './scenes/Intro';

const SIDE = [
  {slug: 'cupertino-light', x: -560, sc: 0.62, z: 1},
  {slug: 'aero-night', x: 560, sc: 0.62, z: 1},
  {slug: 'big-sur', x: 0, sc: 0.8, z: 2},
];

export const Poster: React.FC = () => {
  const mw = 1100;
  const mh = monitorHeight(mw);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Aurora opacity={0.22} />
      <div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Words text="Omarchy," start={-200} size={110} weight={600} />
        <Words text="a tu manera." start={-200} size={110} weight={300} gradient={GRAD} />
      </div>
      <div
        style={{position: 'absolute', top: 214, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontSize: 36, color: C.dim}}
      >
        Once temas y una isla para tu escritorio.
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
      <Img
        src={staticFile('marca/logotipo.svg')}
        style={{position: 'absolute', right: 56, bottom: 62, width: 210, height: 'auto', zIndex: 3}}
      />
    </AbsoluteFill>
  );
};
