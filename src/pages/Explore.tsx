// /courses, "Explore Courses": the public page "Get Started" opens, before
// sign-in, where a visitor picks their program. Every program is a card, with search, the University / Level
// filters and a sort. Picking an open program (BEI) saves it on the account
// (PUT /api/me/program) and opens its semesters, via sign-up when signed
// out. After login nobody lands here: /app/topics opens their program. The rest say "Coming soon". Catalogue courses no
// program lists (the free taster) sit under "Free to try".
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LEVELS, UNIVERSITIES, linkedCourses, usePrograms, type Program } from '../data/curriculum';
import { api, useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';
import type { CourseCard, User } from '../lib/types';

const ChipIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
    <defs>
      <linearGradient id="ex-chip" x1="8" y1="8" x2="56" y2="56">
        <stop stopColor="#38a6ff" />
        <stop offset="1" stopColor="#7b5cff" />
      </linearGradient>
    </defs>
    <g stroke="url(#ex-chip)" strokeWidth="3.2" strokeLinecap="round">
      <rect x="16" y="16" width="32" height="32" rx="5" />
      <rect x="24" y="24" width="16" height="16" rx="2.5" />
      <path d="M24 16V6M32 16V6M40 16V6M24 58V48M32 58V48M40 58V48M16 24H6M16 32H6M16 40H6M58 24H48M58 32H48M58 40H48" />
    </g>
  </svg>
);
const CodeIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
    <defs>
      <linearGradient id="ex-code" x1="8" y1="10" x2="56" y2="54">
        <stop stopColor="#8ee86b" />
        <stop offset="1" stopColor="#24b37a" />
      </linearGradient>
    </defs>
    <g stroke="url(#ex-code)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="11" y="12" width="42" height="29" rx="4" />
      <path d="M5 49h54l-4 5H9zM27 21l-5 5.5 5 5.5M37 21l5 5.5-5 5.5" />
    </g>
  </svg>
);
const BookIcon = () => (
  <svg width="56" height="56" viewBox="0 0 64 64" fill="none" aria-hidden>
    <defs>
      <linearGradient id="ex-book" x1="8" y1="10" x2="56" y2="54">
        <stop stopColor="#ffb648" />
        <stop offset="1" stopColor="#ff6a3d" />
      </linearGradient>
    </defs>
    <path d="M8 14s6-4 13-4 11 4 11 4 4-4 11-4 13 4 13 4v38s-6-3-13-3-11 3-11 3-4-3-11-3-13 3-13 3zM32 14v38" stroke="url(#ex-book)" strokeWidth="3.2" strokeLinejoin="round" />
  </svg>
);

const Bank = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden className="shrink-0">
    <path d="M8 1.5 1.5 5v1.2h13V5zM2.5 7.2v5.3M5.5 7.2v5.3M10.5 7.2v5.3M13.5 7.2v5.3M1.5 14h13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const Radio = ({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) => (
  <label className="flex cursor-pointer items-center gap-4 py-[9px] text-base text-[#2a2f2c] dark:text-[#d9d9d9]">
    <input type="radio" name={name} checked={checked} onChange={onChange} className="peer sr-only" />
    <span className="flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#b9bec3] transition peer-checked:border-[#3b82f6] peer-focus-visible:ring-2 peer-focus-visible:ring-[#3b82f6]/50 dark:border-[#4a4a4a]">
      <span className={'h-[13px] w-[13px] rounded-full bg-[#3b82f6] transition ' + (checked ? 'scale-100' : 'scale-0')} />
    </span>
    {children}
  </label>
);

