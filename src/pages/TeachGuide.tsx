// /app/teacher/guide: the in-house guide (2026-11-06), from a clone of the toolkit to a
// live course. The toolkit is used by the Nano Syllabus team, not installed by outside
// teachers: clone it, run the studio, and make courses there. Public on purpose (it
// explains the flow); /teach and /app/teach/guide redirect here.

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CopyBlock, useHashScroll } from '../components/teach';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';

const GUIDE = '/app/teacher/guide';
const TOOLS = '/app/teach';

const SECTIONS = [
  ['need', 'What you need'],
  ['steps', 'The 8 steps'],
  ['pages', 'The studio pages'],
  ['agents', 'The agents'],
  ['house', 'Talking to the House rules agent'],
  ['rules', 'The rules'],
  ['review', 'After you push'],
  ['trouble', 'If something goes wrong'],
  ['faq', 'Questions'],
] as const;

const NEED: [string, ReactNode, ReactNode][] = [
  ['Team access', 'The toolkit repository is private, for the Nano Syllabus team. Ask to be added on GitHub.', null],
  ['Nano Syllabus account', 'With the Teacher role, for the key that pushes courses. An admin gives the role.', <Link key="a" to={`/signup?next=${GUIDE}`}>Create an account</Link>],
  ['Claude Code', 'Logged in once on your computer. The studio runs it for you: it reads, parses and writes. No API key.', <a key="c" href="https://claude.com/claude-code" target="_blank" rel="noopener noreferrer">Install Claude Code</a>],
  ['Node.js 20 and Git', 'The studio runs on Node. Git clones the toolkit.', <a key="d" href="https://nodejs.org" target="_blank" rel="noopener noreferrer">Install Node.js</a>],
  ['The subject\'s documents', 'Syllabus, past questions, notes and reference books. PDFs (scanned is fine), photos or text.', null],
];

const PAGES: [string, string][] = [
  ['Setup', 'Your teacher key and the Claude Code check. The studio opens here until the key is saved.'],
  ['Documents linked', 'University › institute › programme › semester › subject, and the four shelves of documents. One Prepare everything button per subject; rename, move, delete and file unsorted subjects here too.'],
  ['Parsed structure', 'The syllabus graph: units → topics → micro-topics, with the past questions linked to each. Edit anything.'],
  ['Experiment', 'Manual mode: change the house rules or one agent\'s prompt yourself, run it on a real topic, compare. Nothing is saved until you keep it.'],
  ['Video production', 'Each topic\'s nine steps, from topic content to generate audio, and the House rules agent (chat with Claude Code, or manual).'],
  ['Provider', 'Claude Code is the default. API providers are optional for the other agents.'],
  ['Logs', 'Every document linked, agent run (with its time and steps), change kept or reverted, and error.'],
  ['Pipeline', 'Every agent in order, read only. Click one to read what it does and the instructions it follows now.'],
];

const PREP: [string, string][] = [
  ['Syllabus agent + checker', 'Reads the syllabus shelf only and makes the graph: units, topics and their micro-topics, in the syllabus\'s own order and words.'],
  ['Parser agents', 'Claude Code, several at once. Each reads 10 pages of one document (scans as images: the OCR) and writes faithful Markdown with page markers.'],
  ['Question linker', 'Reads the parsed past papers and links every question to its topic and, when clear, its micro-topic.'],
  ['Topic content agent', 'Searches the parsed Markdown for one topic and writes its content file, with the source and page of every passage. Video generation starts from this file.'],
];

const MAKERS: [string, string][] = [
  ['House rules agent', 'Takes what you want changed, in your words, and edits the other agents\' instructions. You keep or revert each change.'],
  ['Brief agent', 'Objectives, key ideas, formulas, misconceptions and the linked past questions, from the topic content file.'],
  ['Script agent', 'The three segments beat by beat, with the board lines. Follows the layout rules.'],
  ['Narration agent', 'The caption for every beat, shown on screen and read aloud.'],
  ['Animation agent', 'The 3D machine tour for Basic Understanding and the figures beside the board.'],
  ['Questions agent', 'Questions inside the videos; the video pauses until the student answers.'],
];

