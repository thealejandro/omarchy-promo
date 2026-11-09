import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CLIPS, THEME_SWITCH_SLUGS, type Clip} from '../clips';
import {useT} from '../i18n';
import {B, C, EASE, EASE_IO, FONT, Words, logLerp, ramp, shot, theme, useIsVertical} from '../lib';
import {GRAD} from './Intro';

const SRC_W = 1920;
const SRC_H = 1080;

type Cam = {f: number; z: number; x: number; y: number};

/** Cámara sobre una fuente de 1920x1080 dentro de una caja bw x bh: z = 1 es «cubrir la caja». */
const camAt = (frame: number, keys: Cam[], bw: number, bh: number) => {
  let i = 0;
  while (i < keys.length - 2 && frame > keys[i + 1].f) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const t = b.f === a.f ? 1 : EASE_IO(Math.min(1, Math.max(0, (frame - a.f) / (b.f - a.f))));
  const z = logLerp(a.z, b.z, t);
  const fx = a.x + (b.x - a.x) * t;
  const fy = a.y + (b.y - a.y) * t;
  const k = Math.max(bw / SRC_W, bh / SRC_H) * z;
  const tx = Math.min(0, Math.max(bw - SRC_W * k, bw / 2 - fx * SRC_W * k));
  const ty = Math.min(0, Math.max(bh - SRC_H * k, bh / 2 - fy * SRC_H * k));
  return {k, tx, ty, map: (x: number, y: number) => ({x: tx + x * k, y: ty + y * k})};
};

const camStyle = (c: {k: number; tx: number; ty: number}): React.CSSProperties => ({
  position: 'absolute',
  left: 0,
  top: 0,
  width: SRC_W,
  height: SRC_H,
  transformOrigin: '0 0',
  transform: `translate(${c.tx}px, ${c.ty}px) scale(${c.k})`,
});

/** Pastilla de texto sobre el escritorio (cristal oscuro), para que se lea sobre cualquier tema. */
const Pill: React.FC<{children: React.ReactNode; size: number; opacity?: number; style?: React.CSSProperties}> = ({
  children,
  size,
  opacity = 1,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.5,
      padding: `${size * 0.42}px ${size * 0.8}px`,
      borderRadius: 999,
      background: 'rgba(10,10,12,0.72)',
      backdropFilter: 'blur(18px)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.14)',
      fontFamily: FONT,
      fontSize: size,
      fontWeight: 600,
      letterSpacing: '-0.015em',
      color: C.text,
      whiteSpace: 'nowrap',
      opacity,
      ...style,
    }}
  >
    {children}
  </div>
);

const Dot: React.FC<{color: string; size: number}> = ({color, size}) => (
  <span style={{display: 'inline-block', width: size, height: size, borderRadius: size / 2, background: color, boxShadow: '0 0 0 2px rgba(255,255,255,0.25)'}} />
);

// ---------------------------------------------------------------------------
// Cambio de tema en vivo: un tramo de 2 pulsos por cambio, con el cambio justo en el pulso.
// ---------------------------------------------------------------------------
const SEG = 2 * B;
// Encuadres de cada tramo (foco normalizado y zoom) para que cada corte se note.
const SHOTS_H = [
  {z: 1.18, x: 0.62, y: 0.62},
  {z: 1.12, x: 0.4, y: 0.42},
  {z: 1.22, x: 0.72, y: 0.36},
  {z: 1.08, x: 0.5, y: 0.5},
];
const SHOTS_V = [
  {z: 1.12, x: 0.74, y: 0.5},
  {z: 1.22, x: 0.28, y: 0.4},
  {z: 1.12, x: 0.72, y: 0.62},
];

