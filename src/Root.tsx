import React from 'react';
import {Composition, Still} from 'remotion';
import {FPS} from './lib';
import {Promo, horizontalScenes, totalFrames} from './Promo';
import {PromoVertical, verticalScenes} from './PromoVertical';
import {Poster} from './Poster';

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} width={1920} height={1080} fps={FPS} durationInFrames={totalFrames(horizontalScenes())} />
    <Composition
      id="PromoVertical"
      component={PromoVertical}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={totalFrames(verticalScenes())}
    />
    <Still id="Poster" component={Poster} width={1920} height={1080} />
  </>
);
