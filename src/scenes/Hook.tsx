import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {B, C, EASE, FONT, Words, ramp, shot, theme, useIsVertical} from '../lib';
import {useT} from '../i18n';
import {GRAD} from './Intro';

// Desfile a sangre desde el fotograma 0: un tema cada medio pulso, alternando familias y modos
// para que cada corte se note. Acaba en Cupertino, que es donde empieza la escena siguiente
// (la rejilla en horizontal, el clip en vivo en vertical).
export const PARADE = [
  'big-sur',
  'fluent-light',
  'obsidiana',
  'tahoe',
  'aero-night',
  'ventura',
  'cupertino-light',
  'fluent',
  'graphite',
  'aero',
  'cupertino',
];
export const PARADE_STEP = B / 2;

export const Hook: React.FC<{dur: number}> = () => {
  const frame = useCurrentFrame();
  const V = useIsVertical();
  const t = useT();
  const idx = Math.min(PARADE.length - 1, Math.floor(frame / PARADE_STEP));
  const slug = PARADE[idx];
  const local = frame - idx * PARADE_STEP;
  const last = idx === PARADE.length - 1;
  // Cada imagen entra con un pequeño golpe de escala; la última se queda y avanza despacio.
  const pop = last ? 1.0 + Math.max(0, 6 - local) * 0.006 : 1.07 - Math.min(1, local / PARADE_STEP) * 0.05;
  const settle = last ? 1 + Math.max(0, local - 6) * 0.0006 : 1;
  const nameIn = ramp(local, 0, 6, EASE);
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <Img
        src={shot(slug)}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: V ? '62% 50%' : '50% 50%', // en vertical, centrado en las ventanas
          transform: `scale(${pop * settle})`,
        }}
      />
      {/* Velo para que el titular se lea sobre cualquier tema, claro u oscuro. */}
      <AbsoluteFill
        style={{
          background: V
            ? 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.15) 62%, rgba(0,0,0,0.0) 100%)'
            : 'radial-gradient(75% 70% at 50% 50%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.25) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: V ? 'flex-start' : 'center',
          paddingTop: V ? 300 : 0,
          flexDirection: 'column',
        }}
      >
        <div style={{display: 'flex', flexDirection: V ? 'column' : 'row', alignItems: 'center'}}>
          <Words text={t.hookA} start={2} stagger={4} size={V ? 132 : 176} weight={650} />
          <Words text={t.hookB} start={10} stagger={5} size={V ? 132 : 176} weight={300} gradient={GRAD} />
        </div>
        <div
          style={{
            marginTop: V ? 34 : 26,
            fontFamily: FONT,
            fontSize: V ? 52 : 50,
            fontWeight: 500,
            color: C.text,
            letterSpacing: '-0.01em',
            opacity: ramp(frame, 24, 40, EASE),
            transform: `translateY(${(1 - ramp(frame, 24, 40, EASE)) * 16}px)`,
          }}
        >
          {t.hookSub}
        </div>
      </AbsoluteFill>
      {/* Nombre del tema que se ve: dentro de la zona segura en vertical. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: V ? 1120 : 930,
          textAlign: 'center',
          fontFamily: FONT,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: V ? '14px 34px' : '12px 30px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.55)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
            fontSize: V ? 44 : 36,
            fontWeight: 600,
            color: C.text,
            letterSpacing: '-0.01em',
            opacity: 0.6 + 0.4 * nameIn,
          }}
        >
          <span style={{display: 'inline-block', width: 14, height: 14, borderRadius: 7, marginRight: 16, background: theme(slug).palette.accent, verticalAlign: 'middle'}} />
          {theme(slug).name}
        </span>
      </div>
    </AbsoluteFill>
  );
};
