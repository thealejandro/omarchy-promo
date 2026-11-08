import React from 'react';
import {AbsoluteFill, Img, interpolate, interpolateColors, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Backdrop,
  C,
  EASE,
  EASE_IO,
  FONT,
  MONO,
  Monitor,
  Words,
  ZoomImg,
  extra,
  monitorHeight,
  ramp,
  shot,
  theme,
  useIsVertical,
  useSceneFade,
  useSpr,
} from '../lib';

// ---------------------------------------------------------------------------
// Esquinas y bordes: dolly hasta la unión de ventanas
// ---------------------------------------------------------------------------
export const Corners: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {height: H} = useVideoConfig();
  const V = useIsVertical();
  const fade = useSceneFade(dur, 14, 20);
  const mw = V ? 1000 : 1320;
  const mh = monitorHeight(mw);
  const top = V ? H * 0.5 - mh / 2 : 70;
  const swap = 190; // pasa de Big Sur a Ventura
  const xf = ramp(frame, swap, swap + 24, EASE);
  const keysA = [
    {f: 0, s: 1.0, x: 0.5, y: 0.5},
    {f: 40, s: 1.0, x: 0.5, y: 0.5},
    {f: 170, s: 3.4, x: 0.751, y: 0.516},
    {f: 230, s: 3.6, x: 0.751, y: 0.516},
  ];
  const keysB = [
    {f: swap - 10, s: 3.6, x: 0.503, y: 0.51},
    {f: 290, s: 3.2, x: 0.503, y: 0.51},
    {f: 360, s: 1.05, x: 0.5, y: 0.5},
  ];
  const textTop = V ? top + mh + 110 : top + mh + 62;
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Backdrop tint={xf < 0.5 ? '#ff7eb6' : '#ff8a3d'} intensity={0.28} />
      <div style={{position: 'absolute', left: '50%', top, marginLeft: -mw / 2}}>
        <Monitor w={mw} reflection={false} glow={xf < 0.5 ? '#bf5af2' : '#ff8a3d'}>
          {({w, h}) => (
            <>
              <ZoomImg src={shot('big-sur')} w={w} h={h} keys={keysA} />
              <div style={{position: 'absolute', inset: 0, opacity: xf}}>
                <ZoomImg src={shot('ventura')} w={w} h={h} keys={keysB} />
              </div>
            </>
          )}
        </Monitor>
      </div>
      <div style={{position: 'absolute', top: V ? 260 : textTop, left: 0, right: 0}}>
        {V ? (
          <>
            <Words text="Esquinas suaves." start={50} size={88} weight={600} exitAt={swap - 20} />
          </>
        ) : (
          <Words text="Esquinas suaves." start={50} size={72} weight={600} exitAt={swap - 20} />
        )}
      </div>
      <div style={{position: 'absolute', top: V ? 260 : textTop, left: 0, right: 0}}>
        <Words
          text="Bordes con degradado."
          start={swap + 4}
          size={V ? 88 : 72}
          weight={600}
          gradient="linear-gradient(90deg, #ffb340 0%, #ff8a3d 45%, #ff5e3a 100%)"
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Paleta: los colores salen de la captura y cambian de tema
// ---------------------------------------------------------------------------
const KEYS = ['background', 'foreground', 'accent', 'muted', 'red', 'yellow', 'green', 'cyan', 'blue', 'magenta'];
const PAL_SEQ = ['cupertino', 'ventura', 'fluent-light', 'obsidiana'];

