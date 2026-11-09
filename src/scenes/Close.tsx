import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {useT} from '../i18n';
import {B, C, EASE, FONT, Words, ramp, useIsVertical, useSpr} from '../lib';
import {Aurora, GRAD} from './Intro';

// Iconos monocromos de las redes (los mismos de thealejandro.dev, src/components/Icono.astro).
const ICON_FILL: Record<string, string> = {
  github:
    'M12 .3a12 12 0 0 0-3.8 23.38c.6.12.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3',
  x: 'M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.6l5.24 6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3Z',
  twitch:
    'M11.57 4.71h1.72v5.15h-1.72Zm4.72 0H18v5.15h-1.71ZM6 0 1.71 4.29v15.42h5.15V24l4.28-4.29h3.43L22.29 12V0Zm14.57 11.14-3.43 3.43h-3.43l-3 3v-3H6.86V1.71h13.71Z',
};
const ICON_STROKE: Record<string, string> = {
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  directo:
    '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.48M7.76 16.24a6 6 0 0 1 0-8.48M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/>',
};
const Icon: React.FC<{name: string; size: number}> = ({name, size}) =>
  ICON_FILL[name] ? (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d={ICON_FILL[name]} />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      dangerouslySetInnerHTML={{__html: ICON_STROKE[name]}}
    />
  );

/**
 * Cierre del reel (WhatsApp, Reels): todo entra con el corte y se queda hasta el final.
 * Jerarquía: la web en grande > la firma > redes y horario de los directos. Todo dentro de la
 * zona segura (x 65–1015, y 269–1248).
 */
const CloseReel: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useT();
  const rows = ramp(frame, 10, 24, EASE); // redes: un instante después, para que se lea primero la web
  const drift = 1 + frame * 0.00004;
  const row: React.CSSProperties = {display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18};
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Aurora opacity={0.2} />
      <AbsoluteFill style={{transform: `scale(${drift})`}}>
        <div style={{position: 'absolute', top: 300, left: 65, right: 65, textAlign: 'center', fontFamily: FONT, fontWeight: 650, letterSpacing: '-0.04em', lineHeight: 1.02}}>
          <div style={{fontSize: 104, color: C.text}}>thealejandro.dev</div>
          <div style={{fontSize: 104, backgroundImage: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>/omarchy</div>
          <div style={{marginTop: 26, fontSize: 38, fontWeight: 500, letterSpacing: '-0.01em', color: C.dim}}>{t.freeInBio}</div>
        </div>
        {/* Logotipo sin efectos (MARCA.md §0): entra con el corte, sin fundido. */}
        <Img src={staticFile('marca/logotipo.svg')} style={{position: 'absolute', top: 690, left: (1080 - 600) / 2, width: 600, height: 'auto'}} />
        <div
          style={{
            position: 'absolute',
            top: 840,
            left: 65,
            right: 65,
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            fontFamily: FONT,
            fontSize: 38,
            fontWeight: 500,
            color: C.text,
            letterSpacing: '-0.01em',
            opacity: rows,
          }}
        >
          <div style={row}>
            <span style={{display: 'flex', gap: 14, color: C.dim}}>
              <Icon name="instagram" size={36} />
              <Icon name="x" size={34} />
              <Icon name="twitch" size={36} />
            </span>
            @thealejandro__
          </div>
          <div style={row}>
            <span style={{display: 'flex', color: C.dim}}>
              <Icon name="github" size={36} />
            </span>
            github.com/thealejandro
          </div>
          <div style={{...row, color: C.dim, fontSize: 34}}>
            <span style={{display: 'flex'}}>
              <Icon name="directo" size={34} />
            </span>
            {t.liveSchedule}
          </div>
        </div>
        <div style={{position: 'absolute', top: 1150, left: 65, right: 65, textAlign: 'center', fontFamily: FONT, fontSize: 22, lineHeight: 1.5, color: C.faint}}>
          {t.legal}
          <br />
          {t.music}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const CLOSE_SIG = 4 * B; // la firma entra con el acorde final, en el pulso 4

/**
 * Cierre de ~5 s con una sola llamada a la acción: la URL en horizontal y «Enlace en el perfil»
 * en el reel. Después, la firma (logotipo + «Hecho por thealejandro»).
 */
export const Close: React.FC<{dur: number}> = () => (useIsVertical() ? <CloseReel /> : <CloseWide />);

const CloseWide: React.FC = () => {
  const frame = useCurrentFrame();
  const V = false;
  const t = useT();
  const sig = useSpr(CLOSE_SIG, 40);
  const sigText = ramp(frame, CLOSE_SIG + 14, CLOSE_SIG + 38, EASE);
  const fine = ramp(frame, B, B + 30, EASE);
  const lift = (V ? 70 : 90) * useSpr(CLOSE_SIG - 6, 40);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Aurora opacity={0.2} />
      <div style={{position: 'absolute', left: 0, right: 0, top: V ? 400 : 330, transform: `translateY(${-lift}px)`}}>
        {V ? (
          <Words text={t.inBio} start={0} stagger={5} size={128} weight={650} gradient={GRAD} />
        ) : (
          <Words text="thealejandro.dev/omarchy" start={0} size={128} weight={650} gradient={GRAD} tracking="-0.04em" />
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          top: V ? 760 : 560,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: V ? 26 : 22,
        }}
      >
        {/* Logotipo sin efectos (MARCA.md §0): solo fundido y escala sutil. */}
        <Img src={staticFile('marca/logotipo.svg')} style={{width: V ? 560 : 460, height: 'auto', opacity: sig, transform: `scale(${0.96 + 0.04 * sig})`}} />
        <div style={{fontFamily: FONT, fontSize: V ? 38 : 32, color: C.dim, opacity: sigText, letterSpacing: '-0.005em'}}>{t.madeBy}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: V ? 1130 : 976,
          left: 65,
          right: 65,
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: V ? 24 : 21,
          lineHeight: 1.5,
          color: C.faint,
          opacity: fine,
        }}
      >
        {t.legal}
        {V ? <br /> : <span>{'  ·  '}</span>}
        {t.music}
      </div>
    </AbsoluteFill>
  );
};
