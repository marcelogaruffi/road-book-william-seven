
import { renderToString } from 'react-dom/server';
import React from 'react';
import { RoadbookForm } from './src/components/RoadbookForm.tsx';
import { emptyRoadbook } from './src/lib/roadbook-types.ts';

global.window = { matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }) };
global.document = {};
global.navigator = {};

try {
  const element = React.createElement(RoadbookForm, { initial: emptyRoadbook });
  const html = renderToString(element);
  console.log('RENDER SUCCESS! HTML length:', html.length);
} catch (err) {
  console.error('RENDER ERROR:', err);
}
