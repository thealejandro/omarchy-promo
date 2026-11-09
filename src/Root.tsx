import React from 'react';
import {Composition, Still} from 'remotion';
import {LANGS} from './i18n';
import {FPS} from './lib';
import {Promo, Reel} from './Promo';
import {Cover, Poster} from './Poster';
import {totalFrames} from './Timeline';

// Una composición por formato e idioma: Promo-es, Promo-en (1920x1080, ~60 s),
// Reel-es, Reel-en (1080x1920, ~29 s), y sus portadas.
export const Root: React.FC = () => (
  <>
    {LANGS.map((lang) => (
      <React.Fragment key={lang}>
        <Composition id={`Promo-${lang}`} component={Promo} width={1920} height={1080} fps={FPS} durationInFrames={totalFrames('h')} defaultProps={{lang}} />
        <Composition id={`Reel-${lang}`} component={Reel} width={1080} height={1920} fps={FPS} durationInFrames={totalFrames('v')} defaultProps={{lang}} />
        <Still id={`Poster-${lang}`} component={Poster} width={1920} height={1080} defaultProps={{lang}} />
        <Still id={`Cover-${lang}`} component={Cover} width={1080} height={1920} defaultProps={{lang}} />
      </React.Fragment>
    ))}
  </>
);
