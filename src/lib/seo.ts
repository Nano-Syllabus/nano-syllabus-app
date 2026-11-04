import { useEffect } from 'react';
import { config } from './config';

// Keeps <head> right while the user navigates inside the SPA. The first load
// already has these tags from the server (internal/httpapi/spa.go writes the
// same ones), so crawlers that don't run JavaScript still see them.

export const SITE = config.siteName;
export const SITE_DESCRIPTION = config.siteDescription;

type Seo = {
  title: string;
  description?: string;
  /** Path for the canonical URL, e.g. "/courses/electrical-machines". Omit for private pages. */
  path?: string;
  image?: string;
  /** Private / signed-in pages: keep them out of search results. */
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
};

function meta(attr: 'name' | 'property', key: string, content: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (content === undefined) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function link(rel: string, href: string | undefined) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function absolute(url: string) {
  return new URL(url, location.origin).href;
}

export function useSeo({ title, description = SITE_DESCRIPTION, path, image, noindex, jsonLd }: Seo) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    document.title = title;
    const canonical = path && !noindex ? absolute(path) : undefined;
    meta('name', 'description', description);
    meta('name', 'robots', noindex ? 'noindex' : undefined);
    link('canonical', canonical);
    meta('property', 'og:title', title);
    meta('property', 'og:description', description);
    meta('property', 'og:url', canonical);
    meta('property', 'og:image', image ? absolute(image) : undefined);
    meta('name', 'twitter:card', image ? 'summary_large_image' : undefined);

    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
    if (ld) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = ld;
      document.head.appendChild(s);
    }
  }, [title, description, path, image, noindex, ld]);
}

export function courseJsonLd(c: {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  pricePaisa: number;
  lessonCount: number;
  coverUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: c.title,
    description: c.description || c.tagline,
    url: absolute(`/courses/${c.slug}`),
    ...(c.coverUrl ? { image: absolute(c.coverUrl) } : {}),
    provider: { '@type': 'Organization', name: SITE, sameAs: location.origin },
    offers: {
      '@type': 'Offer',
      category: c.pricePaisa === 0 ? 'Free' : 'Paid',
      price: (c.pricePaisa / 100).toString(),
      priceCurrency: 'NPR',
    },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: `${c.lessonCount} lessons` },
  };
}
