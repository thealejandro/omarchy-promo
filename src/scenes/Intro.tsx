import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, Center, FadeText, Words, useIsVertical, useSceneFade} from '../lib';

const ORBS = [
  {c: '#0a84ff', x: 30, y: 40, r: 38, sp: 0.0021},
  {c: '#bf5af2', x: 68, y: 55, r: 34, sp: 0.0017},
  {c: '#ff7eb6', x: 50, y: 70, r: 30, sp: 0.0025},
  {c: '#3ddc97', x: 80, y: 30, r: 22, sp: 0.0019},
];

/** Luces suaves que derivan detrás del titular. */
export const Aurora: React.FC<{opacity?: number}> = ({opacity = 0.32}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity}}>
      {ORBS.map((o, i) => {
        const x = o.x + Math.sin(frame * o.sp * 6 + i) * 6;
        const y = o.y + Math.cos(frame * o.sp * 5 + i * 2) * 5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: `${o.r}vmax`,
              height: `${o.r}vmax`,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${o.c} 0%, rgba(0,0,0,0) 65%)`,
              filter: 'blur(40px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const GRAD = 'linear-gradient(95deg, #5ac8fa 0%, #7d7aff 38%, #bf5af2 65%, #ff7eb6 100%)';

export const Intro: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const V = useIsVertical();
  const fade = useSceneFade(dur, 0, 24);
  const glow = interpolate(frame, [0, 90], [0, 1], {extrapolateRight: 'clamp'});
  const exit = dur - 60;
  return (
    <AbsoluteFill style={{background: C.bg, opacity: fade}}>
      <Aurora opacity={0.26 * glow} />
      <Center style={{flexDirection: 'column', gap: V ? 50 : 40}}>
        <div style={{display: 'flex', flexDirection: V ? 'column' : 'row', alignItems: 'center'}}>
          <Words text="Omarchy," start={18} size={V ? 150 : 168} weight={600} exitAt={exit} />
          <Words
            text={V ? 'a tu\nmanera.' : 'a tu manera.'}
            start={44}
            stagger={8}
            size={V ? 150 : 168}
            weight={300}
            gradient={GRAD}
            exitAt={exit + 4}
          />
        </div>
        <FadeText
          start={110}
          exitAt={exit}
          style={{fontSize: V ? 40 : 40, fontWeight: 400, color: C.dim, letterSpacing: '-0.01em', textAlign: 'center'}}
        >
          {V ? (
            <>
              Once temas y una isla
              <br />
              para tu escritorio.
            </>
          ) : (
            'Once temas y una isla para tu escritorio.'
          )}
        </FadeText>
      </Center>
    </AbsoluteFill>
  );
};
