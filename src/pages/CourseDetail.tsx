// /courses/:slug, the Figma course page ("csit", 160:5625): blue hero with
// the course name, a preview video, Modules beside an Enroll card, Course
// Overview, Why Choose, contacts and payment details, footer. Every value
// comes from the course itself. The page draws its own header.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorBox, NotFound } from '../components/bits';
import { api, invalidate, setCached, useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { plural } from '../lib/format';
import { SITE, courseJsonLd, useSeo } from '../lib/seo';
import type { CourseDetail as Detail } from '../lib/types';
import { rupees } from './Premium';

const DEMO = 'dc-motor-taster';
const ACCESS = '6 month';

const Arrow = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden><path d="M2 10 10 2M4 2h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const FEATURES = [
  { title: 'Video Lectures', text: 'Complete syllabus coverage with easy-to-understand lessons.', bg: '#ebedff', icon: <path d="M8 5v14l11-7z" fill="none" stroke="#3b49df" strokeWidth="1.8" strokeLinejoin="round" /> },
  { title: 'Practice and Assessment', text: 'Chapter-wise practice questions and mock tests.', bg: '#e8fadf', icon: <><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#2f7a3a" strokeWidth="1.8" /><path d="M8 9h8M8 13h5" stroke="#2f7a3a" strokeWidth="1.8" strokeLinecap="round" /></> },
  { title: 'Progress Tracking', text: 'Track your performance and monitor your progress.', bg: '#e8f8ee', icon: <path d="M6 19v-5M11 19V9M16 19V5" stroke="#1d6b3f" strokeWidth="2.2" strokeLinecap="round" /> },
  { title: 'Study Materials', text: 'Well-organized lessons based on your syllabus.', bg: '#ebedff', icon: <path d="M3 6s2-2 5-2 4 2 4 2 1-2 4-2 5 2 5 2v13s-2-1-5-1-4 1-4 1-1-1-4-1-5 1-5 1z M12 6v13" fill="none" stroke="#3b49df" strokeWidth="1.7" strokeLinejoin="round" /> },
];
const WHY = [
  ['Trusted Platform', 'Learn with confidence'],
  ['Clear Explanation', 'Study at your own pace'],
  ['Instant Feedback', 'Get the right direction'],
  ['Exam Focused', 'Get the perfect score'],
];

const ico = (d: React.ReactNode) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3049ed" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>;

export default function CourseDetail() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: c, error } = useQuery<Detail>(`course:${slug}`, `/api/courses/${encodeURIComponent(slug)}`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [openModule, setOpenModule] = useState<string | null>(null);

  useSeo({
    title: c ? `${c.title} · ${SITE}` : SITE,
    description: c ? c.tagline || c.description.slice(0, 200) : undefined,
    path: `/courses/${slug}`,
    image: c?.coverUrl || undefined,
    jsonLd: c ? courseJsonLd(c) : undefined,
  });

  if (error?.status === 404) return <NotFound />;
  if (error) return <main className="wrap page"><ErrorBox message={error.message} retry={() => location.reload()} /></main>;
  if (!c) return <div className="min-h-[100dvh] bg-[#fefefe]"><div className="h-[83px] bg-[#f1f1f1]" /><div className="h-[560px] animate-pulse bg-[#166cdb]" /></div>;

  const canOpen = c.owned || user?.role === 'admin';
  const startPath = `/app/courses/${c.slug}`;
  const paid = c.pricePaisa > 0;

  async function start() {
    if (!user) return navigate(`/signup?next=${encodeURIComponent(`/courses/${slug}`)}`);
    if (!c) return;
    if (canOpen) return navigate(startPath);
    if (paid) return navigate(`/app/premium/${c.slug}`);
    setBusy(true);
    setActionError('');
    try {
      await api(`/api/courses/${c.slug}/enroll`, { method: 'POST', body: {} });
      setCached<Detail>(`course:${slug}`, (prev) => ({ ...(prev ?? c), owned: true }));
      invalidate('home', `subject:${slug}/`);
      navigate(startPath);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const cta = canOpen ? 'Start learning' : paid ? 'Enroll Now' : 'Start free';
  const previewHref = c.slug === DEMO ? null : user ? `/courses/${DEMO}` : `/signup?next=${encodeURIComponent(`/courses/${DEMO}`)}`;
  const sessions = c.subjects.reduce((n, s) => n + s.lessonCount, 0);

  return (
    <div className="min-h-[100dvh] bg-[#fefefe] font-sans text-[#0b1230]">
      <header className="h-[83px] border-b border-[#dedede] bg-[#f1f1f1]">
        <div className="mx-auto flex h-full w-[min(1274px,100%-32px)] items-center justify-between">
          <Link to={user ? '/app/topics' : '/'} aria-label={`${SITE} home`}>
            <img src="/app/ns-logo.webp" width={74} height={68} alt="" className="h-[68px] w-[74px] object-contain max-sm:h-12 max-sm:w-14" />
          </Link>
          <Link to={user ? '/app/topics' : '/login'} className="flex h-11 items-center gap-4 rounded-[14px] bg-[#141415] px-[22px] font-manrope text-sm font-medium text-white transition hover:bg-black">
            {user ? 'Continue Learning' : 'Sign in'} <Arrow />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#166cdb] text-white">
        <div aria-hidden className="absolute left-[calc(50%+78px)] top-[62px] h-[718px] w-[718px] rounded-full bg-[#187cff] blur-[93px]" />
        <div className="relative mx-auto flex min-h-[800px] w-[min(1252px,100%-32px)] items-center justify-between gap-8 py-16 max-lg:min-h-0 max-lg:flex-col max-lg:items-start">
          <div className="max-w-[601px]">
            <h1 className="font-manrope text-[74px] font-extrabold leading-[72px] tracking-[-0.01em] max-md:text-[44px] max-md:leading-[48px]">
              NanoSyllabus
              <br />
              <span className="text-[#d5ff32]">{c.title}</span> Course
            </h1>
            <p className="mt-[57px] max-w-[527px] text-[22.75px] leading-[38.4px] text-[#e3e3e3] max-md:mt-6 max-md:text-lg max-md:leading-8">{c.tagline || c.description}</p>
            {paid ? (
              <div className="mt-[58px] inline-flex h-[67px] items-center gap-[17px] rounded-[20.7px] border-[1.4px] border-white px-[22px] max-md:mt-8">
                <svg width="37" height="37" viewBox="0 0 24 24" aria-hidden><path fill="#d5ff32" d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2zm-2 7v11h14V9zm2 2h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" /></svg>
                <span className="text-[32px] font-bold leading-[37px] capitalize">{ACCESS.replace('month', 'Month')}</span>
              </div>
            ) : null}
          </div>
          <img src="/app/course-hero.webp" width={556} height={424} alt="" className="relative h-auto w-[556px] max-w-full" />
        </div>
      </section>

      <div className="mx-auto w-[min(1274px,100%-32px)]">
        <div className="relative mt-[62px] overflow-hidden rounded-[15px]">
          <img src="/app/course-preview.webp" width={1268} height={789} alt="" className="block h-auto w-full" />
          {previewHref ? (
            <Link to={previewHref} className="absolute left-1/2 top-1/2 flex h-[74px] -translate-x-1/2 -translate-y-1/2 items-center gap-[17px] rounded-[29.6px] bg-white px-4 pr-[22px] text-[26.5px] font-semibold text-[#3b69fc] shadow-lg transition hover:scale-[1.03] max-sm:h-14 max-sm:text-lg">
              <svg width="41" height="41" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="10" fill="#3b69fc" /><path d="M10 8v8l6-4z" fill="#fff" /></svg>
              Watch Preview
            </Link>
          ) : null}
        </div>

        <h2 className="mt-[23px] pl-[27px] font-manrope text-[32px] font-extrabold leading-10 text-[#1c1e1a] max-sm:pl-0 max-sm:text-2xl">NanoSyllabus: {c.title}</h2>

        <div className="mt-[40px] grid items-start gap-12 lg:grid-cols-[740px_484px]">
          <div className="overflow-hidden rounded-[20px] border-[1.4px] border-[#e1e8f0] bg-white shadow-[0_2px_10px_rgba(16,24,40,0.04)]">
            <div className="flex items-center justify-between border-b border-[#e1e8f0] bg-[#eef2ff] px-[29px] py-[17px] font-manrope text-[17px]">
              <span className="font-semibold text-[#1c2a3a]">Modules</span>
              <span className="text-[#61758a]">{plural(sessions, 'session')}</span>
            </div>
            <ol className="max-h-[224px] overflow-y-auto [scrollbar-color:#cacaca_#eeeeee] [scrollbar-width:thin]">
              {c.subjects.map((s, i) => {
                const open = openModule === s.slug;
                return (
                  <li key={s.slug} className="border-b border-[#eef1f5] last:border-0">
                    <button type="button" aria-expanded={open} onClick={() => setOpenModule(open ? null : s.slug)} className="flex w-full cursor-pointer items-center gap-4 px-[29px] py-[21px] text-left">
                      <span className={'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[17px] font-semibold ' + (i === 0 ? 'bg-[#3b69fc] text-white' : 'bg-[#eef2ff] text-[#3b69fc]')}>{i + 1}</span>
                      <span className="min-w-0 flex-1 text-[17px] font-semibold text-[#0d1829]">{s.title}</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className={'shrink-0 text-[#61758a] transition ' + (open ? 'rotate-180' : '')}><path d="m3 5 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                    </button>
                    {open ? (
                      <p className="-mt-2 px-[79px] pb-4 text-[15px] text-[#304254]">
                        {s.description || (s.lessonCount ? `${plural(s.lessonCount, 'lesson')}` : 'Lessons are on the way.')}
                        {s.description && s.lessonCount ? ` · ${plural(s.lessonCount, 'lesson')}` : ''}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-[22.5px] border-[1.4px] border-[#e1e8f0] bg-white p-[29px] shadow-[0_2px_10px_rgba(16,24,40,0.05)]">
            <p className="flex items-center gap-3 font-manrope text-lg text-[#61758a]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e8a317" strokeWidth="1.8" strokeLinejoin="round" aria-hidden><path d="M12 3 2 20h20zM12 10v4M12 17v.5" /></svg>
              {paid ? 'Once paid, non-refundable' : 'Free with an account'}
            </p>
            <hr className="my-[28px] border-[#eef1f5]" />
            <p className="flex items-start gap-4 text-[17px] leading-[22.5px] text-[#304254]">
              <svg width="24" height="26" viewBox="0 0 24 26" aria-hidden className="mt-1 shrink-0"><path d="M12 1 2 5v7c0 6 4.3 11.4 10 13 5.7-1.6 10-7 10-13V5z" fill="#3b69fc" /><path d="m7.5 13 3 3 6-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {paid ? `Pay ${'NPR ' + rupees(c.pricePaisa)} by QR from any bank app, eSewa or Khalti; we confirm it and open your access.` : 'Start straight away; no payment needed.'}
            </p>
            {actionError ? <p role="alert" className="mt-4 text-sm text-[#c53030]">{actionError}</p> : null}
            <button type="button" onClick={() => void start()} disabled={busy} className="mt-[22px] h-[68px] w-full cursor-pointer rounded-[16.8px] bg-[#3b69fc] text-[19.7px] font-bold text-white shadow-[0_8px_18px_rgba(59,105,252,0.30)] transition hover:bg-[#2f5bf0] disabled:opacity-60">
              {busy ? 'Opening…' : cta}
            </button>
          </div>
        </div>

        <section className="mt-[106px]">
          <h2 className="font-manrope text-[40px] font-bold leading-[62px] max-sm:text-3xl">Course Overview</h2>
          <p className="mt-3 text-lg font-medium leading-[25px] text-[#6d7797]">{c.description || c.tagline}</p>
          <div className="mt-[34px] grid gap-5 lg:grid-cols-[620px_1fr]">
            <div className="rounded-[21px] bg-[linear-gradient(135deg,#f3f5ff,#fbfcff)] p-9">
              <h3 className="font-manrope text-[28px] font-bold leading-[33px]">NanoSyllabus</h3>
              <dl className="mt-[45px] grid grid-cols-[199px_1fr] gap-y-[25px] text-lg font-medium max-sm:grid-cols-[140px_1fr]">
                <dt className="text-[#6d7797]">Course Fee</dt>
                <dd>{paid ? `NPR ${rupees(c.pricePaisa)}` : 'Free'}</dd>
                <dt className="text-[#6d7797]">Course Validity</dt>
                <dd>{paid ? ACCESS : 'Always open'}</dd>
                <dt className="text-[#6d7797]">Who Should Join?</dt>
                <dd>{c.level ? `${c.level} students` : 'Every learner'}</dd>
              </dl>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-[21px] border-[1.5px] border-[#edf0fa] bg-white px-7 py-5">
                  <span className="flex h-[32px] w-[32px] items-center justify-center rounded-[8.7px]" style={{ background: f.bg }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>{f.icon}</svg>
                  </span>
                  <h4 className="mt-[10px] text-base font-semibold leading-[22px]">{f.title}</h4>
                  <p className="mt-[7px] text-sm leading-[22px] text-[#6d7797]">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-[94px] flex flex-wrap items-start justify-between gap-8">
          <div className="min-w-0">
            <h2 className="font-manrope text-[40px] font-bold leading-[47px] max-sm:text-3xl">Why Choose NanoSyllabus?</h2>
            <ul className="mt-[28px] flex flex-wrap gap-y-4">
              {WHY.map(([t, d], i) => (
                <li key={t} className={'w-[230px] pr-4 ' + (i ? 'border-l border-[#d8dcea] pl-4' : '') + ' max-sm:w-1/2 max-sm:border-0 max-sm:pl-0'}>
                  <p className="text-base font-medium leading-5">{t}</p>
                  <p className="mt-2 text-sm leading-5 text-[#6d7797]">{d}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-[304px] pt-10 max-sm:pt-0">
            <button type="button" onClick={() => void start()} className="flex h-[45px] w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-[#0b1230] text-base font-medium text-white shadow-[0_6px_14px_rgba(11,18,48,0.25)] transition hover:bg-black">
              Begin Your Preparation Today
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M2 9h13M10 4l5 5-5 5" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <p className="mt-3 text-center text-[12.5px] text-[#6d7797]">Step closer to your goals with NanoSyllabus.</p>
          </div>
        </section>

        <section className="mt-[116px] grid gap-10 rounded-[24px] border border-[#e1e8f0] bg-white px-[48px] py-[48px] shadow-[0_8px_28px_rgba(16,24,40,0.04)] md:grid-cols-2 max-sm:px-6">
          <div>
            <p className="font-manrope text-sm font-bold tracking-[0.06em] text-[#3049ed]">CONTACTS</p>
            <ul className="mt-6 space-y-6 font-manrope text-lg text-[#1c1e1a]">
              <li className="flex items-center gap-4">{ico(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>)}<a href="mailto:contact@nanosyllabus.com">contact@nanosyllabus.com</a></li>
              <li className="flex items-center gap-4">{ico(<><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>)}Kathmandu, Nepal</li>
            </ul>
          </div>
          <div>
            <p className="font-manrope text-sm font-bold tracking-[0.06em] text-[#3049ed]">PAYMENT DETAILS</p>
            <ul className="mt-6 space-y-6 font-manrope text-lg text-[#1c1e1a]">
              <li className="flex items-center gap-4">{ico(<><path d="M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></>)}Pay by QR from any bank app, eSewa or Khalti</li>
              <li className="flex items-center gap-4">{ico(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /></>)}Fonepay also accepted</li>
              <li className="flex items-center gap-4">{ico(<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16v.5" /></>)}Once paid, non-refundable</li>
            </ul>
          </div>
        </section>

        <footer className="mt-[100px] flex flex-wrap items-center justify-between gap-4 border-t border-[#e5e8df] pb-[60px] pt-[33px]">
          <Link to="/" className="flex items-center gap-[10px]">
            <img src="/landing/mascot.png" width={38} height={38} alt="" />
            <span className="font-manrope text-[22px] font-extrabold tracking-[-0.05em] text-[#1c1e1a]">Nano Syllabus</span>
          </Link>
          <p className="font-manrope text-xs text-[#5b5e55]">Small challenges. Shared ambition.</p>
          <Link to={user ? '/app/topics' : '/signup'} className="flex items-center gap-2 font-manrope text-sm font-semibold text-[#1c1e1a]">
            Go to the app <Arrow size={13} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
