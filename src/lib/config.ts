// Deployment settings, read at runtime. The Go server writes
// window.__NS_CONFIG__ into every page (SITE_NAME, SITE_DESCRIPTION,
// CONTENT_URL …), so one client build serves any site or environment.
// `npm run dev` gets the defaults below.

export type RuntimeConfig = {
  siteName: string;
  siteDescription: string;
  /** Where content releases are served from ("/content/" or a CDN). */
  contentUrl: string;
  /** Lesson-module contract this app implements (see src/content/host.ts). */
  lessonApi: number;
  /** "Continue with Google" is set up on the server. */
  googleAuth: boolean;
  /** The server emails sign-up and password-reset codes. */
  emailCodes: boolean;
};

declare global {
  interface Window {
    __NS_CONFIG__?: Partial<RuntimeConfig>;
  }
}

export const config: RuntimeConfig = {
  siteName: 'Nano Syllabus',
  siteDescription:
    'Short video lessons and interactive explainers for IOE and Nepali university syllabi. Learn each subject topic by topic.',
  contentUrl: '/content/',
  lessonApi: 1,
  googleAuth: false,
  emailCodes: false,
  ...(typeof window !== 'undefined' ? window.__NS_CONFIG__ : undefined),
};
