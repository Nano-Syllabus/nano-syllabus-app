// /app/checkout/:slug, the Figma payment steps (160:4983 → 160:5053 →
// 160:5111): "Two steps to start learning" with the step rail on the left;
// on the right a card that shows the company QR (scan and pay, copy the
// amount and remark), then takes the payment screenshot (here or from a
// phone), then waits for an admin to approve it and congratulates.
// No one reads the screenshot automatically: an admin checks it at
// /app/admin and approving enrolls the learner (server: httpapi/manual.go).
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import qrcode from 'qrcode-generator';
import { api, invalidate, prefetch, useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { config } from '../lib/config';
import { SITE, useSeo } from '../lib/seo';
import type { CourseDetail } from '../lib/types';
import { BrandCorner, PayBackdrop, rupees } from './Premium';

type Manual = { id: number; status: 'pending' | 'approved' | 'rejected'; note: string; amountPaisa: number; remark: string; createdAt: string };
type Status = { remark: string; payment: Manual | null };

const arrow = (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden><path d="M3 11h15M12 5l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

function Rail({ step }: { step: 1 | 2 | 3 }) {
  const dot = (n: 1 | 2, active: boolean, done: boolean) =>
    active ? (
      <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#c5c9f5]">
        <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#6b8dff,#e0a8f5)] text-xl font-semibold text-[#0e193b] shadow-[0_2px_7px_rgba(69,109,255,0.3)]">{n}</span>
      </span>
    ) : (
      <span className={'mx-1 flex h-[46px] w-[46px] items-center justify-center rounded-full text-xl font-semibold ' + (done ? 'bg-[#e6ebff] text-[#456dff]' : 'bg-[#f7effc] text-[#456dff] dark:bg-white/10')}>
        {done ? <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="m3.5 9.5 3.5 3.5 7.5-8" fill="none" stroke="#456dff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : n}
      </span>
    );
  const label = (text: string, on: boolean) => <span className={'text-base font-medium ' + (on ? 'text-[#16171b] dark:text-white' : 'text-[#858588]')}>{text}</span>;
  return (
    <ol className="relative mt-[44px] space-y-[32px]" aria-label="Payment steps">
      <span aria-hidden className="absolute left-[25px] top-[40px] h-[158px] w-[3px] rounded bg-[linear-gradient(180deg,#8ea4ff,#cfe9f1)]" />
      <li className="relative flex items-center gap-[13px]" aria-current={step === 1 ? 'step' : undefined}>{dot(1, step === 1, step > 1)}{label('Complete payment', step === 1)}</li>
      <li className="relative flex items-center gap-[17px]" aria-current={step === 2 ? 'step' : undefined}>{dot(2, step === 2, step > 2)}{label('Payment screenshot', step === 2)}</li>
      <li className="relative flex items-center gap-[17px]" aria-current={step === 3 ? 'step' : undefined}>
        <span className={'mx-1 flex h-[46px] w-[46px] items-center justify-center rounded-full ' + (step === 3 ? 'bg-[linear-gradient(135deg,#6b8dff,#e0a8f5)]' : 'bg-[#f6f0fc] dark:bg-white/10')}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="m3.5 9.5 3.5 3.5 7.5-8" fill="none" stroke={step === 3 ? '#fff' : '#456dff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        {label('Access activates', step === 3)}
      </li>
    </ol>
  );
}

function CopyRow({ text, copy }: { text: string; copy: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex h-12 items-center justify-between gap-2 rounded-[10px] border border-[#eeeef2] bg-white pl-[13px] pr-[9px] dark:border-white/10 dark:bg-[#1c1c1f]">
      <span className="truncate text-sm font-semibold text-[#16171b] dark:text-white">{text}</span>
      <button
        type="button"
        onClick={() => { void navigator.clipboard?.writeText(copy).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }); }}
        className="flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-[7.6px] border border-[#eeeef2] bg-[#fafafc] px-2 text-sm font-semibold text-[#16171b] dark:border-white/10 dark:bg-white/10 dark:text-white"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><rect x="3" y="3" width="6" height="6" rx="1" fill="none" stroke="currentColor" /><path d="M1 7V1h6" fill="none" stroke="currentColor" /></svg>
        {done ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function PhoneQR({ url }: { url: string }) {
  const svg = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(url);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }, [url]);
  return <span className="block h-[124px] w-[124px] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Shrink a photo to at most 1600px and JPEG, so phone screenshots upload fast. */
async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => bad(new Error("That file isn't an image we can read. Try a PNG or JPG screenshot."));
      i.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const navyBtn = 'flex h-[51px] cursor-pointer items-center justify-center gap-[13px] rounded-[13px] bg-[#103d83] text-base font-semibold text-white transition hover:bg-[#164b9e] disabled:cursor-default disabled:opacity-60';

export default function Checkout() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: c, error } = useQuery<CourseDetail>(`course:${slug}`, `/api/courses/${encodeURIComponent(slug)}`);
  const [status, setStatus] = useState<Status | null>(null);
  const [shot, setShot] = useState<{ name: string; data: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  useSeo({ title: `Payment · ${c?.title ?? 'Course'} · ${SITE}`, noindex: true });

  const load = () =>
    api<Status>(`/api/payments/manual?course=${encodeURIComponent(slug)}`).then(setStatus).catch((e: Error) => setErr(e.message));
  useEffect(() => { void load(); }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const pay = status?.payment;
  // While an admin hasn't looked yet, check back every 20 seconds.
  useEffect(() => {
    if (pay?.status !== 'pending') return;
    const t = setInterval(() => void load(), 20000);
    return () => clearInterval(t);
  }, [pay?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pay?.status !== 'approved') return;
    invalidate(`course:${slug}`, 'courses', 'home');
    void prefetch(`course:${slug}`, `/api/courses/${encodeURIComponent(slug)}`).catch(() => {});
  }, [pay?.status, slug]);

  if (error) return <Navigate to="/app/topics" replace />;
  if (c && c.pricePaisa === 0) return <Navigate to="/app/topics" replace />;
  if (c && user?.role === 'admin' && !pay) return <Navigate to={`/app/premium/${slug}`} replace />;

  const approved = pay?.status === 'approved' || Boolean(c?.owned);
  const pending = pay?.status === 'pending';
  const step: 1 | 2 | 3 = approved || pending ? 3 : params.get('step') === '2' ? 2 : 1;
  const amount = c ? `NPR ${rupees(c.pricePaisa)}` : '…';
  const remark = status?.remark ?? '…';
  const startHref = config.appCourses[slug] ? `/app/courses/${slug}/learn` : '/app/topics';

  async function choose(f: File | undefined) {
    if (!f) return;
    setErr('');
    try {
      setShot({ name: f.name, data: await compress(f) });
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  async function submit() {
    if (!shot) return setErr('Choose the screenshot of your payment first.');
    setBusy(true);
    setErr('');
    try {
      const p = await api<Manual>('/api/payments/manual', { method: 'POST', body: { course: slug, image: shot.data } });
      setStatus((s) => ({ remark: s?.remark ?? remark, payment: p }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  let body: ReactNode;
  if (step === 1) {
    body = (
      <>
        <h3 className="mt-[25px] text-xl font-semibold leading-7">Payment method</h3>
        <div className="mt-[15px] flex h-[57px] items-center rounded-[15px] bg-[#103d83] px-[39px] text-white max-sm:px-4">
          <span className="text-base font-semibold">Mobile Banking</span>
          <span className="mx-[40px] h-8 w-px bg-[#d2d2d2] max-sm:mx-3" />
          <span className="flex items-center gap-[9px]" aria-label="Any bank app, eSewa, Khalti and more">
            <span className="flex h-[22px] w-[27px] items-center justify-center rounded-[5px] bg-[#0d335d]">
              <svg width="15" height="14" viewBox="0 0 15 14" aria-hidden><path d="M7.5 1 1 4h13zM2.5 5.5v5M5.5 5.5v5M9.5 5.5v5M12.5 5.5v5M1 12.5h13" fill="none" stroke="#fff" strokeWidth="1.2" /></svg>
            </span>
            <span className="flex h-[22px] w-[27px] items-center justify-center rounded-[5px] bg-[#38c85f] text-sm font-semibold">e</span>
            <span className="flex h-[22px] w-[27px] items-center justify-center rounded-[5px] bg-[#8c3fe8] text-sm font-semibold">K</span>
            <span className="flex h-[22px] w-[27px] items-center justify-center rounded-[5px] border border-[#d9d9d9] text-sm font-semibold">+</span>
          </span>
        </div>
        <div className="mt-[26px] flex gap-[11px] rounded-[20px] border border-[#eeeef2] bg-[#fafafc] p-[17px] shadow-[0_4px_28px_rgba(16,61,131,0.05)] dark:border-white/10 dark:bg-white/[0.04] max-sm:flex-col max-sm:items-center">
          <img src="/app/pay-qr.webp" width={175} height={229} alt="Nano Syllabus Pvt Ltd payment QR, Machhapuchchhre Bank, account 1790994692300010" className="h-[229px] w-[175px] shrink-0 rounded-[4.4px]" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-[11px] self-stretch max-sm:w-full">
            <h4 className="text-xl font-semibold leading-7 text-[#16171b] dark:text-white">Scan and pay</h4>
            <CopyRow text={`Amount - ${amount}`} copy={c ? String(c.pricePaisa / 100) : ''} />
            <CopyRow text={`Remark - ${remark}`} copy={remark} />
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#69738e] dark:text-[#a6a6af]">Write the remark exactly as shown so we can match your payment.</p>
        <button type="button" className={navyBtn + ' mt-[16px] w-full'} onClick={() => setParams({ step: '2' })}>
          Payment complete {arrow}
        </button>
      </>
    );
  } else if (step === 2) {
    body = (
      <>
        <h3 className="mt-[28px] text-xl font-semibold leading-7">Payment Screenshot</h3>
        {pay?.status === 'rejected' ? (
          <p className="mt-3 rounded-[10px] border border-[#f3c4c4] bg-[#fff6f6] px-3 py-2 text-sm text-[#9b2c2c]">Your last screenshot was sent back: {pay.note}</p>
        ) : null}
        <div className="mt-[22px] grid grid-cols-[1fr_199px] gap-[17px] max-sm:grid-cols-1">
          <label
            className="flex h-[262px] cursor-pointer flex-col items-center justify-center rounded-[20px] border-[1.6px] border-[#e5e5ec] bg-[#fafafc] p-3 text-center transition hover:border-[#8c6bff] dark:border-white/15 dark:bg-white/[0.04]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); void choose(e.dataTransfer.files[0]); }}
          >
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => void choose(e.target.files?.[0])} />
            {shot ? (
              <>
                <img src={shot.data} alt="Your payment screenshot" className="max-h-[170px] max-w-full rounded-lg object-contain shadow" />
                <span className="mt-3 max-w-full truncate text-xs text-[#69738e]">{shot.name}</span>
                <span className="mt-1 text-sm font-semibold text-[#6e3cf5]">Choose another</span>
              </>
            ) : (
              <>
                <span className="flex h-[48px] w-[48px] items-center justify-center rounded-[14px] bg-[#efe9ff] text-[#7a4dff]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></svg>
                </span>
                <span className="mt-[22px] text-sm font-semibold text-[#16171b] dark:text-white">Upload screenshot</span>
                <span className="mt-[9px] rounded-[7px] bg-[#7a39f5] px-[10px] py-[5px] text-sm font-semibold text-white">Choose file</span>
              </>
            )}
          </label>
          <div className="flex h-[262px] flex-col items-center justify-center rounded-[20px] border-[1.6px] border-[#e5e5ec] bg-white dark:border-white/15 dark:bg-[#1c1c1f] max-sm:hidden">
            <span className="rounded-[10px] border border-[#eeeef2] bg-white p-[13px]">
              <PhoneQR url={`${window.location.origin}/app/checkout/${encodeURIComponent(slug)}?step=2`} />
            </span>
            <span className="mt-[20px] text-sm font-semibold text-[#16171b] dark:text-white">Scan with phone</span>
          </div>
        </div>
        <p className="mt-[29px] flex items-center gap-2 rounded-[10px] border border-[#e7e8ee] bg-white px-[14px] py-[13px] text-sm text-[#69738e] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#a6a6af]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          We check every payment and turn on access, usually within a few hours.
        </p>
        {err ? <p role="alert" className="mt-3 text-sm text-[#c53030]">{err}</p> : null}
        <div className="mt-[29px] flex gap-[21px]">
          <button type="button" onClick={() => setParams({})} className="flex h-[51px] w-[117px] cursor-pointer items-center justify-center gap-2 rounded-[13px] border border-[#e5e5ec] bg-white text-base font-semibold text-[#16171b] transition hover:bg-[#f6f6fa] dark:border-white/15 dark:bg-transparent dark:text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M14 8H2M7 3 2 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Back
          </button>
          <button type="button" className={navyBtn + ' flex-1'} disabled={busy} onClick={() => void submit()}>
            {busy ? 'Sending...' : 'Submit screenshot'} {busy ? null : arrow}
          </button>
        </div>
      </>
    );
  } else if (approved) {
    body = (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center pt-[60px] text-center">
          <img src="/app/trophy.webp" width={272} height={180} alt="" className="h-auto w-[272px]" />
          <h3 className="mt-[50px] text-2xl font-semibold text-[#0e193b] dark:text-white">Congratulations!</h3>
          <p className="mt-[12px] text-base text-[#69738e] dark:text-[#a6a6af]">Your subject access is now active.</p>
        </div>
        <button type="button" className={navyBtn + ' mt-[76px] w-full'} onClick={() => navigate(startHref)}>
          Start learning {arrow}
        </button>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center pt-[60px] text-center">
          <span className="flex h-[150px] w-[150px] items-center justify-center rounded-full bg-[#eef1ff] dark:bg-white/10">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#456dff" strokeWidth="1.6" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
          </span>
          <h3 className="mt-[44px] text-2xl font-semibold text-[#0e193b] dark:text-white">Screenshot received</h3>
          <p className="mt-[12px] max-w-[360px] text-base text-[#69738e] dark:text-[#a6a6af]">We're checking your payment. Your access turns on as soon as it's confirmed; this page updates by itself.</p>
        </div>
        <Link to="/app/topics" className={navyBtn + ' mt-[76px] w-full'}>
          Back to topics {arrow}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-[100dvh] overflow-x-hidden px-4 pb-20 text-[#0e193b] dark:text-white">
      <PayBackdrop />
      <BrandCorner />
      <div className="mx-auto flex max-w-[1068px] items-start justify-between gap-12 pt-[111px] max-lg:flex-col max-lg:items-center max-lg:pt-24">
        <aside className="mt-[43px] w-[404px] max-lg:mt-0 max-lg:w-full max-lg:max-w-[545px]">
          <img src="/app/pay-art.webp" width={299} height={164} alt="" className="h-auto w-[299px] max-lg:hidden" />
          <h1 className="mt-[14px] font-serif text-[56px] leading-[64px] max-lg:text-[38px] max-lg:leading-[46px]">
            Two steps to
            <br />
            start learning
          </h1>
          <div className="max-lg:hidden"><Rail step={step} /></div>
        </aside>
        <section className="flex min-h-[658px] w-[545px] max-w-full flex-col rounded-[25.6px] border-[0.8px] border-[#e7e8ff] bg-white px-[36px] pb-[49px] pt-[43px] shadow-[0_16px_64px_rgba(69,80,160,0.10)] dark:border-white/10 dark:bg-[#17171a] max-sm:min-h-0 max-sm:px-5 max-sm:pt-7">
          <div className="flex items-baseline justify-between gap-4 text-[32px] font-semibold leading-10 max-sm:text-2xl">
            <h2 className="min-w-0 [overflow-wrap:anywhere]">{c?.title ?? ' '}</h2>
            <span className="shrink-0">{amount}</span>
          </div>
          <span aria-hidden className="mt-[17px] block h-1 rounded bg-[linear-gradient(90deg,#6b9bff,#e09cf0_50%,#43c46b)]" />
          {body}
        </section>
      </div>
    </div>
  );
}
