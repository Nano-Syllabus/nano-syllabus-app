import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

// Lessons compiled into the app. This is the fallback path: lessons normally
// come from nano-syllabus-content releases, loaded at runtime by ./host.ts,
// so they ship without an app build. Use this only for a lesson that must
// work with no content release at all (a lesson with kind "interactive" and a
// contentRef naming an entry below). Entries are lazy, so their code only
// downloads when that lesson is opened.

export type InteractiveProps = {
  /** Call when the learner finishes the lesson; the app records completion. */
  onComplete: () => void;
  /** Report progress through the lesson, 0 to 1 (saved as the resume point). */
  onProgress?: (fraction: number) => void;
};

export const interactives: Record<string, LazyExoticComponent<ComponentType<InteractiveProps>>> = {
  'demo/hello': lazy(() => import('./demo/Hello')),
};