export const Palette: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const V = useIsVertical();
  const fade = useSceneFade(dur, 14, 20);
  const T_FLY = 50;
  const steps = [0, 150, 235, 320];
  const TR = 26;
  // índice continuo de tema
  let k = 0;
  for (let i = 1; i < steps.length; i++) k += ramp(frame, steps[i], steps[i] + TR, EASE_IO);
  const i0 = Math.floor(k);
  const i1 = Math.min(PAL_SEQ.length - 1, i0 + 1);
  const fr = k - i0;
  const colorOf = (key: string) =>
    interpolateColors(fr, [0, 1], [theme(PAL_SEQ[i0]).palette[key], theme(PAL_SEQ[i1]).palette[key]]);

  const mw = V ? 900 : 820;
  const mh = monitorHeight(mw);
  const monTop = V ? 470 : 180;
  const sw = V ? 74 : 96;
  const gap = V ? 22 : 30;
  const cols = V ? 5 : 10;
  const rowsY = V ? [monTop + mh + 210, monTop + mh + 210 + sw + 78] : [monTop + mh + 120];
  const rowW = cols * sw + (cols - 1) * gap;
  const x0 = (W - rowW) / 2;
  const nameTop = monTop + mh + (V ? 70 : 34);
  const aaTop = V ? rowsY[1] + sw + 110 : rowsY[0] + sw + 82;

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Backdrop tint={colorOf('accent')} intensity={0.25} y="40%" />
      <div style={{position: 'absolute', top: V ? 250 : 60, left: 0, right: 0}}>
        <Words text={V ? 'Cada tema,\nsu paleta.' : 'Cada tema, su paleta.'} start={0} size={V ? 96 : 76} weight={600} />
      </div>
      <div style={{position: 'absolute', left: '50%', top: monTop, marginLeft: -mw / 2}}>
        <Monitor w={mw} reflection={false} glow={colorOf('accent')}>
          {({w, h}) => (
            <>
              {PAL_SEQ.map((slug, i) => {
                const o = i === 0 ? 1 : ramp(frame, steps[i], steps[i] + TR, EASE_IO);
                return (
                  <Img
                    key={slug}
                    src={shot(slug)}
                    style={{position: 'absolute', width: w, height: h, opacity: o, transform: `scale(${1.02 + 0.0004 * (frame - steps[i])})`}}
                  />
                );
              })}
            </>
          )}
        </Monitor>
      </div>
      {PAL_SEQ.map((slug, i) => {
        const p = Math.max(0, 1 - Math.abs(k - i) * 2);
        if (p <= 0) return null;
        return (
          <div
            key={slug}
            style={{
              position: 'absolute',
              top: nameTop,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: V ? 44 : 36,
              fontWeight: 500,
              color: C.text,
              opacity: p * ramp(frame, T_FLY, T_FLY + 30),
              transform: `translateY(${(k - i) * -16}px)`,
            }}
          >
            {theme(slug).name}
          </div>
        );
      })}
      {KEYS.map((key, i) => {
        const p = ramp(frame, T_FLY + i * 4, T_FLY + 40 + i * 4, EASE);
        const r = Math.floor(i / cols);
        const c = i % cols;
        const fx = x0 + c * (sw + gap);
        const fy = rowsY[r];
        // origen: un punto dentro de la captura
        const ox = W / 2 - mw / 2 + mw * (0.15 + ((i * 37) % 70) / 100);
        const oy = monTop + mh * (0.2 + ((i * 53) % 60) / 100);
        const x = ox + (fx - ox) * p;
        const y = oy + (fy - oy) * p - Math.sin(p * Math.PI) * 80;
        const col = colorOf(key);
        return (
          <div key={key} style={{position: 'absolute', left: x, top: y, width: sw, opacity: Math.min(1, p * 3)}}>
            <div
              style={{
                width: sw,
                height: sw,
                borderRadius: '50%',
                background: col,
                transform: `scale(${0.3 + 0.7 * p})`,
                boxShadow: `0 10px 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.18)`,
              }}
            />
            <div
              style={{
                marginTop: 14,
                marginLeft: -20,
                marginRight: -20,
                textAlign: 'center',
                fontFamily: MONO,
                fontSize: V ? 19 : 17,
                color: C.dim,
                opacity: ramp(frame, T_FLY + 40 + i * 4, T_FLY + 60 + i * 4),
              }}
            >
              {rgbToHex(col)}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          top: aaTop,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: V ? 36 : 30,
          fontWeight: 400,
          color: C.dim,
          opacity: ramp(frame, 110, 150, EASE),
        }}
      >
        {V ? (
          <>
            Todos sus colores, con contraste
            <br />
            <span style={{color: C.text, fontWeight: 600}}>AA</span> sobre el fondo.
          </>
        ) : (
          <>
            Todos sus colores, con contraste <span style={{color: C.text, fontWeight: 600}}>AA</span> sobre el fondo.
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};

const rgbToHex = (c: string) => {
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return c.toLowerCase();
  return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
};

// ---------------------------------------------------------------------------
// Barra: opaca, cristal, transparente
// ---------------------------------------------------------------------------
const BAR_MODES = [
  {key: 'bar-opaque', label: 'Opaca'},
  {key: 'bar-glassy', label: 'Cristal'},
  {key: 'bar-clear', label: 'Transparente'},
];

export const Bars: React.FC<{dur: number; slug?: string}> = ({dur, slug = 'aero-night'}) => {
  const frame = useCurrentFrame();
  const {width: W} = useVideoConfig();
  const V = useIsVertical();
  const fade = useSceneFade(dur, 14, 20);
  const T = [0, 120, 215];
  const WIPE = 40;
  const cw = V ? 1000 : 1720;
  const ch = Math.round((cw * 300) / 1600);
  const cardIn = useSpr(20, 50);
  const top = V ? 760 : 330;
  // dolly hacia la barra
  const z = interpolate(frame, [40, dur], [1.0, V ? 2.1 : 1.45], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IO});
  const fx = V ? 0.5 : 0.5;
  const fy = 0.08;
  const wipes = T.map((t, i) => (i === 0 ? 1 : ramp(frame, t, t + WIPE, EASE_IO)));
  let act = 0;
  for (let i = 1; i < T.length; i++) act += wipes[i];
  const segW = V ? 250 : 230;
  const segTop = top + ch + (V ? 90 : 80);
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Backdrop tint="#4fc3f7" intensity={0.22} />
      <div style={{position: 'absolute', top: V ? 300 : 90, left: 0, right: 0}}>
        <Words text={V ? 'La barra,\na tu gusto.' : 'La barra, a tu gusto.'} start={0} size={V ? 96 : 84} weight={600} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: (W - cw) / 2,
          top,
          width: cw,
          height: ch,
          borderRadius: 22,
          overflow: 'hidden',
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 40}px) scale(${0.96 + 0.04 * cardIn})`,
          boxShadow: '0 30px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12)',
        }}
      >
        {BAR_MODES.map((m, i) => {
          const p = wipes[i];
          return (
            <div
              key={m.key}
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: i === 0 ? undefined : `inset(0 ${(1 - p) * 100}% 0 0)`,
              }}
            >
              <ZoomImg src={extra(slug, m.key)} w={cw} h={ch} keys={[{f: 0, s: z, x: fx, y: fy}]} />
            </div>
          );
        })}
        {[1, 2].map((i) => {
          const p = wipes[i];
          if (p <= 0.001 || p >= 0.999) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: p * cw - 1,
                width: 2,
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 0 24px 6px rgba(255,255,255,0.35)',
              }}
            />
          );
        })}
      </div>
      {/* Control segmentado */}
      <div
        style={{
          position: 'absolute',
          left: (W - segW * 3 - 12) / 2,
          top: segTop,
          width: segW * 3 + 12,
          height: V ? 84 : 72,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)',
          opacity: ramp(frame, 40, 70, EASE),
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 6,
            bottom: 6,
            left: 6 + act * segW,
            width: segW,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.92)',
          }}
        />
        {BAR_MODES.map((m, i) => {
          const on = Math.max(0, 1 - Math.abs(act - i));
          return (
            <div
              key={m.key}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 6 + i * segW,
                width: segW,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT,
                fontSize: V ? 34 : 30,
                fontWeight: 600,
                color: interpolateColors(on, [0, 1], ['#d1d1d6', '#000000']),
              }}
            >
              {m.label}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          top: segTop + (V ? 130 : 110),
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: V ? 32 : 28,
          color: C.dim,
          opacity: ramp(frame, 80, 110, EASE),
        }}
      >
        {theme(slug).name}, con su fondo de pantalla detrás.
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Claro y oscuro con barrido
// ---------------------------------------------------------------------------
const PAIRS: [string, string][] = [
  ['cupertino', 'cupertino-light'],
  ['fluent', 'fluent-light'],
];

export const LightDark: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {height: H} = useVideoConfig();
  const V = useIsVertical();
  const fade = useSceneFade(dur, 14, 20);
  const mw = V ? 1000 : 1300;
  const mh = monitorHeight(mw);
  const top = V ? H * 0.5 - mh / 2 + 40 : 190;
  const SW = Math.round(dur * 0.52);
  const pairX = ramp(frame, SW - 12, SW + 12, EASE);
  // posición del barrido (fracción visible del claro desde la derecha)
  const pos = interpolate(
    frame,
    [0, 40, 100, 150, SW, SW + 40, SW + 100, dur],
    [1.0, 1.0, 0.5, 0.62, 0.62, 0.62, 0.25, 0.5],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IO},
  );
  const monIn = useSpr(6, 50);
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Backdrop tint="#8e8e93" intensity={0.18} />
      <div style={{position: 'absolute', top: V ? 300 : 60, left: 0, right: 0}}>
        <Words text={V ? 'Claro\nu oscuro.' : 'Claro u oscuro.'} start={0} size={V ? 110 : 84} weight={600} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top,
          marginLeft: -mw / 2,
          opacity: monIn,
          transform: `scale(${0.95 + 0.05 * monIn})`,
        }}
      >
        <Monitor w={mw} reflection={!V}>
          {({w, h}) => (
            <>
              {PAIRS.map(([dark, light], i) => {
                const o = i === 0 ? 1 - pairX : pairX;
                if (o <= 0) return null;
                return (
                  <div key={dark} style={{position: 'absolute', inset: 0, opacity: o}}>
                    <Img src={shot(dark)} style={{position: 'absolute', width: w, height: h}} />
                    <Img
                      src={shot(light)}
                      style={{position: 'absolute', width: w, height: h, clipPath: `inset(0 0 0 ${pos * 100}%)`}}
                    />
                  </div>
                );
              })}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: pos * w - 1.5,
                  width: 3,
                  background: '#fff',
                  boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                  opacity: pos < 0.995 ? 1 : 0,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: h / 2 - 30,
                  left: pos * w - 30,
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pos < 0.995 ? 1 : 0,
                  fontFamily: FONT,
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#1d1d1f',
                  letterSpacing: '0.1em',
                }}
              >
                ‹›
              </div>
              <Pill text="Oscuro" left={24} bottom={24} />
              <Pill text="Claro" right={24} bottom={24} light opacity={pos < 0.9 ? 1 : 0} />
            </>
          )}
        </Monitor>
      </div>
      {PAIRS.map(([dark, light], i) => {
        const o = i === 0 ? 1 - pairX : pairX;
        if (o <= 0) return null;
        return (
          <div
            key={dark}
            style={{
              position: 'absolute',
              top: top + mh + (V ? 70 : 40),
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: V ? 40 : 32,
              fontWeight: 500,
              color: C.text,
              opacity: o * ramp(frame, 50, 80),
            }}
          >
            {theme(dark).name} <span style={{color: C.faint}}>·</span> {theme(light).name}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Pill: React.FC<{text: string; left?: number; right?: number; bottom: number; light?: boolean; opacity?: number}> = ({
  text,
  left,
  right,
  bottom,
  light,
  opacity = 1,
}) => (
  <div
    style={{
      position: 'absolute',
      left,
      right,
      bottom,
      padding: '10px 22px',
      borderRadius: 999,
      fontFamily: FONT,
      fontSize: 24,
      fontWeight: 600,
      background: light ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.6)',
      color: light ? '#1d1d1f' : '#f5f5f7',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.15)',
      opacity,
    }}
  >
    {text}
  </div>
);

export {EASE};