const REVIEWERS: [string, string][] = [
  ['Nepali education agent', 'Real syllabus and board, papers only from the question bank with year, session and marks, answers that earn full marks, Nepali textbook symbols.'],
  ['Layout agent', 'Beat by beat on a wide screen and a phone: overflow, page turns, crowding, colliding labels, a box inside a box.'],
  ['Accuracy agent', 'Redoes every number, formula, unit, direction and question answer.'],
  ['Content quality agent', 'Would a student understand and remember it: no step from nowhere, every point covered, no padding.'],
];

const SEGMENTS: [string, string][] = [
  ['1 · Basic Understanding', 'An overview of what you will learn, then one video in 3D: a walk around the machine, part by part, no maths.'],
  ['2 · Syllabus Content', 'One video per syllabus point: definitions first, then each derivation step by step on the board.'],
  ['3 · Model Answer', 'One exam question answered the way the marking scheme pays, from a real past paper when there is one.'],
];

const HOUSE_SAYS = [
  'Keep every caption under 14 words.',
  'For this topic, start the 3D tour from a transformer on an electric pole.',
  'Put every derivation step on its own beat, and say the unit with each answer.',
  'Use IOE exam phrasing in the Model Answer for every Electrical Machines topic.',
  'Fewer questions inside the videos: one per segment.',
];

const RULES: [string, string][] = [
  ['Follow the syllabus', 'The graph comes from the syllabus only, in its order, with the board\'s notation and SI units.'],
  ['Teach from the documents', 'Every passage in the topic content cites its source and page. Nothing is invented; gaps are listed as gaps.'],
  ['Worked solutions are numbered steps', 'One operation each, with the final answer and its unit.'],
  ['Original work', 'Quote past questions with board and year; the solutions are ours. No copied textbook pages or videos.'],
  ['Lessons run in a sandbox', 'No internet, no storage, no access to the student\'s account.'],
  ['Documents stay on your computer', 'sources/ and the parsed Markdown are never pushed. Only courses/ and media/ are.'],
];

const STATUSES: [string, string, string, string][] = [
  ['building', 'Checking', 'The site is checking and building your push.', 'Wait. It usually takes under a minute.'],
  ['failed', 'Failed checks', 'Something would break for students.', 'Run npm run check, fix the ✗ lines, push again.'],
  ['review', 'Waiting for review', 'It passed. An admin plays it in the real player.', 'Wait for the review.'],
  ['rejected', 'Sent back', 'The reviewer left a note on what to change.', 'Read it with npm run status, fix it in the studio, push again.'],
  ['approved', 'Live', 'Every signed-in student can take it.', 'Push again any time. Students keep their progress.'],
];

const TROUBLE: [string, ReactNode][] = [
  ['Setup says Claude Code was not found', <>Install Claude Code, run <code>claude</code> once in a terminal and log in, then reload the studio.</>],
  ['A run says Claude Code is not signed in', <>Run <code>claude</code> in a terminal, log in, and press the button again.</>],
  ['The teacher key is refused', <>It may be revoked or mistyped. <Link to={`${TOOLS}#tokens`}>Create a new one</Link> and paste it on Setup.</>],
  ['There is no token section on Teacher tools', 'Your account is still a student account. Ask an admin for the Teacher role.'],
  ['Some pages failed to parse', 'Press Prepare everything again. Finished page ranges are kept; only the missing ones run again.'],
  ['Prepare everything opened a draft instead', 'The checks found something in the syllabus. Fix it in the draft and apply it, then press Prepare everything again: it carries on from there.'],
  ['A House rules change shows "placeholders"', 'The agent dropped a {{…}} the studio fills in. Look at the diff; revert it or ask the agent to put it back.'],
  ['A lesson says it can\'t load something', 'Lessons have no internet. The file has to be in the lesson folder or media/.'],
  ['Anything else', 'Open Logs: every failed run shows its steps and the error.'],
];

