// Build-time entry: scripts/prerender-landing.mjs renders this to static HTML.
import { renderToStaticMarkup } from 'react-dom/server';
import { LiveLanding } from './LiveLanding';
import { MainLandingView, type LandingVariant } from './MainLandingView';

export const render = (variant: LandingVariant = 'waitlist') => renderToStaticMarkup(<MainLandingView variant={variant} />);

// live.nanosyllabus.com: the Figma redesign (LiveLanding.tsx).
export const renderLive = () => renderToStaticMarkup(<LiveLanding />);