function Card({ title, subtitle, place, chips, icon, to, soon, onPick }: { title: string; subtitle: string; place: string; chips: string[]; icon: React.ReactNode; to?: string; soon?: boolean; onPick?: () => void }) {
  const inner = (
    <>
      <span className="flex h-[98px] w-[98px] shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(145deg,#f4f6fb,#eceff6)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-[linear-gradient(145deg,#1d1f24,#141518)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] max-sm:h-[72px] max-sm:w-[72px] [&_svg]:max-sm:h-12 [&_svg]:max-sm:w-12">
        {icon}
      </span>
      <span className="min-w-0 flex-1 pr-10">
        <span className="block text-[22px] font-semibold leading-7 text-[#0f1713] dark:text-white">{title}</span>
        <span className="mt-[6px] block text-base leading-6 text-[#3f4643] dark:text-[#d4d4d4]">{subtitle}</span>
        <span className="mt-[10px] flex items-center gap-2 text-sm text-[#6d7470] dark:text-[#a3a3a3]">
          <Bank />
          {place}
        </span>
        <span className="mt-[14px] flex flex-wrap items-center gap-[6px]">
          {chips.map((c, i) => (
            <span key={c} className="flex items-center gap-[6px]">
              {i ? <span className="h-1 w-1 rounded-full bg-[#9aa09d] dark:bg-[#6b6b6b]" /> : null}
              <span className="flex h-8 items-center rounded-[9px] bg-[#f1f2f5] px-[13px] text-sm text-[#2a2f2c] dark:bg-[#232323] dark:text-[#e5e5e5]">{c}</span>
            </span>
          ))}
        </span>
      </span>
      {soon ? (
        <span className="absolute right-5 top-5 rounded-full border border-[#e4e6eb] bg-[#f6f7f9] px-3 py-1 text-xs font-semibold text-[#6d7470] dark:border-[#2c2c2c] dark:bg-[#1c1c1c] dark:text-[#a3a3a3]">Coming soon</span>
      ) : (
        <span className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f2f5] text-[#18251e] transition group-hover:bg-[#3b82f6] group-hover:text-white dark:bg-[#1f1f1f] dark:text-white">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M3 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      )}
    </>
  );
  const cls = 'group relative flex items-center gap-7 rounded-[22px] border border-[#e6e8ee] bg-white px-7 py-7 transition dark:border-[#242424] dark:bg-[#111111] max-sm:gap-4 max-sm:px-4 max-sm:py-5 ';
  if (soon || !to) return <div className={cls + 'opacity-60'} aria-label={`${title}: coming soon`}>{inner}</div>;
  return (
    <Link to={to} onClick={onPick} className={cls + 'hover:border-[#c9d6f5] hover:shadow-[0_10px_30px_rgba(59,130,246,0.10)] dark:hover:border-[#2f3b55]'}>
      {inner}
    </Link>
  );
}

const placeOf = (p: Program) => (p.university === 'IOE' ? 'IOE, Tribhuvan University' : p.university);

export default function Explore() {
  useSeo({ title: `Explore courses · ${SITE}`, description: 'Pick your program and study it semester by semester with short interactive video lessons.', path: '/courses' });
  const { user, setUser } = useAuth();
  const PROGRAMS = usePrograms();
  // Save the pick on the account; the card's link has already moved on.
  const pick = (slug: string) => {
    if (user) setUser({ ...user, program: slug });
    api<{ user: User }>('/api/me/program', { method: 'PUT', body: { program: slug } })
      .then((r) => setUser(r.user))
      .catch(() => {});
  };
  const { data } = useQuery<{ courses: CourseCard[] }>('courses', '/api/courses');
  const [q, setQ] = useState('');
  const [uni, setUni] = useState<string | null>('IOE');
  const [level, setLevel] = useState<string | null>('Bachelor');
  const [applied, setApplied] = useState<{ uni: string | null; level: string | null }>({ uni: 'IOE', level: 'Bachelor' });
  const [sort, setSort] = useState<'popular' | 'name'>('popular');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const programs = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = PROGRAMS.filter(
      (p) =>
        (!applied.uni || p.university === applied.uni) &&
        (!applied.level || p.level === applied.level) &&
        (!term || `${p.short} ${p.name} ${p.university}`.toLowerCase().includes(term)),
    );
    return list.sort((a, b) => (sort === 'name' ? a.short.localeCompare(b.short) : Number(!!a.soon) - Number(!!b.soon)));
  }, [q, applied, sort, PROGRAMS]);

  // Catalogue courses no program lists, e.g. the free taster.
  const extra = useMemo(() => {
    const linked = new Set(PROGRAMS.flatMap(linkedCourses));
    const term = q.trim().toLowerCase();
    return (data?.courses ?? []).filter((c) => !linked.has(c.slug) && (!term || `${c.title} ${c.tagline}`.toLowerCase().includes(term)));
  }, [data, q, PROGRAMS]);

  const reset = () => {
    setUni(null);
    setLevel(null);
    setApplied({ uni: null, level: null });
  };

  return (
    <div className="relative isolate">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-40 -z-10 hidden h-[520px] w-[520px] rounded-full bg-[#1d3a8a]/25 blur-[120px] dark:block" />
      <div className="mx-auto w-[min(1384px,100%-32px)] pb-24 pt-[72px] max-sm:pt-8">
        <h1 className="text-[48px] font-semibold leading-[1.1] tracking-[-0.02em] max-sm:text-[34px]">
          <span className="text-[#0f1713] dark:text-white">Explore</span> <span className="text-[#9a9fa3] dark:text-[#a3a3a3]">Courses</span>
        </h1>

        <label className="mt-6 flex h-[66px] items-center gap-4 rounded-full border border-[#dfe2e7] bg-white px-6 focus-within:border-[#3b82f6] dark:border-[#2a2a2a] dark:bg-[#0f0f0f] max-sm:h-14 max-sm:px-4">
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden className="shrink-0 text-[#6d7470] dark:text-[#bdbdbd] max-sm:h-6 max-sm:w-6">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={search}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for courses..."
            aria-label="Search for courses"
            className="min-w-0 flex-1 bg-transparent text-base text-[#0f1713] outline-none placeholder:text-[#8a908d] dark:text-white dark:placeholder:text-[#8a8a8a]"
          />
          <kbd className="flex h-9 items-center rounded-full bg-[#f1f2f5] px-4 font-sans text-sm text-[#3f4643] dark:bg-[#1f1f1f] dark:text-[#d4d4d4] max-sm:hidden">{mac ? '⌘ K' : 'Ctrl K'}</kbd>
        </label>

        <div className="mt-10 grid items-start gap-9 lg:grid-cols-[300px_1fr] max-sm:mt-6">
          <aside className="rounded-[22px] border border-[#e6e8ee] bg-white p-5 dark:border-[#242424] dark:bg-[#111111] lg:sticky lg:top-[84px]">
            <div className="flex items-center justify-between lg:hidden">
              <button type="button" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen} className="flex cursor-pointer items-center gap-2 font-semibold text-[#0f1713] dark:text-white">
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M2 3h14l-5.5 6.5V15l-3-1.5v-4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                Filters
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className={'transition ' + (filtersOpen ? 'rotate-180' : '')}><path d="m3 5 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              </button>
              <span className="text-sm text-[#6d7470] dark:text-[#a3a3a3]">{[applied.uni, applied.level].filter(Boolean).join(' · ') || 'All'}</span>
            </div>
            <div className={(filtersOpen ? 'mt-5 block' : 'hidden') + ' lg:mt-0 lg:block'}>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-lg font-semibold text-[#0f1713] dark:text-white">
                  <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden><path d="M8 1.5 1.5 5v1.2h13V5zM2.5 7.2v5.3M5.5 7.2v5.3M10.5 7.2v5.3M13.5 7.2v5.3M1.5 14h13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                  University
                </h2>
                <button type="button" onClick={reset} className="flex cursor-pointer items-center gap-2 text-[15px] text-[#3f4643] hover:text-[#0f1713] dark:text-[#bdbdbd] dark:hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M13.5 8A5.5 5.5 0 1 1 11.8 4M12.5 1.5V4.5H9.5" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Reset
                </button>
              </div>
              <div className="mt-3">
                {UNIVERSITIES.map((u) => (
                  <Radio key={u} name="university" checked={uni === u} onChange={() => setUni(u)}>{u}</Radio>
                ))}
              </div>
              <hr className="my-4 border-[#eceef1] dark:border-[#242424]" />
              <h2 className="flex items-center gap-3 text-lg font-semibold text-[#0f1713] dark:text-white">
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden><path d="M3 17V11h3v6zM8.5 17V7h3v10zM14 17V3h3v14z" fill="currentColor" /></svg>
                Level
              </h2>
              <div className="mt-3">
                {LEVELS.map((l) => (
                  <Radio key={l.id} name="level" checked={level === l.id} onChange={() => setLevel(l.id)}>{l.label}</Radio>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setApplied({ uni, level });
                  setFiltersOpen(false);
                }}
                className="mt-6 flex h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-[#3b82f6] text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#3b82f6]/10 dark:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden><path d="M2 3h14l-5.5 6.5V15l-3-1.5v-4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                Apply Filters
              </button>
            </div>
          </aside>

          <section aria-live="polite">
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg font-medium text-[#0f1713] dark:text-white">
                {programs.length} {programs.length === 1 ? 'Course' : 'Courses'} found
              </p>
              <label className="relative">
                <span className="sr-only">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as 'popular' | 'name')}
                  className="h-[42px] cursor-pointer appearance-none rounded-full border border-[#dfe2e7] bg-white pl-6 pr-11 text-[15px] text-[#0f1713] outline-none focus:border-[#3b82f6] dark:border-[#2a2a2a] dark:bg-[#0f0f0f] dark:text-white"
                >
                  <option value="popular">Popular</option>
                  <option value="name">Name A–Z</option>
                </select>
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#3f4643] dark:text-white"><path d="m3 5 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              </label>
            </div>

            {programs.length ? (
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                {programs.map((p) => (
                  <Card
                    key={p.slug}
                    title={p.short}
                    subtitle={p.name}
                    place={placeOf(p)}
                    chips={[p.level, `${p.years} Years`]}
                    icon={p.icon === 'chip' ? <ChipIcon /> : <CodeIcon />}
                    to={p.soon ? undefined : user ? `/app/topics/${p.slug}` : `/signup?next=${encodeURIComponent(`/app/topics/${p.slug}`)}`}
                    soon={p.soon}
                    onPick={p.soon || !user ? undefined : () => pick(p.slug)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[22px] border border-dashed border-[#d6dad8] px-6 py-14 text-center dark:border-[#2c2c2c]">
                <p className="text-lg font-semibold text-[#0f1713] dark:text-white">Coming soon</p>
                <p className="mt-2 text-sm text-[#6d7470] dark:text-[#a3a3a3]">We're starting with IOE Bachelor programs. Others are on the way.</p>
              </div>
            )}

            {extra.length ? (
              <>
                <h2 className="mt-14 text-lg font-medium text-[#0f1713] dark:text-white">Free to try</h2>
                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  {extra.map((c) => (
                    <Card
                      key={c.slug}
                      title={c.title}
                      subtitle={c.tagline}
                      place={c.level || SITE}
                      chips={[c.pricePaisa ? 'Paid' : 'Free', `${c.lessonCount} ${c.lessonCount === 1 ? 'lesson' : 'lessons'}`]}
                      icon={<BookIcon />}
                      to={`/courses/${c.slug}`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
