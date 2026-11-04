// Build-time entry: scripts/prerender-landing.mjs renders this to static HTML.
import { renderToStaticMarkup } from 'react-dom/server';
import { MainLandingView } from './MainLandingView';

export const render = () => renderToStaticMarkup(<MainLandingView />);
