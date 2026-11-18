// /app/premium/:slug, the Figma "Unlock premium" frame (160:5150): the
// serif headline, Benefits / Free / Premium comparison, and Purchase, which
// opens the QR payment steps (/app/checkout/:slug).
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
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
export function PayBackdrop({ mobileWave = false }: { mobileWave?: boolean }) {
  return (
    <div aria-hidden className={'pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(160deg,#ffffff_0%,#fbfbff_45%,#f1edff_100%)] dark:bg-[linear-gradient(160deg,#121214_0%,#14151c_55%,#1b1830_100%)]' + (mobileWave ? ' max-sm:bg-[linear-gradient(96deg,#ffffff_16.479%,#fbfcff_61.801%,#e8e1ff_139.37%)]' : '')}>
      <svg className={'absolute bottom-0 left-0 h-[172px] w-full' + (mobileWave ? ' max-sm:hidden' : '')} viewBox="0 0 1519 172" preserveAspectRatio="none">
        <defs>
          <linearGradient id="nswave" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#dbe8ff" />
            <stop offset="0.55" stopColor="#e4e6fb" />
            <stop offset="1" stopColor="#efe6fc" />
          </linearGradient>
        </defs>
        <path d="M0 0c180 60 330 135 520 135S860 60 1040 52s330 40 479 40v80H0z" fill="url(#nswave)" className="dark:opacity-20" />
      </svg>
      {mobileWave ? <img src="/premium-mobile-wave.svg" alt="" width="381" height="102" className="absolute bottom-0 left-1/2 hidden max-w-none -translate-x-1/2 max-sm:block" /> : null}
    </div>
  );
}

export function BrandCorner({ mobileHidden = false }: { mobileHidden?: boolean }) {
  return (
    <Link to="/app/topics" aria-label="Back to topics" className={'absolute left-[68px] top-[44px] max-md:left-4 max-md:top-4' + (mobileHidden ? ' max-sm:hidden' : '')}>
      <img src="/app/ns-logo.webp" width={97} height={88} alt="Nano Syllabus" className="h-[88px] w-[97px] object-contain max-md:h-12 max-md:w-14 dark:brightness-0 dark:invert" />
    </Link>
  );
}