const FAQ: [string, ReactNode][] = [
  ['Do I need to know how to code?', 'No. You fill in forms, drop documents, correct the structure and tell the House rules agent what you want. The studio and Claude Code do the rest.'],
  ['Does it cost anything per lesson?', 'The studio uses your own Claude Code login, so it counts against your Claude plan. Logs shows how many AI calls each step made.'],
  ['Is this RAG?', 'No. Claude Code agents read every page and turn it into Markdown first; the topic content agent then searches that text and cites the pages.'],
  ['Does it make MP4 files?', 'No. A lesson is drawn live in the player with captions and an optional voice, which is what students see on the site.'],
  ['Where do my documents go?', <>Into <code>workspace/sources/</code> in your clone of the toolkit. They are never pushed or uploaded anywhere.</>],
  ['How do I get toolkit updates?', <>Run <code>git pull</code> in the toolkit folder, then <code>npm run setup</code> if the packages changed.</>],
];

const TREE = `nano-syllabus-toolkit/
└── workspace/          made by npm run studio (not in git)
    ├── sources/        your documents: never leave this computer
    │   └── tu/ioe/bei/semester-3/computer-graphics/
    │       ├── syllabus/  question-bank/  notes/  reference-books/
    ├── unsorted/       documents not filed into a programme yet
    ├── courses/        the lessons: this is what gets pushed
    ├── media/          images and video lessons use: also pushed
    ├── studio/         your changes to the agents
    └── .studio/        parsed Markdown, topic content, agent work, logs`;

// The pipeline's real shape (the studio's Pipeline page): a row is one step; a row with several
// boxes runs side by side.
type Flow = { boxes: string[]; note?: string }[];
const PREP_FLOW: Flow = [
  { boxes: ['Documents linked'] },
  { boxes: ['Syllabus agent + checker → syllabus graph', 'Parser agents (several at once, OCR) → Markdown'], note: 'side by side' },
  { boxes: ['Question linker'], note: 'needs the graph and the parsed papers' },
  { boxes: ['Topic content agent'] },
];
const VIDEO_FLOW: Flow = [
  { boxes: ['Topic content'] },
  { boxes: ['Brief agent'] },
  { boxes: ['Script agent'] },
  { boxes: ['Narration agent'] },
  { boxes: ['Animation agent', 'Questions agent'], note: 'side by side: both need only the narration' },
  { boxes: ['Nepali education', 'Layout', 'Accuracy', 'Content quality'], note: 'review report: four agents side by side; "must fix" goes back to its agent once' },
  { boxes: ['Lesson prepare'] },
  { boxes: ['Generate audio'] },
];

function FlowChart({ flow, label }: { flow: Flow; label: string }) {
  return (
    <ol className="guide-flow" aria-label={label}>
      {flow.map((row, i) => (
        <li key={i}>
          <div className={row.boxes.length > 1 ? 'guide-flow-par' : 'guide-flow-row'}>
            {row.boxes.map((b) => <span key={b}>{b}</span>)}
          </div>
          {row.note && <small className="muted">{row.note}</small>}
        </li>
      ))}
    </ol>
  );
}

function Cards({ items }: { items: [string, string][] }) {
  return (
    <div className="guide-need">
      {items.map(([what, why]) => (
        <div key={what}>
          <b>{what}</b>
          <span className="muted small">{why}</span>
        </div>
      ))}
    </div>
  );
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li>
      <div className="stack guide-step">
        <h3>{title}</h3>
        {children}
      </div>
    </li>
  );
}

/** Something to type, with a Copy button. */
function Say({ children }: { children: string }) {
  return <div className="guide-say"><CopyBlock text={children} /></div>;
}

