import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import themesJson from './themes.json';

// ---------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------
export type Theme = {
  slug: string;
  name: string;
  family: 'macos' | 'windows' | 'propio';
  mode: 'dark' | 'light';
  inspiration: string;
  description: string;
  rounding: number;
  palette: Record<string, string>;
};

export const THEMES = themesJson as unknown as Theme[];
export const theme = (slug: string) => THEMES.find((t) => t.slug === slug)!;
export const MACOS = ['cupertino', 'cupertino-light', 'graphite', 'big-sur', 'ventura', 'tahoe'];
export const WINDOWS = ['fluent', 'fluent-light', 'aero', 'aero-night'];
export const ALL = [...MACOS, ...WINDOWS, 'obsidiana'];

// Subtítulo corto para cada tema (inspiración en español).
export const INSPIRATION: Record<string, string> = {
  cupertino: 'macOS · oscuro',
  'cupertino-light': 'macOS · claro',
  graphite: 'macOS Graphite · monocromo',
  'big-sur': 'macOS Big Sur · oscuro',
  ventura: 'macOS Ventura · oscuro',
  tahoe: 'macOS Tahoe · claro',
  fluent: 'Windows 11 · oscuro',
  'fluent-light': 'Windows 11 · claro',
  aero: 'Windows Vista / 7 · claro',
  'aero-night': 'Windows Vista / 7 · oscuro',
  obsidiana: 'Diseño propio · oscuro',
};

export const shot = (slug: string) => staticFile(`shots/${slug}.png`);
export const extra = (slug: string, name: string) => staticFile(`extras/${slug}/${name}.webp`);
export const wallpaper = (slug: string) => staticFile(`backgrounds/${slug}.jpg`);

// ---------------------------------------------------------------------------
// Estilo
// ---------------------------------------------------------------------------
export const C = {
  bg: '#000000',
  text: '#f5f5f7',
  dim: '#a1a1a6',
  faint: '#6e6e73',
};
export const FONT = 'InterPromo, Inter, system-ui, sans-serif';
export const MONO = 'JetBrainsPromo, "JetBrains Mono", monospace';

// Fuentes empaquetadas en public/fonts (OFL): render determinista y sin red.
const fontHandle = delayRender('fuentes');
Promise.all([
  new FontFace('InterPromo', `url(${staticFile('fonts/Inter-var-latin.woff2')}) format('woff2')`, {
    weight: '100 900',
  }).load(),
  new FontFace('JetBrainsPromo', `url(${staticFile('fonts/JetBrainsMono-latin.woff2')}) format('woff2')`, {
    weight: '100 800',
  }).load(),
])
  .then((faces) => {
    faces.forEach((f) => document.fonts.add(f));
    continueRender(fontHandle);
  })
  .catch((e) => {
    console.error(e);
    continueRender(fontHandle);
  });

// ---------------------------------------------------------------------------
// Tiempo y movimiento
// ---------------------------------------------------------------------------
export const FPS = 60;
export const s = (sec: number) => Math.round(sec * FPS);
export const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
export const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Spring suave sin rebote (estilo keynote). */
export const useSpr = (delay: number, dur = 45) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping: 200}, durationInFrames: dur});
};

export const ramp = (frame: number, a: number, b: number, ease = EASE_IO) =>
  interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

/** Opacidad de entrada/salida de escena. */
export const useSceneFade = (durationInFrames: number, fadeIn = 18, fadeOut = 18) => {
  const frame = useCurrentFrame();
  const a = fadeIn > 0 ? ramp(frame, 0, fadeIn, EASE) : 1;
  const b = fadeOut > 0 ? 1 - ramp(frame, durationInFrames - fadeOut, durationInFrames, EASE) : 1;
  return Math.min(a, b);
};

export const useIsVertical = () => {
  const {width, height} = useVideoConfig();
  return height > width;
};

// ---------------------------------------------------------------------------
// Titulares palabra a palabra (desenfoque -> nítido)
// ---------------------------------------------------------------------------
type WordsProps = {
  text: string;
  start: number;
  stagger?: number;
  size: number;
  weight?: number;
  color?: string;
  gradient?: string;
  exitAt?: number;
  exitDur?: number;
  style?: React.CSSProperties;
  align?: 'center' | 'left';
  tracking?: string;
  lineHeight?: number;
};