export const LiveTheme: React.FC<{dur: number; changes: number}> = ({dur, changes}) => {
  const frame = useCurrentFrame();
  const {fps, width: W} = useVideoConfig();
  const V = useIsVertical();
  const t = useT();
  const clip = CLIPS.themeSwitch;
  const seg = Math.min(changes - 1, Math.floor(frame / SEG));
  const local = frame - seg * SEG;
  const from = THEME_SWITCH_SLUGS[seg];
  const to = THEME_SWITCH_SLUGS[seg + 1];
  const changed = local >= B;
  const punch = spring({frame: local - B, fps, config: {damping: 14, stiffness: 180}, durationInFrames: 30});
  const shots = V ? SHOTS_V : SHOTS_H;
  const sh = shots[seg % shots.length];
  const bw = W;
  const bh = V ? 1170 : 1080;
  const boxTop = V ? 470 : 0;
  const drift = interpolate(local, [0, SEG], [0, 0.03]);
  const cam = camAt(0, [{f: 0, z: sh.z + drift + 0.035 * punch * (changed ? 1 : 0), x: sh.x, y: sh.y}], bw, bh);

  const video = (m: number, k: number) => (
    <Sequence key={k} from={k * SEG} durationInFrames={k === changes - 1 ? dur - k * SEG : SEG} layout="none">
      <OffthreadVideo src={staticFile(clip!.src)} startFrom={Math.round(m * 60) - B} muted style={camStyle(cam)} />
    </Sequence>
  );

  return (
    <AbsoluteFill style={{background: C.bg}}>
      {V ? (
        <div style={{position: 'absolute', top: 290, left: 0, right: 0}}>
          <Words text={t.liveV} start={0} size={84} weight={650} />
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, top: boxTop, width: bw, height: bh, overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,0.6)'}}>
        {clip
          ? clip.marks.slice(0, changes).map((m, k) => video(m, k))
          : THEME_SWITCH_SLUGS.slice(0, changes + 1).map((slug, k) => (
              <Img key={slug} src={shot(slug)} style={{...camStyle(cam), opacity: k <= seg + (changed ? 1 : 0) ? 1 : 0}} />
            ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: V ? 1130 : 930,
          display: 'flex',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        {V ? null : <Pill size={40} opacity={ramp(frame, 0, 12)}>{t.live}</Pill>}
        <Pill size={V ? 44 : 40}>
          <Dot color={theme(from).palette.accent} size={V ? 18 : 16} />
          <span style={{color: changed ? C.dim : C.text}}>{theme(from).name}</span>
          <span style={{color: C.faint}}>→</span>
          <Dot color={theme(to).palette.accent} size={V ? 18 : 16} />
          <span style={{color: changed ? C.text : C.dim, transform: `scale(${1 + 0.06 * punch * (changed ? 1 : 0) * (1 - punch)})`}}>
            {theme(to).name}
          </span>
        </Pill>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// La isla en vivo: el cursor va al reloj, clic en el pulso 4 y la cámara sigue la acción.
// ---------------------------------------------------------------------------
const CLICK = 4 * B; // fotograma de la escena en el que se hace clic
const CLOCK = {x: 960, y: 14}; // reloj en la captura de 1920x1080

const KEYS_H: Cam[] = [
  {f: 0, z: 1.0, x: 0.5, y: 0.5},
  {f: 70, z: 1.1, x: 0.6, y: 0.45},
  {f: CLICK - 6, z: 2.0, x: 0.5, y: 0.18},
  {f: CLICK + 34, z: 2.3, x: 0.5, y: 0.14},
  {f: 8 * B + 30, z: 2.5, x: 0.5, y: 0.14},
];
const KEYS_V: Cam[] = [
  {f: 0, z: 1.0, x: 0.7, y: 0.5},
  {f: 70, z: 1.05, x: 0.62, y: 0.4},
  {f: CLICK - 6, z: 1.45, x: 0.5, y: 0.0},
  {f: CLICK + 34, z: 1.6, x: 0.5, y: 0.0},
  {f: 8 * B + 30, z: 1.72, x: 0.5, y: 0.0},
];

export const LiveIsland: React.FC<{dur: number; clip: Clip}> = ({clip}) => {
  const frame = useCurrentFrame();
  const {width: W} = useVideoConfig();
  const V = useIsVertical();
  const t = useT();
  const bw = W;
  const bh = V ? 1170 : 1080;
  const boxTop = V ? 470 : 0;
  const cam = camAt(frame, V ? KEYS_V : KEYS_H, bw, bh);
  const startFrom = Math.round(clip.marks[0] * 60) - CLICK;
  const ring = ramp(frame, CLICK, CLICK + 28, EASE);
  const c = cam.map(CLOCK.x, CLOCK.y);
  const note = ramp(frame, CLICK + 40, CLICK + 58, EASE);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {V ? (
        <div style={{position: 'absolute', top: 280, left: 0, right: 0, textAlign: 'center'}}>
          <Words text={t.islandV} start={0} size={96} weight={650} gradient={GRAD} />
          <div style={{fontFamily: FONT, fontSize: 44, fontWeight: 500, color: C.text, marginTop: 10, opacity: ramp(frame, 14, 30)}}>
            {t.openV}
          </div>
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, top: boxTop, width: bw, height: bh, overflow: 'hidden'}}>
        <OffthreadVideo src={staticFile(clip.src)} startFrom={startFrom} muted style={camStyle(cam)} />
        {ring > 0 && ring < 1 ? (
          <div
            style={{
              position: 'absolute',
              left: c.x - 30 - ring * 50,
              top: c.y - 30 - ring * 50,
              width: 60 + ring * 100,
              height: 60 + ring * 100,
              borderRadius: '50%',
              border: '4px solid rgba(255,255,255,0.9)',
              opacity: 1 - ring,
            }}
          />
        ) : null}
      </div>
      {V ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', opacity: note}}>
          <Pill size={40}>{t.openNote}</Pill>
        </div>
      ) : (
        <div style={{position: 'absolute', left: 0, right: 0, top: 930, display: 'flex', justifyContent: 'center'}}>
          <div style={{position: 'relative'}}>
            <Pill size={42} opacity={ramp(frame, 0, 12) * (1 - note)}>
              {t.open}
            </Pill>
            <div style={{position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)'}}>
              <Pill size={42} opacity={note}>
                {t.openNote}
              </Pill>
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
