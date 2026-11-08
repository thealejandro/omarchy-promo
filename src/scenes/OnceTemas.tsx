import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  ALL,
  Backdrop,
  C,
  EASE,
  EASE_IO,
  FONT,
  MACOS,
  Monitor,
  WINDOWS,
  Words,
  monitorHeight,
  ramp,
  shot,
  theme,
  useIsVertical,
  useSceneFade,
  useSpr,
} from '../lib';

// Orden del montaje: alterna familias y modos para que cada corte se note.
export const MONTAGE = [
  'cupertino',
  'ventura',
  'fluent-light',
  'aero-night',
  'big-sur',
  'tahoe',
  'obsidiana',
  'graphite',
  'aero',
  'cupertino-light',
  'fluent',
];

type Rect = {x: number; y: number; w: number; h: number};

const gridA = (W: number, H: number, V: boolean): Record<string, Rect> => {
  const cols = V ? 3 : 4;
  const gap = V ? 20 : 28;
  const cw = V ? 310 : 380;
  const ch = Math.round((cw * 9) / 16);
  const rows = Math.ceil(MONTAGE.length / cols);
  const totalH = rows * ch + (rows - 1) * gap;
  const top = (H - totalH) / 2 + (V ? 60 : 30);
  const out: Record<string, Rect> = {};
  MONTAGE.forEach((slug, i) => {
    const r = Math.floor(i / cols);
    const inRow = Math.min(cols, MONTAGE.length - r * cols);
    const rowW = inRow * cw + (inRow - 1) * gap;
    const c = i % cols;
    out[slug] = {x: (W - rowW) / 2 + c * (cw + gap), y: top + r * (ch + gap), w: cw, h: ch};
  });
  return out;
};

type Label = {text: string; x: number; y: number};

