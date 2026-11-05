// /app/teacher/guide: the teacher guide, from nothing to a live course. Public on
// purpose, so a teacher can read it before they have an account. /teach and
// /app/teach/guide redirect here. Every step links to the page it talks about.

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
  ['prompts', 'Things to ask Claude'],
  ['rules', 'The rules'],
  ['review', 'After you push'],
  ['trouble', 'If something goes wrong'],
  ['other-ai', 'Other AI tools'],
  ['faq', 'Questions'],
] as const;

const NEED: [string, ReactNode, ReactNode][] = [
  ['Nano Syllabus account', 'With the Teacher role. The team adds it in step 1.', <Link key="a" to={`/signup?next=${GUIDE}`}>Create an account</Link>],
  ['GitHub account', 'The plugin lives in a private repository. The team invites you in step 1.', <a key="b" href="https://github.com/signup" target="_blank" rel="noopener noreferrer">Sign up on GitHub</a>],
  ['Claude Code', 'On Windows, macOS or Linux. It needs a paid Claude plan or an API key.', <a key="c" href="https://claude.com/claude-code" target="_blank" rel="noopener noreferrer">Install Claude Code</a>],
  ['Node.js 20 or newer', 'The toolkit runs on it and installs everything else it needs.', <a key="d" href="https://nodejs.org" target="_blank" rel="noopener noreferrer">Install Node.js</a>],
  ['Git', 'Claude Code uses it to fetch the plugin. Sign it in to GitHub with gh auth login or an SSH key.', <a key="e" href="https://git-scm.com/downloads" target="_blank" rel="noopener noreferrer">Install Git</a>],
  ['Your syllabus', 'A PDF, a photo or the text, plus any notes or past questions you want to use.', null],
];

const PROMPTS = [
  'Turn my notes on transformers (attached) into three lessons: one reading with the derivation, one interactive, one solved past question.',
  'Make lesson 4 an interactive lesson where students drag the load and see the efficiency curve.',
  'Solve IOE 2079 Baishakh Q3(b) as a reading, step by step.',
  'This intro video is 400 MB. Make it small enough and add it as the first lesson.',
  'What did the reviewer say about my last push? Fix it and push again.',
];

const RULES: [string, string][] = [
  ['Follow the syllabus', 'One subject per unit, in order, with the board\'s notation and SI units.'],
  ['One idea per lesson', '2–8 minutes. Every interactive lesson ends with a check that explains each wrong answer.'],
  ['Worked solutions are numbered steps', 'One operation each, with the final answer and its unit in bold.'],
  ['Original work', 'Quote past questions with board and year; the solutions are yours. No copied textbook pages or videos.'],
  ['Lessons run in a sandbox', 'No internet, no storage, no access to the student\'s account. Data and images go in the lesson folder.'],
  ['Nothing private in the course folder', 'No passwords, tokens or personal data. Everything in it can be published.'],
];

const STATUSES: [string, string, string, string][] = [
  ['building', 'Checking', 'The site is checking and building your push.', 'Wait. It usually takes under a minute.'],
  ['failed', 'Failed checks', 'Something would break for students.', 'Ask Claude what failed. It fixes it and pushes again.'],
  ['review', 'Waiting for review', 'It passed. A reviewer looks at it in the real player.', 'Wait, usually a day or two.'],
  ['rejected', 'Sent back', 'The reviewer left a note on what to change.', 'Ask Claude to read the note and fix it.'],
  ['approved', 'Live', 'Every signed-in student can take it.', 'Push again any time. Students keep their progress.'],
];

const TROUBLE: [string, ReactNode][] = [
  ['The plugin says the repository was not found', <>You haven't accepted the GitHub invite, or Git isn't signed in. Accept the invite from the email, run <code>gh auth login</code> in a terminal, then try again.</>],
  ['Claude can\'t find the skills after installing', 'Restart Claude Code, then ask again.'],
  ['The toolkit says Node is too old or missing', <>Run <code>node --version</code>. Install version 20 or newer, then restart Claude Code.</>],
  ['There is no token section on Teacher tools', 'Your account is still a student account. Send your email to the team and ask for the Teacher role.'],
  ['Sign-in is refused', <>The token may be revoked or mistyped. <Link to={`${TOOLS}#tokens`}>Create a new one</Link> and sign in again.</>],
  ['A lesson says it can\'t load something', 'Lessons have no internet. Ask Claude to put the file in the lesson folder.'],
  ['Anything else', 'Ask Claude "what went wrong?" first; the messages say what to fix. Otherwise send the team your submission number.'],
];

