import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useT} from '../i18n';
import {
  ALL,
  B,
  Backdrop,
  C,
  EASE,
  EASE_IO,
  FONT,
  Monitor,
  Words,
  ZoomImg,
  ZoomKey,
  extra,
  monitorHeight,
  ramp,
  theme,
  useIsVertical,
  useSpr,
  zoomAt,
} from '../lib';
import {GRAD} from './Intro';

// Región de la isla dentro de extras/<tema>/island.webp (1600x900).
const CROP = {x: 545, y: 0, w: 520, h: 346, srcW: 1600, srcH: 900};
// Puntos de interés (coordenadas de la imagen 1600x900).
const TABS = [
  {x: 938, y: 43, label: 'Inicio'},
  {x: 962, y: 43, label: 'Calendario'},
  {x: 986, y: 43, label: 'Mundo'},
  {x: 1010, y: 43, label: 'Ajustes'},
];
const CLOCK = {x: 820, y: 11};

/** Muestra el recorte de la isla en una caja w x h, con zoom opcional (coords normalizadas al recorte). */
const IslandCrop: React.FC<{slug: string; w: number; keys?: ZoomKey[]; children?: (map: (x: number, y: number) => {x: number; y: number}) => React.ReactNode}> = ({
  slug,
  w,
  keys = [{f: 0, s: 1, x: 0.5, y: 0.5}],
  children,
}) => {
  const frame = useCurrentFrame();
  const h = Math.round((w * CROP.h) / CROP.w);
  const z = zoomAt(frame, keys);
  const sc = Math.max(1, z.s);
  let tx = w / 2 - z.x * w * sc;
  let ty = h / 2 - z.y * h * sc;
  tx = Math.min(0, Math.max(w - w * sc, tx));
  ty = Math.min(0, Math.max(h - h * sc, ty));
  const k = (w / CROP.w) * sc;
  const map = (x: number, y: number) => ({x: tx + (x - CROP.x) * k, y: ty + (y - CROP.y) * k});
  return (
    <div style={{position: 'relative', width: w, height: h, overflow: 'hidden', borderRadius: 20}}>
      <Img
        src={extra(slug, 'island')}
        style={{
          position: 'absolute',
          left: tx - CROP.x * k,
          top: ty - CROP.y * k,
          width: CROP.srcW * k,
          height: CROP.srcH * k,
        }}
      />
      {children ? children(map) : null}
    </div>
  );
};

export const islandCropH = (w: number) => Math.round((w * CROP.h) / CROP.w);

// ---------------------------------------------------------------------------
// «Y una isla.»
// ---------------------------------------------------------------------------
export const IslandIntro: React.FC<{dur: number; slug?: string}> = ({dur, slug = 'big-sur'}) => {
  const frame = useCurrentFrame();
  const {height: H} = useVideoConfig();
  const V = useIsVertical();
  const t = useT();
  const T_MON = B + 12; // el titular golpea en el pulso 0 y el monitor sube después
  const mon = useSpr(T_MON, 40);
  const mw = V ? 1000 : 1360;
  const mh = monitorHeight(mw);
  const top = V ? H * 0.5 - mh / 2 - 40 : 78;
  const keys = [
    {f: T_MON, s: 1, x: 0.5, y: 0.5},
    {f: T_MON + 20, s: 1, x: 0.5, y: 0.5},
    {f: T_MON + 96, s: V ? 2.6 : 2.15, x: 0.505, y: 0.2},
  ];
  return (
    <AbsoluteFill>
      <Backdrop tint="#bf5af2" intensity={0.25 * mon} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <Words text={t.island} start={-8} stagger={4} size={V ? 170 : 210} weight={650} gradient={GRAD} exitAt={T_MON - 16} exitDur={14} />
      </AbsoluteFill>
      {frame >= T_MON - 2 ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top,
            marginLeft: -mw / 2,
            opacity: mon,
            transform: `translateY(${(1 - mon) * 80}px) scale(${0.94 + 0.06 * mon})`,
          }}
        >
          <Monitor w={mw} reflection={false} glow="#7d7aff">
            {({w, h}) => <ZoomImg src={extra(slug, 'island')} w={w} h={h} keys={keys} />}
          </Monitor>
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          top: top + mh + (V ? 80 : 44),
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          opacity: ramp(frame, T_MON + 36, T_MON + 60, EASE),
          transform: `translateY(${(1 - ramp(frame, T_MON + 36, T_MON + 60, EASE)) * 16}px)`,
        }}
      >
        <div style={{fontSize: V ? 60 : 56, fontWeight: 650, color: C.text, letterSpacing: '-0.02em'}}>omarchy-island</div>
        <div style={{fontSize: V ? 34 : 32, color: C.dim, marginTop: 8}}>{t.islandSub}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Vistazo