const gridB = (W: number, H: number, V: boolean): {rects: Record<string, Rect>; labels: Label[]} => {
  const out: Record<string, Rect> = {};
  const labels: Label[] = [];
  if (!V) {
    const cw = 272;
    const ch = Math.round((cw * 9) / 16);
    const gap = 20;
    const y1 = 330;
    const y2 = y1 + ch + 130;
    const row1W = 6 * cw + 5 * gap;
    const x1 = (W - row1W) / 2;
    MACOS.forEach((s, i) => (out[s] = {x: x1 + i * (cw + gap), y: y1, w: cw, h: ch}));
    labels.push({text: 'Inspirados en macOS', x: x1, y: y1 - 62});
    const big = 90;
    const row2W = 4 * cw + 3 * gap + big + cw;
    const x2 = (W - row2W) / 2;
    WINDOWS.forEach((s, i) => (out[s] = {x: x2 + i * (cw + gap), y: y2, w: cw, h: ch}));
    labels.push({text: 'Inspirados en Windows', x: x2, y: y2 - 62});
    const xo = x2 + 4 * cw + 3 * gap + big;
    out.obsidiana = {x: xo, y: y2, w: cw, h: ch};
    labels.push({text: 'Diseño propio', x: xo, y: y2 - 62});
  } else {
    const cw = 300;
    const ch = Math.round((cw * 9) / 16);
    const gap = 18;
    const lab = 66;
    const groupGap = 46;
    const total = 3 * lab + 5 * ch + 2 * gap + 2 * groupGap;
    let y = (H - total) / 2 + 40;
    const row = (slugs: string[], yy: number) => {
      const rw = slugs.length * cw + (slugs.length - 1) * gap;
      const x0 = (W - rw) / 2;
      slugs.forEach((s, i) => (out[s] = {x: x0 + i * (cw + gap), y: yy, w: cw, h: ch}));
    };
    labels.push({text: 'Inspirados en macOS', x: -1, y});
    y += lab;
    row(MACOS.slice(0, 3), y);
    row(MACOS.slice(3), y + ch + gap);
    y += 2 * ch + gap + groupGap;
    labels.push({text: 'Inspirados en Windows', x: -1, y});
    y += lab;
    row(WINDOWS.slice(0, 2), y);
    row(WINDOWS.slice(2), y + ch + gap);
    y += 2 * ch + gap + groupGap;
    labels.push({text: 'Diseño propio', x: -1, y});
    y += lab;
    row(['obsidiana'], y);
  }
  return {rects: out, labels};
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const OnceTemas: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const V = useIsVertical();
  const fade = useSceneFade(dur, 12, 20);

  const T_MONT = 96; // empieza el montaje
  const D = V ? 22 : 26; // fotogramas por tema
  const T_GRID = T_MONT + D * MONTAGE.length; // rejilla
  const T_SORT = T_GRID + (V ? 70 : 90); // reordenar por familia

  // --- Montaje ------------------------------------------------------------
  const mw = V ? 1000 : 1440;
  const mh = monitorHeight(mw);
  const monIn = useSpr(T_MONT - 14, 40);
  const toGrid = ramp(frame, T_GRID - 6, T_GRID + 34, EASE_IO);
  const A = gridA(W, H, V);
  const B = gridB(W, H, V);
  const last = MONTAGE[MONTAGE.length - 1];
  const lastRect = A[last];
  const monScale = lerp(0.9 + 0.1 * monIn + interpolate(frame, [T_MONT, T_GRID], [0, 0.03]), lastRect.w / mw, toGrid);
  const cx = lerp(W / 2, lastRect.x + lastRect.w / 2, toGrid);
  const cy = lerp(H / 2 + (V ? 40 : 10), lastRect.y + lastRect.h / 2, toGrid);

  const sortT = ramp(frame, T_SORT, T_SORT + 54, EASE_IO);
  const curIdx = Math.min(MONTAGE.length - 1, Math.max(0, Math.floor((frame - T_MONT) / D)));

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Backdrop tint={theme(MONTAGE[curIdx]).palette.accent} intensity={0.22} />

      {/* Titular */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <Words text="Once temas." start={6} size={V ? 170 : 200} weight={600} exitAt={T_MONT - 22} />
      </AbsoluteFill>

      {/* Montaje dentro del monitor */}
      {frame >= T_MONT - 14 && frame < T_GRID + 40 ? (
        <div
          style={{
            position: 'absolute',
            left: cx - mw / 2,
            top: cy - mh / 2,
            width: mw,
            height: mh,
            transform: `scale(${monScale})`,
            opacity: monIn,
          }}
        >
          <Monitor w={mw} reflection={toGrid < 0.05} glow={toGrid < 0.5 ? theme(MONTAGE[curIdx]).palette.accent : undefined}>
            {({w, h}) => (
              <>
                {MONTAGE.map((slug, i) => {
                  const t0 = T_MONT + i * D;
                  if (frame < t0 - 1 || (i < MONTAGE.length - 1 && frame > t0 + D + 14)) return null;
                  const p = ramp(frame, t0, t0 + 14, EASE);
                  const local = frame - t0;
                  const sc = (i === 0 ? 1.06 : 1.14 - 0.08 * p) - local * 0.0012;
                  const clip = i === 0 ? 'none' : `inset(${(1 - p) * 34}% ${(1 - p) * 34}% round 18px)`;
                  return (
                    <Img
                      key={slug}
                      src={shot(slug)}
                      style={{
                        position: 'absolute',
                        width: w,
                        height: h,
                        transform: `scale(${Math.max(1, i === MONTAGE.length - 1 ? 1 + (1 - toGrid) * Math.max(0, sc - 1) : sc)})`,
                        clipPath: clip,
                        opacity: i === 0 ? 1 : Math.min(1, p * 2.5),
                      }}
                    />
                  );
                })}
              </>
            )}
          </Monitor>
        </div>
      ) : null}

      {/* Nombre del tema durante el montaje */}
      {frame >= T_MONT && frame < T_GRID ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: H / 2 + (V ? 40 : 10) + (mh * 1) / 2 + (V ? 60 : 34),
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: V ? 44 : 34,
            fontWeight: 500,
            color: C.text,
            opacity: ramp(frame, T_MONT, T_MONT + 10) * (1 - ramp(frame, T_GRID - 12, T_GRID)),
            letterSpacing: '-0.01em',
          }}
        >
          {theme(MONTAGE[curIdx]).name}
        </div>
      ) : null}

      {/* Rejilla */}
      {frame >= T_GRID
        ? MONTAGE.map((slug, i) => {
            const a = A[slug];
            const b = B.rects[slug];
            const isLast = slug === last;
            const pop = isLast ? 1 : ramp(frame, T_GRID + 10 + i * 3, T_GRID + 40 + i * 3, EASE);
            if (isLast && frame < T_GRID + 34) return null;
            const r = {
              x: lerp(a.x, b.x, sortT),
              y: lerp(a.y, b.y, sortT),
              w: lerp(a.w, b.w, sortT),
              h: lerp(a.h, b.h, sortT),
            };
            // Arco suave en el reordenado para que no se crucen en línea recta.
            const lift = Math.sin(sortT * Math.PI) * (i % 2 === 0 ? -30 : 30);
            return (
              <div
                key={slug}
                style={{
                  position: 'absolute',
                  left: r.x,
                  top: r.y + lift,
                  width: r.w,
                  height: r.h,
                  borderRadius: 10,
                  overflow: 'hidden',
                  opacity: pop,
                  transform: `scale(${0.86 + 0.14 * pop})`,
                  filter: pop < 1 ? `blur(${(1 - pop) * 10}px)` : undefined,
                  boxShadow: '0 18px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.10)',
                }}
              >
                <Img src={shot(slug)} style={{width: '100%', height: '100%'}} />
              </div>
            );
          })
        : null}
      {frame >= T_SORT + 20
        ? B.labels.map((l, i) => {
            const p = ramp(frame, T_SORT + 30 + i * 8, T_SORT + 60 + i * 8, EASE);
            return (
              <div
                key={l.text}
                style={{
                  position: 'absolute',
                  left: l.x < 0 ? 0 : l.x,
                  right: l.x < 0 ? 0 : undefined,
                  textAlign: l.x < 0 ? 'center' : 'left',
                  top: l.y,
                  fontFamily: FONT,
                  fontSize: V ? 34 : 32,
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
          })
        : null}
    </AbsoluteFill>
  );
};
