// /app/premium/:slug, the Figma "Unlock premium" frame (160:5150): the
// serif headline, Benefits / Free / Premium comparison, and Purchase, which
// opens the QR payment steps (/app/checkout/:slug).
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { config } from '../lib/config';
import { SITE, useSeo } from '../lib/seo';
import type { CourseDetail } from '../lib/types';
import { COMBO_PER_SUBJECT } from './Topics';

export const rupees = (paisa: number) => (paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const BENEFITS = [
  '100% syllabus coverage',
  '100% old-question model answers',
  'Complete interactive video explanations',
  'Exam-readiness tracking',
  'Jump ahead and personalized practice',
];

/** The soft page background shared by premium and payment (gradient + wave). */
export function PayBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(160deg,#ffffff_0%,#fbfbff_45%,#f1edff_100%)] dark:bg-[linear-gradient(160deg,#121214_0%,#14151c_55%,#1b1830_100%)]">
      <svg className="absolute bottom-0 left-0 h-[172px] w-full" viewBox="0 0 1519 172" preserveAspectRatio="none">
        <defs>
          <linearGradient id="nswave" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#dbe8ff" />
            <stop offset="0.55" stopColor="#e4e6fb" />
            <stop offset="1" stopColor="#efe6fc" />
          </linearGradient>
        </defs>
        <path d="M0 0c180 60 330 135 520 135S860 60 1040 52s330 40 479 40v80H0z" fill="url(#nswave)" className="dark:opacity-20" />
      </svg>
    </div>
  );
}

export function BrandCorner() {
  return (
    <Link to="/app/topics" aria-label="Back to topics" className="absolute left-[68px] top-[44px] max-md:left-4 max-md:top-4">
      <img src="/app/ns-logo.webp" width={97} height={88} alt="Nano Syllabus" className="h-[88px] w-[97px] object-contain max-md:h-12 max-md:w-14 dark:brightness-0 dark:invert" />
    </Link>
  );
}

const Cross = () => (
  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#969db1]">
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M1 1l10 10M11 1 1 11" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>
  </span>
);
const Check = () => (
  <span className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-[#bbd9ff]">
    <svg width="14" height="11" viewBox="0 0 14 11" aria-hidden><path d="M1.5 5.5 5 9l7.5-7.5" fill="none" stroke="#0755ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
);

export default function Premium() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  // From a semester's "Unlock All": the combo of every subject in it.
  const [q] = useSearchParams();
  const subjects = Math.min(20, Math.max(0, Number(q.get('subjects')) || 0));
  const semester = Number(q.get('semester')) || 0;
  const combo = subjects > 1 ? subjects * COMBO_PER_SUBJECT : 0;
  const { data: c, error } = useQuery<CourseDetail>(`course:${slug}`, `/api/courses/${encodeURIComponent(slug)}`);
  useSeo({ title: `Premium · ${c?.title ?? 'Course'} · ${SITE}`, noindex: true });
  if (error) return <Navigate to="/app/topics" replace />;
  if (c && (c.owned || c.pricePaisa === 0 || user?.role === 'admin')) {
    return <Navigate to={config.appCourses[slug] ? `/app/courses/${slug}/learn` : '/app/topics'} replace />;
  }
  const rowCls = 'flex h-[54px] items-center border-t border-[#e7e9f4] dark:border-white/10';
  return (
    <div className="relative isolate min-h-[100dvh] overflow-x-hidden px-4 pb-24 pt-[105px] text-[#0e193b] dark:text-white max-md:pt-24">
      <PayBackdrop />
      <BrandCorner />
      <h1 className="mx-auto max-w-[620px] text-center font-serif text-[48px] leading-[56px] max-sm:text-[34px] max-sm:leading-[42px]">
        Unlock the full {combo ? 'Semester' : 'Subject'}
        <br />
        experience with <span className="bg-[linear-gradient(90deg,#0e5cff,#2f8bff)] bg-clip-text text-transparent">Premium</span>
      </h1>
      {combo ? (
        <p className="mt-3 text-center text-sm text-[#69738e] dark:text-[#a6a6af]">
          Semester {semester} combo · all {subjects} subjects at Rs.{COMBO_PER_SUBJECT.toLocaleString('en-IN')} each
        </p>
      ) : c ? (
        <p className="mt-3 text-center text-sm text-[#69738e] dark:text-[#a6a6af]">{c.title}</p>
      ) : null}

      <div className="mx-auto mt-[33px] flex w-full max-w-[708px] items-start overflow-x-auto pb-4 pt-1 max-sm:mt-6">
        <div className="mt-[25px] min-w-[220px] flex-1 overflow-hidden rounded-l-[22px] bg-white dark:bg-[#18181a]">
          <div className="flex h-[83px] items-center border-b border-[#e7e9f4] bg-[#f5f6fb] px-[38px] text-2xl font-semibold text-[#080c17] dark:border-white/10 dark:bg-white/5 dark:text-white max-sm:px-4 max-sm:text-lg">Benefits</div>
          {BENEFITS.map((b, i) => (
            <div key={b} className={rowCls + ' px-[38px] text-lg leading-7 text-[#0c0e15] dark:text-[#dfe1ea] max-sm:px-4 max-sm:text-sm ' + (i === 0 ? 'mt-1 border-t-0' : '')}>{b}</div>
          ))}
        </div>
        <div className="mt-[25px] w-[158px] shrink-0 bg-[#f7f7fc] dark:bg-white/[0.04] max-sm:w-[90px]">
          <div className="flex h-[83px] items-center justify-center bg-[#e8eaf4] text-2xl font-semibold text-[#69738e] dark:bg-white/10 max-sm:text-lg">Free</div>
          {BENEFITS.map((b, i) => (
            <div key={b} className={rowCls + ' justify-center ' + (i === 0 ? 'mt-1 border-t-0' : '')}><Cross /></div>
          ))}
        </div>
        <div className="w-[166px] shrink-0 rounded-[29px] bg-[linear-gradient(180deg,#5b8cff,#a9d8ff)] p-1 shadow-[0_12px_32px_rgba(91,140,255,0.28)] max-sm:w-[110px]">
          <div className="overflow-hidden rounded-[25px] bg-[linear-gradient(180deg,#6b8dff_0%,#8fc4ff_100%)]">
            <div className="flex h-[104px] flex-col items-center justify-center text-2xl font-semibold leading-8 text-[#0e193b] max-sm:text-base max-sm:leading-6">
              <span>Premium</span>
              <span>{combo ? `Rs.${combo.toLocaleString('en-IN')}` : c ? `Rs.${rupees(c.pricePaisa)}` : '…'}</span>
              {combo ? <span className="mt-0.5 text-xs font-medium leading-4 text-[#0e193b]/70">{subjects} × Rs.{COMBO_PER_SUBJECT.toLocaleString('en-IN')}</span> : null}
            </div>
            <div className="rounded-[24px] bg-[#fcfcff] pb-1 dark:bg-[#1c1d24]">
              {BENEFITS.map((b, i) => (
                <div key={b} className={rowCls + ' justify-center ' + (i === 0 ? 'border-t-0' : '')}><Check /></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[33px] flex justify-center">
        <Link
          to={`/app/checkout/${slug}`}
          className="flex h-[60px] w-[259px] items-center justify-center gap-3 rounded-[27px] bg-[linear-gradient(180deg,#0a5cff,#0335d8)] text-base font-semibold text-white shadow-[0_10px_24px_rgba(7,85,255,0.30)] transition hover:brightness-110"
        >
          Purchase
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden><path d="M2 10h15M11 4l6 6-6 6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>
    </div>
  );
}