// ---------------------------------------------------------------------------
export const IslandPeek: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const V = useIsVertical();
  const cw = V ? 1000 : 1280;
  const ch = Math.round((cw * 72) / 640); // solo la franja con la barra y el vistazo
  const fullH = Math.round((cw * 120) / 640);
  const t = useT();
  const cardIn = useSpr(-14, 36);
  const drop = ramp(frame, B, B + 20, EASE); // se asoma en el pulso 1
  const top = V ? H * 0.5 - ch / 2 : 470;
  return (
    <AbsoluteFill>
      <Backdrop tint="#5c6bc0" intensity={0.25} />
      <div style={{position: 'absolute', top: V ? 400 : 150, left: 0, right: 0}}>
        <Words text={t.peek} start={-6} size={V ? 80 : 84} weight={650} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: (W - cw) / 2,
          top,
          width: cw,
          height: ch,
          borderRadius: 20,
          overflow: 'hidden',
          opacity: cardIn,
          transform: `scale(${0.96 + 0.04 * cardIn})`,
          boxShadow: '0 30px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12)',
          background: '#0b0b1e',
        }}
      >
        <Img src={staticFile('island/island-peek.png')} style={{position: 'absolute', top: 0, width: cw, height: fullH, clipPath: `inset(0 0 ${40 + (1 - drop) * 35}% 0)`}} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: top + ch + (V ? 90 : 70),
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: V ? 36 : 30,
          color: C.dim,
          opacity: ramp(frame, B + 14, B + 36, EASE),
        }}
      >
        {t.peekSub}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Abierta: reloj, páginas, agenda, mundo, clima