export const Words: React.FC<WordsProps> = ({
  text,
  start,
  stagger = 5,
  size,
  weight = 600,
  color = C.text,
  gradient,
  exitAt,
  exitDur = 20,
  style,
  align = 'center',
  tracking = '-0.035em',
  lineHeight = 1.06,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lines = text.split('\n');
  let idx = 0;
  const q = exitAt === undefined ? 0 : ramp(frame, exitAt, exitAt + exitDur, EASE);
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: tracking,
        lineHeight,
        color,
        textAlign: align,
        opacity: 1 - q,
        filter: q > 0 ? `blur(${q * 14}px)` : undefined,
        transform: `translateY(${-q * size * 0.12}px)`,
        ...style,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{whiteSpace: 'nowrap'}}>
          {line.split(' ').map((w, wi) => {
            const i = idx++;
            const p = spring({
              frame: frame - start - i * stagger,
              fps,
              config: {damping: 200},
              durationInFrames: 40,
            });
            return (
              <span
                key={wi}
                style={{
                  display: 'inline-block',
                  opacity: p,
                  filter: p < 1 ? `blur(${(1 - p) * 18}px)` : undefined,
                  transform: `translateY(${(1 - p) * size * 0.28}px) scale(${0.96 + 0.04 * p})`,
                  marginRight: '0.24em',
                  ...(gradient
                    ? {
                        backgroundImage: gradient,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                        paddingBottom: '0.08em',
                      }
                    : {}),
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Texto que entra suave (bloque entero). */
export const FadeText: React.FC<{
  children: React.ReactNode;
  start: number;
  exitAt?: number;
  style?: React.CSSProperties;
  rise?: number;
}> = ({children, start, exitAt, style, rise = 24}) => {
  const frame = useCurrentFrame();
  const p = useSpr(start, 40);
  const q = exitAt === undefined ? 0 : ramp(frame, exitAt, exitAt + 18, EASE);
  return (
    <div
      style={{
        fontFamily: FONT,
        opacity: p * (1 - q),
        filter: p < 1 || q > 0 ? `blur(${(1 - p) * 10 + q * 10}px)` : undefined,
        transform: `translateY(${(1 - p) * rise - q * 10}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Imagen con zoom/dolly por fotogramas clave
// ---------------------------------------------------------------------------
export type ZoomKey = {f: number; s: number; x: number; y: number};

export const zoomAt = (frame: number, keys: ZoomKey[], ease = EASE_IO) => {
  if (keys.length === 1) return keys[0];
  const fs = keys.map((k) => k.f);
  const opt = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const, easing: ease};
  return {
    f: frame,
    s: interpolate(frame, fs, keys.map((k) => k.s), opt),
    x: interpolate(frame, fs, keys.map((k) => k.x), opt),
    y: interpolate(frame, fs, keys.map((k) => k.y), opt),
  };
};

/** Rellena el contenedor (w x h) con la imagen y aplica escala centrada en (x, y) normalizados. */
export const ZoomImg: React.FC<{
  src: string;
  w: number;
  h: number;
  keys: ZoomKey[];
  ease?: (t: number) => number;
  style?: React.CSSProperties;
}> = ({src, w, h, keys, ease, style}) => {
  const frame = useCurrentFrame();
  const z = zoomAt(frame, keys, ease);
  const sc = Math.max(1, z.s);
  let tx = w / 2 - z.x * w * sc;
  let ty = h / 2 - z.y * h * sc;
  tx = Math.min(0, Math.max(w - w * sc, tx));
  ty = Math.min(0, Math.max(h - h * sc, ty));
  return (
    <Img
      src={src}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        objectFit: 'cover',
        transformOrigin: '0 0',
        transform: `translate(${tx}px, ${ty}px) scale(${sc})`,
        ...style,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Monitor: bisel fino, sombra suave, brillo y reflejo en el suelo
// ---------------------------------------------------------------------------
export const Monitor: React.FC<{
  w: number;
  children: (inner: {w: number; h: number}) => React.ReactNode;
  reflection?: boolean;
  glow?: string;
  style?: React.CSSProperties;
  aspect?: number;
  bezel?: number;
}> = ({w, children, reflection = true, glow, style, aspect = 16 / 9, bezel}) => {
  const b = bezel ?? Math.max(6, Math.round(w * 0.009));
  const iw = w - b * 2;
  const ih = Math.round(iw / aspect);
  const h = ih + b * 2;
  const r = Math.round(w * 0.016);
  const screen = (
    <div
      style={{
        position: 'absolute',
        left: b,
        top: b,
        width: iw,
        height: ih,
        borderRadius: Math.max(4, r - b / 2),
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {children({w: iw, h: ih})}
    </div>
  );
  return (
    <div style={{position: 'relative', width: w, height: h, ...style}}>
      {glow ? (
        <div
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: '30%',
            bottom: '-12%',
            background: glow,
            filter: `blur(${Math.round(w * 0.07)}px)`,
            opacity: 0.45,
          }}
        />
      ) : null}
      {reflection ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: h + Math.round(w * 0.012),
            width: w,
            height: h,
            transform: 'scaleY(-1)',
            transformOrigin: 'center',
            opacity: 0.22,
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0) 28%)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0) 28%)',
            filter: 'blur(2px)',
          }}
        >
          <div style={{position: 'absolute', inset: 0, borderRadius: r, background: '#0b0b0d'}} />
          {screen}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: r,
          background: 'linear-gradient(180deg, #2a2a2e 0%, #121214 100%)',
          boxShadow: `0 ${w * 0.03}px ${w * 0.08}px rgba(0,0,0,0.65), 0 ${w * 0.005}px ${w * 0.012}px rgba(0,0,0,0.5)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 1,
          borderRadius: r - 1,
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      />
      {screen}
      <div
        style={{
          position: 'absolute',
          left: b,
          top: b,
          width: iw,
          height: ih,
          borderRadius: Math.max(4, r - b / 2),
          background:
            'linear-gradient(118deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 26%, rgba(255,255,255,0) 40%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export const monitorHeight = (w: number, aspect = 16 / 9) => {
  const b = Math.max(6, Math.round(w * 0.009));
  return Math.round((w - b * 2) / aspect) + b * 2;
};

// ---------------------------------------------------------------------------
// Fondo: negro con halo de color muy suave
// ---------------------------------------------------------------------------
export const Backdrop: React.FC<{tint?: string; intensity?: number; y?: string}> = ({
  tint = '#2b3a67',
  intensity = 0.35,
  y = '60%',
}) => (
  <AbsoluteFill style={{background: C.bg}}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(60% 55% at 50% ${y}, ${hexA(tint, intensity)} 0%, rgba(0,0,0,0) 70%)`,
      }}
    />
  </AbsoluteFill>
);

export const hexA = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

export const Center: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({
  children,
  style,
}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', ...style}}>{children}</AbsoluteFill>
);

export const Eyebrow: React.FC<{children: React.ReactNode; color?: string; size?: number}> = ({
  children,
  color = C.dim,
  size = 30,
}) => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: size,
      fontWeight: 500,
      letterSpacing: '0.01em',
      color,
    }}
  >
    {children}
  </div>
);
