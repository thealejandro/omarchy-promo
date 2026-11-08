import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, EASE, FONT, MONO, Words, ramp, useIsVertical, useSceneFade, useSpr} from '../lib';
import {Aurora, GRAD} from './Intro';

const CMD1 = 'git clone https://github.com/thealejandro/omarchy-themes';
const CMD2 = 'omarchy-themes/install.sh all';

export const Close: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const V = useIsVertical();
  const fade = useSceneFade(dur, 14, 50);
  const T_CMD = 150;
  const box = useSpr(T_CMD, 45);
  const TYPE0 = T_CMD + 30;
  const cps = 1.6; // caracteres por fotograma
  const full = CMD1 + ' && ' + CMD2;
  const typed = Math.max(0, Math.min(full.length, Math.floor((frame - TYPE0) * cps)));
  const shown = full.slice(0, typed);
  const caretOn = Math.floor(frame / 30) % 2 === 0 || typed < full.length;
  const T_URL = TYPE0 + Math.ceil(full.length / cps) + 40;
  const url = ramp(frame, T_URL, T_URL + 40, EASE);

  // En horizontal todo en una línea; en vertical, dos.
  const lines = V
    ? [shown.slice(0, Math.min(shown.length, CMD1.length + 3)), shown.slice(CMD1.length + 4)]
    : [shown];

  return (
    <AbsoluteFill style={{background: C.bg, opacity: fade}}>
      <Aurora opacity={0.18} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <Words
          text={V ? 'Once temas.\nUna isla.' : 'Once temas. Una isla.'}
          start={6}
          size={V ? 130 : 140}
          weight={600}
          exitAt={T_CMD - 30}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <div
          style={{
            opacity: box,
            transform: `translateY(${(1 - box) * 30 - url * (V ? 170 : 130)}px) scale(${0.97 + 0.03 * box})`,
            filter: box < 1 ? `blur(${(1 - box) * 10}px)` : undefined,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{fontFamily: FONT, fontSize: V ? 54 : 52, fontWeight: 600, color: C.text, letterSpacing: '-0.02em', marginBottom: 36}}>
            Instálalos con un comando.
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: V ? 23 : 27,
              color: '#e5e5ea',
              background: 'rgba(28,28,30,0.85)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 18,
              padding: V ? '28px 34px' : '26px 36px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              width: V ? 960 : 1590,
              boxSizing: 'border-box',
              minHeight: V ? 140 : undefined,
            }}
          >
            {lines.map((l, i) => (
              <div key={i} style={{whiteSpace: 'pre', lineHeight: 1.6}}>
                {i === 0 ? <span style={{color: '#32d74b'}}>$ </span> : <span>  </span>}
                {highlight(l)}
                {i === lines.length - 1 || (V && i === 0 && typed <= CMD1.length + 3) ? (
                  <span style={{opacity: caretOn ? 1 : 0, color: '#0a84ff'}}>▍</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: V ? '54%' : '56%',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONT,
            opacity: url,
            transform: `translateY(${(1 - url) * 30}px)`,
            filter: url < 1 ? `blur(${(1 - url) * 10}px)` : undefined,
          }}
        >
          <div
            style={{
              fontSize: V ? 76 : 88,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              backgroundImage: GRAD,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              paddingBottom: 6,
            }}
          >
            thealejandro.dev/omarchy
          </div>
          <div style={{fontSize: V ? 30 : 30, color: C.dim, marginTop: 18, lineHeight: 1.5}}>
            github.com/thealejandro/omarchy-themes
            {V ? <br /> : <span style={{color: C.faint}}>{'  ·  '}</span>}
            github.com/thealejandro/omarchy-island
          </div>
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          bottom: V ? 110 : 48,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: V ? 24 : 21,
          color: C.faint,
          opacity: ramp(frame, T_URL + 30, T_URL + 60, EASE),
        }}
      >
        Sin relación con Apple ni Microsoft.
      </div>
    </AbsoluteFill>
  );
};

const highlight = (s: string) => {
  // colorea las palabras clave del comando
  const parts = s.split(/(git clone|&&|install\.sh|all$)/g);
  return parts.map((p, i) => {
    if (p === 'git clone') return <span key={i} style={{color: '#64d2ff'}}>{p}</span>;
    if (p === '&&') return <span key={i} style={{color: '#8e8e93'}}>{p}</span>;
    if (p === 'install.sh') return <span key={i} style={{color: '#ffd60a'}}>{p}</span>;
    return <span key={i}>{p}</span>;
  });
};
