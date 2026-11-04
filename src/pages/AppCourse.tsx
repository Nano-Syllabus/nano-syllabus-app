// /app/courses/:slug/learn: a course that is its own app (Electrical
// Machines → the brilliant-sample player at /em/), shown inside the app's
// sidebar, full height. Only buyers and admins get in (the server enforces
// it on every file); anyone else is sent to the course page to buy it.

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
  if (!url || error) return <Navigate to={`/courses/${slug}`} replace />;
  if (!c) return <div className="h-full w-full animate-pulse bg-bg-secondary" />;
  if (!c.owned && user?.role !== 'admin') return <Navigate to={`/courses/${slug}`} replace />;
  return <iframe src={url} title={c.title} className="block h-full w-full border-0" allow="autoplay; fullscreen" allowFullScreen />;
}
