/**
 * live.nanosyllabus.com's landing page, built from the Figma redesign
 * (file 5D1OeHdCb2HU4uefNHKs73, frame 160:6464 "Landing page"). Pre-rendered
 * to dist/landing-live.html by scripts/prerender-landing.mjs. Styles are in
 * live-landing.css (plain CSS, measurements from the frame, 1520 wide).
 * nanosyllabus.com keeps the waitlist page (MainLandingView).
 */
import type React from 'react';

const DEMO_LESSON = '/courses/dc-motor-taster';
const START = '/signup';

const Arrow = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M4.5 13.5 13.5 4.5M6 4.5h7.5V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Btn({ href, children, tone = 'blue', className = '' }: { href: string; children: React.ReactNode; tone?: 'blue' | 'dark'; className?: string }) {
  return (
    <a href={href} className={`ll-btn ll-btn-${tone} ${className}`}>
      <span>{children}</span>
      <Arrow />
    </a>
  );
}

const icons = {
  target: (
    <svg width="31" height="31" viewBox="0 0 31 31" fill="none" aria-hidden="true">
      <g stroke="#000" strokeOpacity=".7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="15.5" cy="15.51" r="4.56" />
        <circle cx="15.5" cy="15.51" r="11.07" />
        <path d="M29.17 15.5h-5.36M7.13 15.5H1.76M15.5 1.76V7.1M15.5 23.88v5.36" />
      </g>
    </svg>
  ),
  bulb: (
    <svg width="23" height="23" viewBox="0 0 23 23" fill="none" aria-hidden="true">
      <path fill="#172019" d="M2.875 8.625a8.625 8.625 0 1 1 14.625 6.196c-.292.282-.516.575-.651.89l-1.095 2.542a.719.719 0 0 1-.66.434.719.719 0 0 1 0 1.438.719.719 0 0 1 0 1.437l-.322.643a1.437 1.437 0 0 1-1.285.795H9.513a1.437 1.437 0 0 1-1.285-.795l-.322-.643a.719.719 0 0 1 0-1.437.719.719 0 0 1 0-1.438.719.719 0 0 1-.661-.434l-1.094-2.544a2.962 2.962 0 0 0-.651-.888 8.597 8.597 0 0 1-2.625-6.196ZM11.5 1.438a7.187 7.187 0 0 0-5 12.35c.378.366.739.812.972 1.353l.91 2.109h6.24l.909-2.109c.233-.541.594-.987.972-1.352A7.188 7.188 0 0 0 11.5 1.437Z" />
    </svg>
  ),
  compass: (
    <svg width="24" height="25" viewBox="0 0 24 25" fill="none" aria-hidden="true">
      <path fill="#172019" d="M12 1.563C6.202 1.563 1.5 6.46 1.5 12.5S6.202 23.438 12 23.438 22.5 18.54 22.5 12.5 17.798 1.563 12 1.563Zm0 20.02c-4.814 0-8.719-4.068-8.719-9.083S7.186 3.418 12 3.418s8.719 4.067 8.719 9.082-3.905 9.082-8.719 9.082Zm4.65-14.359a.737.737 0 0 0-.574.012L9.724 10.132l-2.777 6.616a.84.84 0 0 0 0 .627.75.75 0 0 0 .689.469.71.71 0 0 0 .3-.066l6.351-2.896 2.778-6.616a.83.83 0 0 0-.415-1.042Zm-3.131 5.823.614.64-.994 1.035-.614-.64-3.619 1.65 1.582-3.77-.597-.625.993-1.035.598.623 3.621-1.648-1.584 3.77Z" />
    </svg>
  ),
  refresh: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="#172019" d="M19.07 4.93A9.97 9.97 0 0 0 8.1 2.79a10.02 10.02 0 0 0-6.11 9.21h2a7.94 7.94 0 0 1 4.89-7.36 8.05 8.05 0 0 1 6.23 0 7.96 7.96 0 0 1 3.02 2.24L16 9.01h6V3l-2.45 2.45c-.15-.18-.31-.36-.48-.52Zm.3 10.18a7.96 7.96 0 0 1-10.49 4.25 7.96 7.96 0 0 1-3.02-2.24L7.99 14.99H2v6l2.45-2.45c.15.18.31.36.48.52A9.97 9.97 0 0 0 12 21.99a9.99 9.99 0 0 0 10-10h-2c0 1.08-.21 2.13-.63 3.11Z" />
    </svg>
  ),
  book: (
    <svg width="40" height="33" viewBox="0 0 40 33" fill="none" aria-hidden="true">
      <path d="M20 30.91s2.73-1.82 9.09-1.82 9.09 1.82 9.09 1.82V5.45s-2.73-3.63-9.09-3.63S20 5.45 20 5.45s-2.73-3.63-9.09-3.63-9.09 3.63-9.09 3.63v25.46s2.73-1.82 9.09-1.82S20 30.91 20 30.91Zm0-25.46v25.46" stroke="#000" strokeWidth="3.64" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const audiences = [
  { icon: icons.target, title: 'Students aiming for higher marks', text: 'See which topics cost you marks and spend your time there.', font: 'manrope' },
  { icon: icons.bulb, title: 'Students of difficult science subjects', text: 'Hard concepts explained step by step, then practised straight away.', font: 'inter' },
  { icon: icons.compass, title: 'Students preparing independently', text: 'No tutor? A clear path through your syllabus replaces guesswork.', font: 'manrope' },
  { icon: icons.refresh, title: 'Students who struggle with revision', text: 'Short lessons and visible progress make revision manageable', font: 'inter' },
];

const courses = [
  { name: 'Bsc.CSIT', bg: '#eaf3d9' },
  { name: 'BEI', bg: '#e8eaf8' },
  { name: 'BCT', bg: '#f6ebd7' },
];

const rows: [string, string, string][] = [
  ['Clear explanation', 'Yes', 'Rarely'],
  ['You take part while learning', 'No', 'No'],
  ['Instant feedback on your answers', 'No', 'No'],
  ['Focused on your exam', 'Sometimes', 'Yes'],
  ["Shows what you still don't know", 'No', 'No'],
];

const faqs = [
  { q: 'What is NanoSyllabus?', a: 'Interactive video lessons built from your syllabus. You answer as you learn and see what you still need to work on.' },
  { q: 'How is it different from YouTube lectures or my notes?', a: 'Lectures and notes are one-way. NanoSyllabus asks, checks and shows your gaps.' },
  { q: 'Why not just use ChatGPT?', a: "It doesn't know your syllabus or track what you've covered, and it won't tell you if you're not ready. NanoSyllabus follows your course topic by topic and measures what you actually know." },
  { q: 'Can it replace my classes or teacher?', a: 'No. It works alongside them for understanding, practice and revision.' },
];

/* The player controls drawn over the poster, as in the frame. */
const ctl = (d: React.ReactNode, w = 26) => (
  <svg width="25" height="25" viewBox={`0 0 ${w} ${w}`} fill="none" aria-hidden="true">{d}</svg>
);
const S = { stroke: '#fff', strokeOpacity: 0.9, strokeWidth: 1.625, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const controls = [
  ctl(<><path {...S} d="M21.93 7.82v10.37c0 2.12-2.31 3.46-4.15 2.39l-4.5-2.59-4.5-2.6c-1.84-1.06-1.84-3.71 0-4.77l4.5-2.6 4.5-2.59c1.84-1.06 4.15.26 4.15 2.39Z" /><path {...S} d="M4.07 19.7V6.3" /></>),
  ctl(<><path {...S} d="M4.07 7.82v10.37c0 2.12 2.31 3.46 4.15 2.39l4.5-2.59 4.5-2.6c1.84-1.06 1.84-3.71 0-4.77l-4.5-2.6-4.5-2.59C6.38 4.37 4.07 5.69 4.07 7.82Z" /><path {...S} d="M21.93 19.7V6.3" /></>),
  'sep',
  ctl(<path fill="#fff" fillOpacity=".9" d="M19.094 16.86c-.724 0-1.392.253-1.915.677l-5.26-3.806a3.85 3.85 0 0 0 0-1.462l5.26-3.806a3.047 3.047 0 1 0-1.013-1.524l-4.997 3.618a4.063 4.063 0 1 0 0 4.885l4.997 3.618a3.047 3.047 0 1 0 2.928-2.2Zm0-12.087a1.32 1.32 0 1 1 0 2.64 1.32 1.32 0 0 1 0-2.64ZM7.922 15.234a2.234 2.234 0 1 1 0-4.468 2.234 2.234 0 0 1 0 4.468Zm11.172 5.993a1.32 1.32 0 1 1 0-2.64 1.32 1.32 0 0 1 0 2.64Z" />),
  ctl(<><path {...S} strokeLinecap="butt" strokeLinejoin="miter" d="M2.17 10.83v4.34c0 2.16 1.08 3.25 3.25 3.25h1.55c.4 0 .8.12 1.14.32l3.17 1.98c2.73 1.71 4.97.47 4.97-2.75V8.03c0-3.23-2.24-4.47-4.97-2.75L8.11 7.26c-.34.2-.74.32-1.14.32H5.42c-2.17 0-3.25 1.09-3.25 3.25Z" /><path {...S} d="M19.5 8.67a7.2 7.2 0 0 1 0 8.66M21.48 5.96a11.9 11.9 0 0 1 0 14.08" /></>),
  ctl(<><path {...S} strokeWidth={1.6} d="M8.29 22.2h6.42c5.35 0 7.49-2.14 7.49-7.49V8.29c0-5.35-2.14-7.49-7.49-7.49H8.29C2.94.8.8 2.94.8 8.29v6.42c0 5.35 2.14 7.49 7.49 7.49ZM17.38 16.93h-1.97M12.54 16.93H5.62M17.38 12.91h-5.91M8.58 12.91H5.62" /></>, 23),
  ctl(<><path {...S} d="M9.75 23.83h6.5c5.42 0 7.58-2.16 7.58-7.58v-6.5c0-5.42-2.16-7.58-7.58-7.58h-6.5c-5.42 0-7.58 2.16-7.58 7.58v6.5c0 5.42 2.16 7.58 7.58 7.58Z" /><path {...S} d="M13.65 20.04h4.12c1.62 0 2.27-.65 2.27-2.27v-1.95c0-1.63-.65-2.28-2.27-2.28h-4.12c-1.62 0-2.27.65-2.27 2.28v1.95c0 1.62.65 2.27 2.27 2.27Z" /></>),
];

// Pressing play swaps the drawn poster for the real product video. The page
// ships no bundle; this is the only script.
const PLAY_SCRIPT = `document.querySelector('.ll-video')?.addEventListener('click',function(e){var b=e.currentTarget;if(b.dataset.on)return;b.dataset.on='1';var v=document.createElement('video');v.src='/demo-video/nanosyllabus-demo.mp4';v.controls=true;v.autoplay=true;v.playsInline=true;v.setAttribute('aria-label','NanoSyllabus product video');b.replaceChildren(v);v.play().catch(function(){});});`;

export function LiveLanding() {
  return (
    <div className="ll">
      <header className="ll-nav">
        <div className="ll-nav-in">
          <a href="/" className="ll-brand" aria-label="Nano Syllabus home">
            <img src="/landing/logo.png" width="37" height="33" alt="" />
            <span>Nano Syllabus</span>
          </a>
          <Btn href={DEMO_LESSON} tone="dark" className="ll-nav-btn">Demo lesson</Btn>
        </div>
      </header>

      <main id="main-content">
        <section className="ll-hero">
          <div className="ll-hero-glow" aria-hidden="true" />
          <div className="ll-hero-glow2" aria-hidden="true" />
          <div className="ll-hero-stage">
            <img className="ll-card ll-card-1" src="/landing/card-1.webp" width="266" height="292" alt="" />
            <img className="ll-card ll-card-2" src="/landing/card-2.webp" width="280" height="299" alt="" />
            <img className="ll-card ll-card-3" src="/landing/card-3.webp" width="299" height="323" alt="" />
            <img className="ll-card ll-card-4" src="/landing/card-4.webp" width="296" height="321" alt="" />
            <div className="ll-hero-copy">
              <h1>Transform syllabus into short interactive video lessons</h1>
              <p>
                Watching a lesson isn't studying if you forget it five minutes later. Nano Syllabus makes you think, answer interactive
                questions, and spot weak topics instantly, so every video becomes active exam preparation.
              </p>
              <Btn href={START}>Get Started</Btn>
            </div>
          </div>
        </section>

        <div className="ll-wrap">
          <button type="button" className="ll-video" aria-label="Play the NanoSyllabus video">
            <img className="ll-video-poster" src="/landing/video-poster.webp" alt="" loading="lazy" />
            <svg className="ll-video-play" width="91" height="91" viewBox="0 0 92 92" fill="none" aria-hidden="true">
              <rect x="1.06" y="1.06" width="89.88" height="89.88" rx="44.63" stroke="#fff" strokeOpacity=".5" strokeWidth="2.13" />
              <path fill="#fff" d="M46 5.75C23.77 5.75 5.75 23.77 5.75 46S23.77 86.25 46 86.25 86.25 68.23 86.25 46 68.23 5.75 46 5.75Zm12.95 40.87L39.32 60.9a.75.75 0 0 1-1.14-.59V31.78a.75.75 0 0 1 1.14-.58l19.62 14.26a.71.71 0 0 1 0 1.16Z" />
            </svg>
            <span className="ll-video-bar" aria-hidden="true"><i /><b /></span>
            <span className="ll-video-time" aria-hidden="true">05:15 / 08:30</span>
            <span className="ll-video-ctl" aria-hidden="true">
              {controls.map((c, i) => (c === 'sep' ? <i key={i} /> : <span key={i}>{c}</span>))}
            </span>
          </button>
        </div>

        <section className="ll-band ll-problem">
          <div className="ll-wrap">
            <h2 className="ll-h2">The problem</h2>
            <div className="ll-split">
              <div className="ll-split-copy">
                <h3>Your goals.<br />One study space.</h3>
                <p>You watch, you nod, you feel ready. Then the exam asks something slightly different, and the feeling disappears. Passive study leaves gaps you only find on exam day. We fix that.</p>
              </div>
              <div className="ll-panel ll-panel-blue" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="ll-why">
          <div className="ll-wrap">
            <h2 className="ll-h2">Why interactive matters now</h2>
            <div className="ll-split ll-split-rev">
              <div className="ll-panel ll-panel-sand" aria-hidden="true" />
              <div className="ll-split-copy">
                <h3>In the age of AI, answers are easy. Understanding is not.</h3>
                <p>An exam doesn't test whether you can find an answer. It tests whether you can build one, from memory, under time pressure. In every lesson you stop, think, respond and fix your mistakes. What you work out yourself is what you remember.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ll-band ll-who">
          <div className="ll-wrap">
            <h2 className="ll-h2">Who it's for</h2>
            <div className="ll-split ll-who-row">
              <div className="ll-split-copy">
                <h3>Made for students who want results, not just more content.</h3>
                <p>If you've ever finished a lecture feeling like you understood everything, only to realise you still can't solve the questions on your own, Nano Syllabus is made for you.</p>
              </div>
              <div className="ll-aud">
                {audiences.map((a) => (
                  <article key={a.title} className="ll-aud-card">
                    <span className="ll-aud-icon">{a.icon}</span>
                    <h4 className={a.font === 'manrope' ? 'is-manrope' : ''}>{a.title}</h4>
                    <p>{a.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ll-courses" id="courses">
          <div className="ll-wrap">
            <h2 className="ll-h2">Courses on the way</h2>
            <p className="ll-sub">We're building program by program. These are first.</p>
            <div className="ll-course-grid">
              {courses.map((c) => (
                <div key={c.name} className="ll-course" style={{ background: c.bg }}>
                  {icons.book}
                  <h4>{c.name}</h4>
                  <p>Course in development</p>
                  <span className="ll-tag">Coming soon</span>
                  <span className="ll-course-arrow" aria-hidden="true">↗</span>
                </div>
              ))}
            </div>
            <div className="ll-center">
              <Btn href={START}>Enroll now</Btn>
            </div>
          </div>
        </section>

        <section className="ll-compare">
          <div className="ll-wrap">
            <h2 className="ll-h2">Why NanoSyllabus</h2>
            <p className="ll-sub">Clear explanation, active participation, and exam-focused preparation, together.</p>
            <div className="ll-table-scroll">
              <table className="ll-table">
                <thead>
                  <tr>
                    <th><span className="sr-only">Feature</span></th>
                    <th>Recorded lectures</th>
                    <th>Q&amp;A collections</th>
                    <th><span className="ll-pill">With NanoSyllabus</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, a, b]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>{a}</td>
                      <td>{b}</td>
                      <td className="is-ns">Yes</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="ll-faq" id="questions">
          <div className="ll-faq-in">
            <h2>Frequently<br />Asked Question</h2>
            <div className="ll-faq-list">
              {faqs.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>
                    <span>{f.q}</span>
                    <i aria-hidden="true" />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="ll-cta-wrap">
          <div className="ll-cta">
            <div className="ll-cta-copy">
              <h2>Your exam won't wait.<br />Start preparing the right way.</h2>
              <p>Try your first micro-topic today. If it doesn't help, you've lost ten minutes.</p>
              <a href={START} className="ll-cta-btn">
                Start now <span aria-hidden="true">↗</span>
              </a>
            </div>
            <img className="ll-cta-img" src="/landing/cta-student.webp" width="586" height="391" alt="" loading="lazy" />
          </div>
        </section>
      </main>

      <footer className="ll-foot">
        <a href="/" className="ll-foot-brand" aria-label="Nano Syllabus home">
          <img src="/landing/mascot.png" width="38" height="38" alt="" />
          <span>Nano Syllabus</span>
        </a>
        <p>Small challenges. Shared ambition.</p>
        <div className="ll-social">
          <a href="https://www.linkedin.com/company/nanosyllabus" aria-label="LinkedIn" rel="noopener" target="_blank">
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path fillRule="evenodd" d="M8.64 8.22h3.41v1.7c.49-.98 1.75-1.85 3.64-1.85 3.62 0 4.48 1.94 4.48 5.5v6.6H16.5v-5.79c0-2.03-.49-3.17-1.74-3.17-1.73 0-2.45 1.23-2.45 3.17v5.79H8.64V8.22ZM2.36 20.01h3.66V8.07H2.36v11.94ZM6.55 4.17a2.33 2.33 0 0 1-.69 1.65 2.36 2.36 0 0 1-3.34 0 2.33 2.33 0 0 1 0-3.3 2.36 2.36 0 0 1 3.34 0c.44.44.69 1.03.69 1.65Z" fill="#000" /></svg>
          </a>
          <a href="https://www.instagram.com/nanosyllabus" aria-label="Instagram" rel="noopener" target="_blank">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M14.58 5.42h.01M5.83 1.67h8.34a4.17 4.17 0 0 1 4.16 4.16v8.34a4.17 4.17 0 0 1-4.16 4.16H5.83a4.17 4.17 0 0 1-4.16-4.16V5.83a4.17 4.17 0 0 1 4.16-4.16Zm7.5 7.8a3.33 3.33 0 1 1-6.59.98 3.33 3.33 0 0 1 6.59-.98Z" stroke="#000" strokeWidth="2" strokeLinecap="round" /></svg>
          </a>
          <a href="https://www.facebook.com/nanosyllabus" aria-label="Facebook" rel="noopener" target="_blank">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 2.88a4.63 4.63 0 0 0-4.63 4.62v2.58H7.1a.23.23 0 0 0-.23.22v3.4c0 .12.1.23.23.23h2.47v6.97c0 .13.1.23.23.23h3.4c.12 0 .23-.1.23-.23v-6.97h2.5c.1 0 .19-.07.21-.17l.85-3.4a.23.23 0 0 0-.22-.28h-3.34V7.5c0-.43.34-.78.77-.78h2.6c.12 0 .23-.1.23-.22V3.1c0-.12-.1-.22-.23-.22h-2.6Z" fill="#000" /></svg>
          </a>
        </div>
      </footer>
      <script dangerouslySetInnerHTML={{ __html: PLAY_SCRIPT }} />
    </div>
  );
}
