import React from 'react';
import {CameraMotionBlur} from '@remotion/motion-blur';

/**
 * Desenfoque de movimiento real (superpone sub-fotogramas) solo en los tramos de movimiento
 * grande: fuera de ellos no cuesta nada. Los hijos deben leer useCurrentFrame() por sí mismos.
 *
 * Se usa <CameraMotionBlur> y no <HtmlInCanvasMotionBlur>: el navegador de render de Remotion
 * 4.0.541 aún no trae HTML-in-canvas y este último sale en blanco.
 */
export const Blur: React.FC<{active: boolean; children: React.ReactNode}> = ({active, children}) => {
  if (!active) return <>{children}</>;
  return (
    <CameraMotionBlur samples={6} shutterAngle={180}>
      {children}
    </CameraMotionBlur>
  );
};