// ---------------------------------------------------------------------------
export const IslandOpen: React.FC<{dur: number; slug?: string}> = ({slug = 'cupertino'}) => {
  const frame = useCurrentFrame();
  const t = useT();
  const tt = t;
  const {width: W, height: H} = useVideoConfig();
  const V = useIsVertical();
  const cw = V ? 980 : 1020;
  const chh = islandCropH(cw);
  const cardIn = useSpr(10, 50);
  const left = V ? (W - cw) / 2 : 110;
  const top = V ? 560 : (H - chh) / 2 + 10;
  const accent = theme(slug).palette.accent;

  const T_TABS = 90;
  const TAB_D = 28;
  const T_ZOOM = T_TABS + TAB_D * 4 + 6;
  const tabF = interpolate(frame, [T_TABS, T_TABS + TAB_D * 3], [0, 3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // salto suave entre pestañas
  const tabI = Math.floor(tabF) + EASE_IO(Math.min(1, (tabF % 1) * 2.2));
  const tabsVis = ramp(frame, T_TABS - 10, T_TABS + 10) * (1 - ramp(frame, T_ZOOM - 10, T_ZOOM + 6));

  // Coordenadas normalizadas al recorte
  const nx = (x: number) => (x - CROP.x) / CROP.w;
  const ny = (y: number) => (y - CROP.y) / CROP.h;
  const keys: ZoomKey[] = [
    {f: T_ZOOM, s: 1, x: 0.5, y: 0.5},
    {f: T_ZOOM + 34, s: 1.75, x: nx(935), y: ny(150)},
    {f: T_ZOOM + 72, s: 1.75, x: nx(935), y: ny(150)},
    {f: T_ZOOM + 108, s: 1.6, x: nx(800), y: ny(300)},
    {f: T_ZOOM + 165, s: 1.6, x: nx(800), y: ny(300)},
    {f: T_ZOOM + 200, s: 1, x: 0.5, y: 0.5},
  ];
  const pulse = ramp(frame, 46, 96, EASE);

  const textLeft = V ? 0 : left + cw + 90;
  const textTop = V ? top + chh + 90 : top + 10;
  const FEAT = t.openFeat;
  const featT = [T_ZOOM + 10, T_ZOOM + 80, T_ZOOM + 112];

  return (
    <AbsoluteFill>
      <Backdrop tint={accent} intensity={0.22} y="50%" />
      <div
        style={{
          position: 'absolute',
          left,
          top,
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 40}px) scale(${0.95 + 0.05 * cardIn})`,
          boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.12)',
          borderRadius: 20,
        }}
      >
        <IslandCrop slug={slug} w={cw} keys={keys}>
          {(map) => {
            const c = map(CLOCK.x, CLOCK.y);
            const t0 = map(TABS[0].x, TABS[0].y);
            const t1 = map(TABS[3].x, TABS[3].y);
            const tx = t0.x + ((t1.x - t0.x) / 3) * tabI;
            return (
              <>
                {pulse > 0 && pulse < 1 ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: c.x - 40 - pulse * 60,
                      top: c.y - 20 - pulse * 30,
                      width: 80 + pulse * 120,
                      height: 40 + pulse * 60,
                      borderRadius: 999,
                      border: `3px solid ${accent}`,
                      opacity: 1 - pulse,
                    }}
                  />
                ) : null}
                <div
                  style={{
                    position: 'absolute',
                    left: tx - 30,
                    top: t0.y - 30,
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    border: `3px solid #ffffff`,
                    boxShadow: `0 0 24px ${accent}`,
                    opacity: tabsVis,
                  }}
                />
              </>
            );
          }}
        </IslandCrop>
      </div>

      <div style={{position: 'absolute', left: textLeft, right: V ? 0 : 60, top: textTop}}>
        <Words
          text={t.open}
          start={10}
          size={V ? 72 : 76}
          weight={600}
          align={V ? 'center' : 'left'}
        />
        <div style={{marginTop: V ? 50 : 56, position: 'relative', height: V ? 300 : 320}}>
          {/* Páginas */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: ramp(frame, T_TABS - 20, T_TABS + 10) * (1 - ramp(frame, T_ZOOM - 10, T_ZOOM + 10)),
              display: 'flex',
              flexDirection: V ? 'row' : 'column',
              justifyContent: V ? 'center' : 'flex-start',
              gap: V ? 34 : 14,
              fontFamily: FONT,
            }}
          >
            {TABS.map((t, i) => {
              const on = Math.max(0, 1 - Math.abs(tabI - i));
              return (
                <div
                  key={t.label}
                  style={{
                    fontSize: V ? 40 : 46,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: on > 0.5 ? C.text : '#5a5a5f',
                    transform: `translateX(${V ? 0 : on * 12}px)`,
                  }}
                >
                  {tt.tabs[i]}
                </div>
              );
            })}
          </div>
          {/* Funciones */}
          <div style={{position: 'absolute', inset: 0, fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 18, alignItems: V ? 'center' : 'flex-start'}}>
            {FEAT.map((f, i) => {
              const p = ramp(frame, featT[i], featT[i] + 30, EASE);
              return (
                <div
                  key={f}
                  style={{
                    fontSize: V ? 44 : 46,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: C.text,
                    opacity: p,
                    filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
                    transform: `translateY(${(1 - p) * 16}px)`,
                  }}
                >
                  {f}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// En cualquier borde
// ---------------------------------------------------------------------------
export const IslandEdges: React.FC<{dur: number; slug?: string}> = ({dur, slug = 'aero-night'}) => {
  const frame = useCurrentFrame();
  const {height: H} = useVideoConfig();
  const V = useIsVertical();
  const mw = V ? 1000 : 1240;
  const mh = monitorHeight(mw);
  const top = V ? H * 0.5 - mh / 2 + 30 : 196;
  const sc = V ? 1.9 : 1.5;
  const t = useT();
  const keys = [
    {f: 0, s: sc, x: 0.5, y: 0.0},
    {f: B, s: sc, x: 0.5, y: 0.0},
    {f: 2 * B + 20, s: sc, x: 0.5, y: 1.0},
  ];
  const xf = ramp(frame, 2 * B - 10, 2 * B + 10, EASE_IO); // cambia de borde en el pulso 2
  const monIn = useSpr(0, 30);
  return (
    <AbsoluteFill>
      <Backdrop tint={theme(slug).palette.accent} intensity={0.24} />
      <div style={{position: 'absolute', top: V ? 300 : 52, left: 0, right: 0}}>
        <Words text={t.edges} start={0} size={V ? 80 : 84} weight={650} />
      </div>
      <div style={{position: 'absolute', left: '50%', top, marginLeft: -mw / 2, opacity: monIn, transform: `scale(${0.96 + 0.04 * monIn})`}}>
        <Monitor w={mw} reflection={false} glow={theme(slug).palette.accent}>
          {({w, h}) => (
            <>
              <ZoomImg src={extra(slug, 'island')} w={w} h={h} keys={keys} />
              <div style={{position: 'absolute', inset: 0, opacity: xf}}>
                <ZoomImg src={extra(slug, 'island-bottom')} w={w} h={h} keys={keys} />
              </div>
            </>
          )}
        </Monitor>
      </div>
      <div
        style={{
          position: 'absolute',
          top: top + mh + (V ? 80 : 44),
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: V ? 34 : 30,
          color: C.dim,
          opacity: ramp(frame, 20, 44, EASE),
        }}
      >
        {t.edgesSub}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Toma los colores del tema
// ---------------------------------------------------------------------------
const RIBBON = ['cupertino', 'big-sur', 'tahoe', 'fluent', 'obsidiana', 'aero', 'ventura', 'graphite', 'fluent-light', 'aero-night', 'cupertino-light'];

export const IslandColors: React.FC<{dur: number}> = ({dur}) => {
  const t = useT();
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const V = useIsVertical();
  const cw = V ? 720 : 620;
  const chh = islandCropH(cw);
  const gap = V ? 50 : 46;
  const step = cw + gap;
  const cy = V ? H * 0.45 : 600; // en vertical, el nombre del tema queda por encima de y 1248 (zona segura)
  // posición continua: avanza por la cinta
  const pos = interpolate(frame, [0, dur], [1.2, V ? 6.2 : 7.6], {easing: EASE_IO});
  const cur = Math.round(pos);
  return (
    <AbsoluteFill>
      <Backdrop tint={theme(RIBBON[Math.min(RIBBON.length - 1, cur)]).palette.accent} intensity={0.25} />
      <div style={{position: 'absolute', top: V ? 300 : 80, left: 0, right: 0}}>
        <Words text={V ? t.colorsV : t.colors} start={0} size={V ? 88 : 84} weight={650} />
      </div>
      {RIBBON.map((slug, i) => {
        const d = i - pos;
        const ad = Math.abs(d);
        if (ad > 3) return null;
        const sc = 1 - Math.min(ad, 2) * 0.16;
        const x = W / 2 + d * step;
        const o = Math.max(0, 1 - Math.max(0, ad - 0.8) * 0.5);
        return (
          <div
            key={slug}
            style={{
              position: 'absolute',
              left: x - cw / 2,
              top: cy - chh / 2,
              transform: `scale(${sc})`,
              opacity: o,
              filter: ad > 0.1 ? `brightness(${1 - Math.min(ad, 2) * 0.22})` : undefined,
            }}
          >
            <div style={{borderRadius: 20, boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.12)'}}>
              <IslandCrop slug={slug} w={cw} />
            </div>
            <div
              style={{
                marginTop: 28,
                textAlign: 'center',
                fontFamily: FONT,
                fontSize: V ? 40 : 32,
                fontWeight: 500,
                color: C.text,
                opacity: Math.max(0, 1 - ad * 1.4),
              }}
            >
              {theme(slug).name}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export {ALL};
