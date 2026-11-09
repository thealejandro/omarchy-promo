import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {useT} from '../i18n';
import {B, C, EASE, FONT, Words, ramp, useIsVertical, useSpr} from '../lib';
import {Aurora, GRAD} from './Intro';

export const CLOSE_SIG = 4 * B; // la firma entra con el acorde final, en el pulso 4

/**
 * Cierre de ~5 s con una sola llamada a la acción: la URL en horizontal y «Enlace en el perfil»
 * en el reel. Después, la firma (logotipo + «Hecho por thealejandro»).
 */
export const Close: React.FC<{dur: number}> = () => {
  const frame = useCurrentFrame();
  const V = useIsVertical();
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