const FAQ: [string, ReactNode][] = [
  ['Do I need to know how to code?', 'No. You describe what you want; Claude writes the files, runs the checks and fixes errors. You review the lessons in the preview, like a student would.'],
  ['Who owns the course?', 'You do. Only you and our admins can push updates to a course you created. Your name is on it.'],
  ['How big can videos be?', 'Up to 500 MB each, but aim for under 200 MB (720p is plenty). Ask Claude to shrink a big video; it uses ffmpeg if you have it installed.'],
  ['Can I work on several courses?', <>Yes. Keep them in the same folder and push one at a time (<i>"push the physics course"</i>).</>],
  ['Can I charge for my course?', 'Not yet. Teacher courses are free for students while we start. Talk to us if you want to offer a paid course.'],
  ['How do I get plugin updates?', <>In Claude Code, type <code>/plugin</code> and update <b>nano-syllabus</b> from the menu.</>],
];

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

/** Something to say to Claude, with a Copy button. */
function Say({ children }: { children: string }) {
  return <div className="guide-say"><CopyBlock text={children} /></div>;
}

export default function TeachGuide() {
  const { user } = useAuth();
  const teacher = user?.role === 'teacher' || user?.role === 'admin';
  useHashScroll();
  useSeo({
    title: `Teacher guide · ${SITE}: make a course with Claude Code`,
    description: 'How teachers turn a syllabus into short interactive lessons with Claude Code, check them, preview them and publish them on Nano Syllabus.',
  });

  return (
    <main className="wrap page guide">
      <header className="guide-hero stack">
        <span className="badge">Teacher guide</span>
        <h1>Make a course with Claude Code</h1>
        <p className="muted">
          You know the subject. Claude Code writes the lessons with you, our toolkit checks them the way the site will, and you send the course
          to us for a quick review. Once approved, it is live for every student, free.
        </p>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {teacher ? (
            <Link className="btn btn-primary" to={TOOLS}>Open teacher tools</Link>
          ) : user ? (
            <Link className="btn btn-primary" to={TOOLS}>Request teacher access</Link>
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
              <Step title="Get access">
                {user ? (
                  <p>You are signed in as <b>{user.email}</b>.{teacher ? ' Your account is already a teacher.' : ' Send that email and your GitHub username to the Nano Syllabus team.'}</p>
                ) : (
                  <p><Link to={`/signup?next=${GUIDE}`}>Create an account</Link>, then send the email you used and your GitHub username to the Nano Syllabus team.</p>
                )}
                <p>We give your account the Teacher role and invite you to the plugin's repository on GitHub. <b>Accept the invite</b> from the email GitHub sends you.</p>
              </Step>

              <Step title="Add the plugin to Claude Code">
                <p>Open Claude Code in an empty folder for your courses and type these two lines. Restart Claude Code if it asks.</p>
                <CopyBlock text={'/plugin marketplace add Nano-Syllabus/nano-syllabus-toolkit\n/plugin install nano-syllabus@nano-syllabus'} />
                <p className="muted small">This gives Claude the skills that plan, write, check and push a course, our lesson kit and the <code>ns</code> toolkit.</p>
              </Step>

              <Step title="Sign Claude in to your account">
                <p>On <Link to={`${TOOLS}#tokens`}>Teacher tools → Access tokens</Link>, create a token. Copy it and tell Claude:</p>
                <Say>Sign me in to Nano Syllabus with this token: nst_…</Say>
                <p className="muted small">The token is saved in your user folder, never in your course files. Never share it. If it leaks, revoke it on the same page.</p>
              </Step>

              <Step title="Plan the course from your syllabus">
                <p>Attach or paste the syllabus and ask:</p>
                <Say>Make a Nano Syllabus course from this syllabus. It's IOE Bachelor, Electrical Machines.</Say>
                <p>Claude proposes one subject per unit in syllabus order, with 4–10 short lessons each. <b>Check the plan and correct it.</b> Files are only created once you agree.</p>
              </Step>

              <Step title="Write the lessons and watch them">
                <Say>Write the lessons of Unit 1. Start the preview so I can see them.</Say>
                <p>The preview opens at <code>http://localhost:5190</code> and runs each lesson as the site will, at phone, tablet and desktop size, in light and dark. Saving a file updates it instantly.</p>
                <div className="guide-note">
                  <b>Watch it like a student on a phone</b>
                  <p className="small">Choose <b>Phone</b>, then press <b>⤢</b> on a video. It fills the screen on its side, like YouTube, and the controls fade while it plays. Tap the video to bring them back. <b>Turn sideways</b> rotates the phone at any time, and <b>Full screen</b> gives the lesson your whole window.</p>
                </div>
                <p>Ask for changes in plain words:</p>
                <Say>The slider in "Back EMF" should go up to 1500 rpm, and add a second check about starting current.</Say>
              </Step>

              <Step title="Check it">
                <Say>Check the course.</Say>
                <p>Claude runs the same checks as the site. It fixes every <b>✗</b> (something that would break) and tells you about every <b>!</b> (a style or quality hint). Lessons marked as drafts stay out until you say they are ready.</p>
              </Step>

              <Step title="Push it for review">
                <Say>Push the course for review. Note: Units 1–3 are complete.</Say>
                <p>The site checks and builds the course, usually in under a minute. Open the exact version we review from <Link to={`${TOOLS}#submissions`}>Teacher tools → Submissions</Link> → Preview.</p>
              </Step>

              <Step title="Follow the review">
                <p>Your push moves through the statuses <a href="#review">listed below</a>. Once it is approved, the course is live. See it in <Link to={`${TOOLS}#courses`}>Your courses</Link>.</p>
              </Step>
            </ol>
          </section>

          <section id="prompts" className="stack">
            <h2>Things to ask Claude</h2>
            {PROMPTS.map((p) => <Say key={p}>{p}</Say>)}
            <p className="muted small">Have a whole syllabus PDF? Ask Claude to use the <b>nano-studio</b> skill. It captures every unit and topic, then builds each topic in stages: brief, script, narration, animation and questions.</p>
          </section>

          <section id="rules" className="stack">
            <h2>The rules</h2>
            <p className="muted">Claude follows them; you check them.</p>
            <div className="guide-need">
              {RULES.map(([what, why]) => (
                <div key={what}>
                  <b>{what}</b>
                  <span className="muted small">{why}</span>
                </div>
              ))}
            </div>
            <p className="muted small">The full rulebook is inside the plugin. Ask Claude <i>"show me the Nano Syllabus style guide"</i>. Teacher courses are free for every signed-in student for now.</p>
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
            <p className="muted small">A new push of the same course replaces one still waiting, so you never need to cancel anything. Track every push on <Link to={`${TOOLS}#submissions`}>Teacher tools</Link>.</p>
          </section>

          <section id="trouble" className="stack">
            <h2>If something goes wrong</h2>
            <div className="stack guide-faq">
              {TROUBLE.map(([q, a]) => <details key={q} className="card"><summary>{q}</summary><p>{a}</p></details>)}
            </div>
          </section>

          <section id="other-ai" className="stack">
            <h2>Using another AI tool</h2>
            <p>Any AI app that supports MCP (Model Context Protocol) can read our rules, check a course and submit it with the same access token. Add this as a remote MCP server:</p>
            <CopyBlock text={`${location.origin}/mcp`} />
            <p>With this header:</p>
            <CopyBlock text="Authorization: Bearer nst_…" />
            <p className="muted small">
              With Claude Code you don't need this: the plugin connects it when <code>NANO_SYLLABUS_TOKEN</code> is set. Tools: <code>guide</code>, <code>list_courses</code>, <code>get_course_files</code>, <code>check_course</code>, <code>submit_course</code>, <code>submission_status</code>. Large videos are easier to send with Claude Code.
            </p>
          </section>

          <section id="faq" className="stack">
            <h2>Questions</h2>
            <div className="stack guide-faq">
              {FAQ.map(([q, a]) => <details key={q} className="card"><summary>{q}</summary><p>{a}</p></details>)}
            </div>
          </section>

          <div className="guide-next card">
            <div>
              <b>Ready to start?</b>
              <p className="muted small">{teacher ? 'Create your access token, then connect Claude Code.' : 'Your first step is getting teacher access.'}</p>
            </div>
            <Link className="btn btn-primary" to={user ? `${TOOLS}${teacher ? '#tokens' : ''}` : `/signup?next=${GUIDE}`}>{teacher ? 'Open teacher tools' : user ? 'Request teacher access' : 'Create an account'}</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
