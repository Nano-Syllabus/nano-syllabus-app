// /app/courses/:slug/learn: a course that is its own app (Electrical
// Machines → the brilliant-sample app at /em/). It opens as a full page of
// its own, exactly as brilliant-sample looks, with no sidebar or frame
// around it. Only buyers and admins get in (the server enforces it on every
// file); anyone else is sent to the course page to buy it.

import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { config } from '../lib/config';
import { SITE, useSeo } from '../lib/seo';
import type { CourseDetail } from '../lib/types';

export default function AppCourse() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { data: c, error } = useQuery<CourseDetail>(`course:${slug}`, `/api/courses/${encodeURIComponent(slug)}`);
  const url = config.appCourses[slug];
  useSeo({ title: `${c?.title ?? 'Course'} · ${SITE}`, noindex: true });
  const allowed = Boolean(url && c && (c.owned || user?.role === 'admin'));
  // replace(): the browser's Back button returns to the page that opened it.
  useEffect(() => { if (allowed) window.location.replace(url); }, [allowed, url]);
  if (!url || error) return <Navigate to={`/courses/${slug}`} replace />;
  if (!c) return <div className="h-full w-full animate-pulse bg-bg-secondary" />;
  if (!c.owned && user?.role !== 'admin') return <Navigate to={`/app/premium/${slug}`} replace />;
  return <div className="h-full w-full animate-pulse bg-bg-secondary" />;
}