const Cross = ({ index }: { index: number }) => (
  <>
    <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#969db1] max-sm:hidden">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M1 1l10 10M11 1 1 11" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>
    </span>
    <img src={`/premium-free-${index + 1}.svg`} alt="" aria-hidden="true" width="17.269" height="17.269" className="hidden max-sm:block" />
  </>
);
const Check = () => (
  <>
    <span className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-[#bbd9ff] max-sm:hidden">
      <svg width="14" height="11" viewBox="0 0 14 11" aria-hidden><path d="M1.5 5.5 5 9l7.5-7.5" fill="none" stroke="#0755ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
    <img src="/premium-check.svg" alt="" aria-hidden="true" width="20.147" height="20.147" className="hidden max-sm:block" />
  </>
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
    return <Navigate to={`/app/courses/${slug}`} replace />;
  }
  const rowCls = 'flex h-[54px] items-center border-t border-[#e7e9f4] dark:border-white/10';
  return (
    <div className="relative top-0 isolate min-h-[100dvh] overflow-x-hidden px-4 pb-24 pt-[105px] text-[#0e193b] dark:text-white max-md:pt-24 max-sm:top-[-6px] max-sm:flex max-sm:flex-col max-sm:items-center max-sm:justify-center max-sm:gap-[21px] max-sm:px-[19px] max-sm:py-0">
      <PayBackdrop mobileWave />
      <BrandCorner mobileHidden />
      <h1 className="mx-auto max-w-[620px] text-center font-serif text-[48px] leading-[56px] max-sm:mb-0 max-sm:h-[56px] max-sm:w-[319px] max-sm:max-w-full max-sm:font-clash max-sm:text-[24px] max-sm:font-medium max-sm:leading-[24.966px]">
        Unlock the full {combo ? 'Semester' : 'Subject'}
        <br />
        experience with <span className="bg-[linear-gradient(90deg,#0e5cff,#2f8bff)] bg-clip-text text-transparent max-sm:bg-[linear-gradient(90deg,#0866ff,#1870ff)]">Premium</span>
      </h1>
      {combo ? (
        <p className="mt-3 text-center text-sm text-[#69738e] dark:text-[#a6a6af] max-sm:hidden">
          Semester {semester} combo · all {subjects} subjects at Rs.{COMBO_PER_SUBJECT.toLocaleString('en-IN')} each
        </p>
      ) : c ? (
        <p className="mt-3 text-center text-sm text-[#69738e] dark:text-[#a6a6af] max-sm:hidden">{c.title}</p>
      ) : null}

      <div className="mx-auto mt-[33px] flex w-full max-w-[708px] items-start overflow-x-auto pb-4 pt-1 max-sm:mt-0 max-sm:w-[min(337px,100%)] max-sm:max-w-full max-sm:gap-0 max-sm:overflow-visible max-sm:p-0">
        <div className="mt-[25px] min-w-[220px] flex-1 overflow-hidden rounded-l-[22px] bg-white dark:bg-[#18181a] max-sm:mt-0 max-sm:mr-[1.53%] max-sm:min-w-0 max-sm:w-[43.3%] max-sm:flex-none max-sm:overflow-visible max-sm:rounded-l-[19.572px] max-sm:border-l max-sm:border-t max-sm:border-white max-sm:pt-[14.391px]">
          <div className="flex h-[83px] items-center border-b border-[#e7e9f4] bg-[#f5f6fb] px-[38px] text-2xl font-semibold text-[#080c17] dark:border-white/10 dark:bg-white/5 dark:text-white max-sm:h-[47.778px] max-sm:rounded-tl-[19.572px] max-sm:px-[21.874px] max-sm:text-[13.815px] max-sm:leading-[18.42px]">Benefits</div>
          <div className="max-sm:flex max-sm:flex-col max-sm:gap-[9.038px] max-sm:pt-[2.303px]">
            {BENEFITS.map((b, i) => (
              <div key={b} className={rowCls + ' px-[38px] text-lg leading-7 text-[#0c0e15] dark:text-[#dfe1ea] max-sm:h-[31.084px] max-sm:px-[21.874px] max-sm:text-[10.361px] max-sm:leading-[12.912px] max-[359px]:px-3 max-[359px]:text-[8.5px] max-[359px]:leading-[10px] ' + (i === 0 ? 'mt-1 border-t-0 max-sm:mt-0' : '')}>
                <span className="max-sm:inline-block max-sm:w-[129.119px] max-sm:flex-none max-[359px]:w-[96px]">{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-[25px] w-[158px] shrink-0 bg-[#f7f7fc] dark:bg-white/[0.04] max-sm:mt-0 max-sm:w-[26.82%] max-sm:shrink max-sm:pt-[14.391px]">
          <div className="flex h-[83px] items-center justify-center bg-[#e8eaf4] text-2xl font-semibold text-[#69738e] dark:bg-white/10 max-sm:h-[47.778px] max-sm:text-[13.815px]">Free</div>
          <div className="max-sm:flex max-sm:flex-col max-sm:gap-[9.167px] max-sm:pt-[2.303px]">
            {BENEFITS.map((b, i) => (
              <div key={b} className={rowCls + ' justify-center max-sm:h-[31.084px] ' + (i === 0 ? 'mt-1 border-t-0 max-sm:mt-0' : '')}>
                <Cross index={i} />
              </div>
            ))}
          </div>
        </div>
        <div className="w-[166px] shrink-0 rounded-[29px] bg-[linear-gradient(180deg,#5b8cff,#a9d8ff)] p-1 shadow-[0_12px_32px_rgba(91,140,255,0.28)] max-sm:h-[256.946px] max-sm:w-[28.35%] max-sm:shrink max-sm:rounded-[16.694px] max-sm:bg-[linear-gradient(90deg,#819bff,#a4dfff)] max-sm:p-[2.303px] max-sm:shadow-[0_10.361px_18.42px_rgba(124,156,255,0.15)]">
          <div className="h-full overflow-hidden rounded-[25px] bg-[linear-gradient(180deg,#6b8dff_0%,#8fc4ff_100%)] max-sm:rounded-[14.391px] max-sm:bg-[linear-gradient(90deg,#4d76ff,#83d6ff)]">
            <div className="flex h-[104px] flex-col items-center justify-center text-2xl font-semibold leading-8 text-[#0e193b] max-sm:h-[59.866px] max-sm:text-[13.815px] max-sm:leading-[18.42px]">
              <span>Premium</span>
              <span>{combo ? `Rs.${combo.toLocaleString('en-IN')}` : c ? `Rs.${rupees(c.pricePaisa)}` : '…'}</span>
              {combo ? <span className="mt-0.5 text-xs font-medium leading-4 text-[#0e193b]/70">{subjects} × Rs.{COMBO_PER_SUBJECT.toLocaleString('en-IN')}</span> : null}
            </div>
            <div className="rounded-[24px] bg-[#fcfcff] pb-1 dark:bg-[#1c1d24] max-sm:flex max-sm:flex-col max-sm:gap-[9.038px] max-sm:rounded-[13.815px] max-sm:pt-[2.303px]">
              {BENEFITS.map((b, i) => (
                <div key={b} className={rowCls + ' justify-center max-sm:h-[31.084px] ' + (i === 0 ? 'border-t-0' : '')}><Check /></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[33px] flex justify-center max-sm:mt-0">
        <Link
          to={`/app/checkout/${slug}`}
          className="flex h-[60px] w-[259px] items-center justify-center gap-3 rounded-[27px] bg-[linear-gradient(180deg,#0a5cff,#0335d8)] text-base font-semibold text-white shadow-[0_10px_24px_rgba(7,85,255,0.30)] transition hover:brightness-110 max-sm:h-[26.749px] max-sm:w-[115.467px] max-sm:gap-[5.796px] max-sm:rounded-[12.037px] max-sm:bg-[linear-gradient(180deg,#0874ff_0%,#003ff4_55%,#0016be_100%)] max-sm:text-[9px] max-sm:leading-[10.7px] max-sm:shadow-[0_5.796px_10.7px_rgba(56,94,255,0.19)]"
        >
          Purchase
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden className="max-sm:hidden"><path d="M2 10h15M11 4l6 6-6 6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <img src="/premium-continue-arrow.svg" alt="" aria-hidden="true" width="9.851" height="9.719" className="hidden max-sm:block" />
        </Link>
      </div>
    </div>
  );
}