export default function TeachGuide() {
  const { user } = useAuth();
  const teacher = user?.role === 'teacher' || user?.role === 'admin';
  useHashScroll();
  useSeo({
    title: `Studio guide · ${SITE}: from a syllabus to video lessons`,
    description: 'How the Nano Syllabus team turns a university syllabus, notes and past papers into interactive video lessons with the in-house studio and Claude Code.',
  });

  return (
    <main className="wrap page guide">
      <header className="guide-hero stack">
        <span className="badge">Studio guide · in house</span>
        <h1>From a syllabus to video lessons</h1>
        <p className="muted">
          The Nano Syllabus studio runs on your computer. You give it a subject's documents; it builds the syllabus graph, parses every page with
          Claude Code, gathers each topic's content, and makes the video lessons. You correct and steer it, then push the course for review.
        </p>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {teacher ? (
            <Link className="btn btn-primary" to={`${TOOLS}#tokens`}>Get your teacher key</Link>
          ) : user ? (
            <Link className="btn btn-primary" to={TOOLS}>Teacher tools</Link>
          ) : (
            <Link className="btn btn-primary" to={`/signup?next=${GUIDE}`}>Create an account</Link>
          )}
          <a className="btn" href="#steps">See the steps</a>
        </div>
      </header>

      <div className="guide-layout">
        <nav className="guide-toc" aria-label="On this page">
          <b>On this page</b>
          {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>

        <div className="guide-body">
          <section id="need" className="stack">
            <h2>What you need</h2>
            <div className="guide-need">
              {NEED.map(([what, why, link]) => (
                <div key={what}>
                  <b>{what}</b>
                  <span className="muted small">{why}</span>
                  {link && <span className="small">{link}</span>}
                </div>
              ))}
            </div>
          </section>

          <section id="steps" className="stack">
            <h2>The 8 steps</h2>
            <ol className="guide-steps">
              <Step title="Clone the toolkit and start the studio">
                <CopyBlock text={'git clone git@github.com:Nano-Syllabus/nano-syllabus-toolkit.git\ncd nano-syllabus-toolkit\nnpm run setup\nnpm run studio'} />
                <p>The studio opens at <code>http://127.0.0.1:5191</code>. It works in a <code>workspace/</code> folder inside the clone and listens on your computer only.</p>
                <pre className="guide-tree">{TREE}</pre>
              </Step>

              <Step title="Setup: your teacher key">
                {user ? (
                  <p>You are signed in as <b>{user.email}</b>.{teacher ? '' : ' Your account needs the Teacher role first: ask an admin.'}</p>
                ) : (
                  <p><Link to={`/signup?next=${GUIDE}`}>Create an account</Link> and ask an admin for the Teacher role.</p>
                )}
                <p>On <Link to={`${TOOLS}#tokens`}>Teacher tools → Access tokens</Link>, create a key (<code>nst_…</code>) and paste it on the studio's <b>Setup</b> page. It is checked against the site and saved in your user folder, never in the workspace. Setup also checks that Claude Code is installed.</p>
              </Step>

              <Step title="Link the documents">
                <p>On <b>Documents linked</b>, type the university, institute and programme, each as a short and a full name (TU · Tribhuvan University, IOE · Institute of Engineering, BEI · Bachelor in Electronics, Communication and Information Engineering), then the level, semester and subject. Drop each document on its shelf: <b>Syllabus</b> (required), <b>Question bank</b>, <b>Notes</b> and <b>Reference books</b> (with title, author and edition).</p>
                <p>Everything can be edited from that page: rename a university, institute or programme, move a subject to another semester, or delete. Subjects in <code>unsorted/</code> show under <b>Not filed yet</b>; <b>File</b> puts one into a programme.</p>
              </Step>

              <Step title="Prepare everything: one button per subject">
                <p>Press <b>Prepare everything</b> on the subject. In one go, the syllabus agent builds the graph (units → topics → micro-topics, from the syllabus only) while Claude Code parser agents read every page of the other documents (scans included) into Markdown. Then each past question is linked to its topic, and each topic's content file is gathered, with the source and page of every passage. Steps already done are skipped, so pressing it again only finishes what is missing.</p>
                <FlowChart flow={PREP_FLOW} label="Data preparation" />
              </Step>

              <Step title="Correct the structure">
                <p>On <b>Parsed structure</b>, fix anything the graph got wrong: names, numbering, hours, missing or extra micro-topics. Topics renumber themselves when you save. Parsed Markdown opens from the subject's document list, to fix OCR mistakes.</p>
              </Step>

              <Step title="Make the videos">
                <p>On <b>Video production</b>, pick a topic and press <b>Run every missing step</b>, or run the steps one at a time. They follow the pipeline: a step starts once the steps it needs are done, and steps that don't need each other run side by side.</p>
                <FlowChart flow={VIDEO_FLOW} label="Video generation" />
                <p>Every topic plays as three segments:</p>
                <Cards items={SEGMENTS} />
              </Step>

              <Step title="Steer it with the House rules agent">
                <p>Tell it what should change, in your own words. It edits the other agents' instructions and shows every change with <b>Diff / Keep / Revert</b>. Prefer to do it yourself? Use <b>Manual</b>, or try a prompt on one topic in <b>Experiment</b>. Then run the stages again and compare versions. <a href="#house">Examples below</a>.</p>
              </Step>

              <Step title="Watch, check and push">
                <p>The steps end with <b>Generate audio</b>: Kokoro on your computer, and the Nepali Kokoro voice (kokoro-ne) when the narration language is Nepali or Roman Nepali. Then, in the toolkit folder:</p>
                <CopyBlock text={'npm run check\nnpm run push -- computer-graphics --note "Unit 1, topics 1.1–1.4"'} />
                <p>The site checks and builds it, usually in under a minute. Follow it on <Link to={`${TOOLS}#submissions`}>Teacher tools → Submissions</Link>; an admin reviews it there.</p>
              </Step>
            </ol>
          </section>

          <section id="pages" className="stack">
            <h2>The studio pages</h2>
            <Cards items={PAGES} />
          </section>

          <section id="agents" className="stack">
            <h2>The agents</h2>
            <h3>Data preparation</h3>
            <p>Everything before the videos happens in the studio, so each video starts from the subject's own documents.</p>
            <Cards items={PREP} />
            <h3>Video generation</h3>
            <p>Each agent gets the studio rulebook and the house rules; the brief, script and questions agents also follow the Nepal exam rules.</p>
            <Cards items={MAKERS} />
            <h3>The review report</h3>
            <p>Four agents read the finished topic and report what is wrong, where, and how to fix it. Anything marked <b>must fix</b> goes back to its agent once, and they read it again.</p>
            <Cards items={REVIEWERS} />
            <p className="muted small">See them all as a chart on the studio's <b>Pipeline</b> page.</p>
          </section>

          <section id="house" className="stack">
            <h2>Talking to the House rules agent</h2>
            <p>Say what should change. Mention "this topic" or "this course" to keep the change there; otherwise it applies to every course.</p>
            {HOUSE_SAYS.map((p) => <Say key={p}>{p}</Say>)}
            <p className="muted small">It can only change the agents' instructions in the workspace's <code>studio/</code> folder. It never runs the pipeline itself: you rerun the stages after keeping its changes.</p>
          </section>

          <section id="rules" className="stack">
            <h2>The rules</h2>
            <p className="muted">The agents follow them; you check them.</p>
            <Cards items={RULES} />
          </section>

          <section id="review" className="stack">
            <h2>After you push</h2>
            <div className="table-scroll">
              <table className="guide-table">
                <thead><tr><th>Status</th><th>Meaning</th><th>What to do</th></tr></thead>
                <tbody>
                  {STATUSES.map(([k, label, meaning, todo]) => (
                    <tr key={k}>
                      <td><span className={`status status-${k}`}>{label}</span></td>
                      <td>{meaning}</td>
                      <td>{todo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted small">A new push of the same course replaces one still waiting. Each approved push is a numbered version an admin can put back live.</p>
          </section>

          <section id="trouble" className="stack">
            <h2>If something goes wrong</h2>
            <div className="stack guide-faq">
              {TROUBLE.map(([q, a]) => <details key={q} className="card"><summary>{q}</summary><p>{a}</p></details>)}
            </div>
          </section>

          <section id="faq" className="stack">
            <h2>Questions</h2>
            <div className="stack guide-faq">
              {FAQ.map(([q, a]) => <details key={q} className="card"><summary>{q}</summary><p>{a}</p></details>)}
            </div>
            <p className="muted small">The full written guide is <code>GETTING-STARTED.md</code> in the toolkit.</p>
          </section>

          <div className="guide-next card">
            <div>
              <b>Ready to start?</b>
              <p className="muted small">{teacher ? 'Create your teacher key, then start the studio.' : 'First, an account with the Teacher role.'}</p>
            </div>
            <Link className="btn btn-primary" to={user ? `${TOOLS}${teacher ? '#tokens' : ''}` : `/signup?next=${GUIDE}`}>{teacher ? 'Get your teacher key' : user ? 'Teacher tools' : 'Create an account'}</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
