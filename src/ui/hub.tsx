// nano_sylabus's Micro-Topics Hub pieces (challenge-hub-frame.tsx,
// starter-challenge-banner.tsx), for the new app's lessons.

import { ArrowRight, BookOpen, FileText, Star } from 'lucide-react';

export const hubMainClass = 'min-h-full w-full bg-[var(--hub-bg)] text-text-primary';
export const hubContainerClass = 'mx-auto max-w-[1060px] px-4 sm:px-6 md:px-8 py-8 pb-24';
export const hubTitleClass = 'type-student-page-title mb-6 text-text-primary';
export const hubMetricsClass = 'mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4';
export const hubMetricCardClass = 'rounded-[20px] border border-[#e5e7eb] dark:border-border bg-white dark:bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]';
export const hubListCardClass = 'mt-6 rounded-[24px] border border-[#e5e7eb] dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]';
export const hubListHeaderClass = 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f1f3f5] dark:border-border/60';
export const hubRowsClass = 'divide-y divide-[#f1f3f5] dark:divide-border/50';
export const hubRowClass = 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 py-5 rounded-xl px-2 -mx-2 transition-colors hover:bg-bg-secondary/40';
export const blueButtonClass =
  'inline-flex min-h-9 shrink-0 items-center justify-center rounded-[10px] bg-[#2563eb] px-4 text-[14px] font-semibold text-white no-underline shadow-[0_1px_2px_rgba(37,99,235,0.2)] transition-colors hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60';

export function StarterBanner({ line, position = 1 }: { line: string; position?: number }) {
  return (
    <section className="relative mt-5 overflow-hidden rounded-[24px] border border-black/10 bg-[#cbf738] px-6 py-5 text-black shadow-sm sm:px-8 sm:py-6 lg:px-9 lg:py-6" aria-labelledby="starter-heading">
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-[460px] rounded-[100%] bg-gradient-to-tr from-[#e5ff75]/80 via-[#daf955]/60 to-transparent blur-md" aria-hidden="true" />
      <svg className="pointer-events-none absolute bottom-0 left-0 h-20 w-full opacity-35" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 120 C 200 60, 400 160, 600 100 S 1000 40, 1200 110 L1200 160 L0 160 Z" fill="#e5ff75" />
      </svg>
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <h2 id="starter-heading" className="whitespace-nowrap font-display text-[clamp(1rem,3.2vw,2.25rem)] font-semibold tracking-tight text-black">
            One topic. One small win.
          </h2>
          <div className="mt-2.5 max-w-md text-xs font-medium leading-relaxed text-black/80 sm:text-sm">
            <p className="truncate">{line}</p>
          </div>
        </div>
        <div className="relative hidden select-none items-center justify-end gap-5 lg:flex xl:gap-7" aria-hidden="true">
          <div className="relative shrink-0">
            <div className="absolute -bottom-1 -left-1 h-full w-full rotate-[-7deg] rounded-xl border-2 border-black bg-black/10" />
            <div className="absolute -bottom-0.5 -left-0.5 h-full w-full rotate-[-5deg] rounded-xl border-2 border-black bg-[#dcfb80]" />
            <div className="relative min-w-[110px] rotate-[-3deg] rounded-xl border-2 border-black bg-[#faffeb] px-4 py-3 shadow-[3px_3px_0_rgba(0,0,0,0.06)]">
              <div className="absolute -left-1 top-3.5 h-1.5 w-1 rounded-sm bg-black" />
              <div className="absolute -left-1 top-6.5 h-1.5 w-1 rounded-sm bg-black" />
              <div className="absolute -left-1 top-9.5 h-1.5 w-1 rounded-sm bg-black" />
              <div className="inline-flex items-center rounded-full border border-black/80 bg-black/[0.04] px-2 py-0.5 text-[10px] font-bold text-black">Topic {String(position).padStart(2, '0')}</div>
              <div className="mt-2.5 h-[2px] w-16 rounded-full bg-black" />
              <div className="mt-2 h-[2px] w-11 rounded-full bg-black/60" />
              <div className="mt-2 h-[2px] w-14 rounded-full bg-black/40" />
            </div>
          </div>
          <div className="flex items-center gap-2.5 xl:gap-3.5">
            {[
              { label: 'Learn', icon: <BookOpen className="size-5 stroke-[1.8] text-black" /> },
              { label: 'Practice', icon: <FileText className="size-5 stroke-[1.8] text-black" /> },
              { label: 'Take the exam', icon: <Star className="size-5 stroke-[1.8] text-black" /> },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-2.5 xl:gap-3.5">
                {i > 0 && <ArrowRight className="size-3.5 shrink-0 stroke-[2.2] text-black" />}
                <div className="flex flex-col items-center">
                  <div className="grid size-12 place-items-center rounded-full border-2 border-black bg-white/40 shadow-xs backdrop-blur-xs transition-transform hover:scale-105 sm:size-13">{s.icon}</div>
                  <span className="mt-1.5 whitespace-nowrap text-[11px] font-bold tracking-tight text-black sm:text-xs">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
