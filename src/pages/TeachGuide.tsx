// /teach: the public walkthrough for teachers. How any teacher with Claude
// Code turns a syllabus into a published Nano Syllabus course.

import { Link } from 'react-router-dom';
import { CopyBlock } from '../components/teach';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';

export default function TeachGuide() {
  const { user } = useAuth();
  const teacher = user?.role === 'teacher' || user?.role === 'admin';
  useSeo({
    title: `Teach on ${SITE}: make a course with Claude Code`,
    description: 'How teachers turn a syllabus into short interactive lessons with Claude Code, check them, preview them and publish them on Nano Syllabus.',
  });

  return (
    <main className="wrap page narrow stack">
      <span className="badge">For teachers</span>
      <h1>Make a course with Claude Code</h1>
      <p className="muted" style={{ fontSize: '1.1rem' }}>
        You know the subject. Claude Code writes the lessons with you: interactive lessons that make students try the idea, readings with
        step-by-step worked solutions, and videos. Our toolkit checks everything the way the site will, shows you each lesson on a phone
        and a laptop, and sends the course to us for a quick review. Once approved it is live for every student, free.
      </p>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {teacher ? (
          <Link className="btn btn-primary" to="/app/teach">Open teacher tools</Link>
        ) : user ? (
          <Link className="btn btn-primary" to="/app/teach">Request teacher access</Link>
        ) : (
          <Link className="btn btn-primary" to="/signup?next=/app/teach">Create an account</Link>
        )}
        <a className="btn" href="#steps">See the steps</a>
      </div>

      <nav className="toc card" aria-label="On this page">
        <a href="#before">What you need</a>
        <a href="#steps">The 7 steps</a>
        <a href="#prompts">Things to ask Claude</a>
        <a href="#rules">The rules</a>
        <a href="#review">After you push</a>
        <a href="#other-ai">Other AI tools</a>
        <a href="#faq">Questions</a>
      </nav>

      <h2 id="before">What you need</h2>
      <ul>
        <li>A Nano Syllabus account with the <b>Teacher</b> role (sign up, then ask us to add it).</li>
        <li>
          <a href="https://claude.com/claude-code" target="_blank" rel="noopener noreferrer">Claude Code</a> on your computer (Windows, macOS or Linux), and{' '}
          <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer">Node.js 20 or newer</a>.
        </li>
        <li>Your syllabus (a PDF, a photo or the text), and any notes or past questions you want to use.</li>
      </ul>

      <h2 id="steps">The 7 steps</h2>
      <ol className="guide-steps">
        <li>
          <div className="stack">
            <h3>Get teacher access</h3>
            <p>
              {user ? (
                <>You are signed in as <b>{user.email}</b>{teacher ? ' and already a teacher.' : '. Send that email to the Nano Syllabus team and we will make you a teacher.'}</>
              ) : (
                <>
                  <Link to="/signup?next=/app/teach">Create an account</Link>, then send the email you used to the Nano Syllabus team. We give it the Teacher role.
                </>
              )}
            </p>
          </div>
        </li>
        <li>
          <div className="stack">
            <h3>Add the Nano Syllabus plugin to Claude Code</h3>
            <p>Open Claude Code in an empty folder for your courses and type:</p>
            <CopyBlock text={'/plugin marketplace add Nano-Syllabus/nano-syllabus-toolkit\n/plugin install nano-syllabus@nano-syllabus'} />
            <p className="muted small">
              This gives Claude three skills (<b>nano-course</b> to plan a course, <b>nano-lesson</b> to write lessons, <b>nano-publish</b> to check and push),
              our lesson kit, and the <code>ns</code> toolkit. Restart Claude Code if it asks.
            </p>
          </div>
        </li>
        <li>
          <div className="stack">
            <h3>Sign Claude in to your account</h3>
            <p>
              On <Link to="/app/teach">Teacher tools</Link>, create an <b>access token</b>. Copy it and tell Claude:
            </p>
            <p className="prompt">Sign me in to Nano Syllabus with this token: nst_…</p>
            <p className="muted small">
              Claude runs <code>ns login</code>; the token is saved in your user folder, never in your course files. Revoke it any time on the same page.
            </p>
          </div>
        </li>
        <li>
          <div className="stack">
            <h3>Plan the course from your syllabus</h3>
            <p>Attach or paste the syllabus and ask:</p>
            <p className="prompt">Make a Nano Syllabus course from this syllabus. It's IOE Bachelor, Electrical Machines.</p>
            <p>
              Claude reads it and proposes a plan: one subject per unit in syllabus order, 4–10 short lessons each, and a solved past question at the end of every
              unit. <b>Check the plan and correct it</b>; it only creates the files once you agree.
            </p>
          </div>
        </li>
        <li>
          <div className="stack">
            <h3>Write the lessons, and watch them as you go</h3>
            <p className="prompt">Write the lessons of Unit 1. Start the preview so I can see them.</p>
            <p>
              Claude writes each lesson with the kit: explain → try it → check, with real exam notation. A preview opens in your browser (
              <code>http://localhost:5190</code>) with every lesson at phone, tablet and desktop size, in light and dark, running exactly as on the site.
              Saving a file updates it instantly. Ask for changes in plain words:
            </p>
            <p className="prompt">The slider in "Back EMF" should go up to 1500 rpm, and add a second check about starting current.</p>
          </div>
        </li>
        <li>
          <div className="stack">
            <h3>Check it</h3>
            <p className="prompt">Check the course.</p>
            <p>
              Claude runs <code>ns check</code>: the same checks the site runs. It fixes every <b>✗</b> (something that would break) and tells you about every{' '}
              <b>!</b> (a style or quality hint). Lessons still marked as drafts are left out until you say they are ready.
            </p>
          </div>
        </li>
        <li>
          <div className="stack">
            <h3>Publish</h3>
            <p className="prompt">Push the course for review. Note: Units 1–3 are complete.</p>
            <p>
              Claude runs <code>ns push</code>. The site checks and builds the course (usually under a minute) and puts it in our review queue. You can open the exact
              version we review from <Link to="/app/teach">Teacher tools</Link> → Submissions → Preview.
            </p>
          </div>
        </li>
      </ol>

      <h2 id="prompts">Things to ask Claude</h2>
      <div className="stack">
        <p className="prompt">Turn my notes on transformers (attached) into three lessons: one reading with the derivation, one interactive, one solved past question.</p>
        <p className="prompt">Make lesson 4 an interactive lesson where students drag the load and see the efficiency curve.</p>
        <p className="prompt">Solve IOE 2079 Baishakh Q3(b) as a reading, step by step.</p>
        <p className="prompt">This intro video is 400 MB. Make it small enough and add it as the first lesson.</p>
        <p className="prompt">What did the reviewer say about my last push? Fix it and push again.</p>
      </div>

      <h2 id="rules">The rules (Claude follows them; you check them)</h2>
      <ul>
        <li><b>Follow the syllabus</b>: one subject per unit, in order, with the board's notation and SI units.</li>
        <li><b>One idea per lesson</b>, 2–8 minutes. Every interactive lesson ends with a check that explains each wrong answer.</li>
        <li><b>Worked solutions are numbered steps</b>, one operation each, with the final answer and its unit in bold.</li>
        <li><b>Original work.</b> Quote past questions with board and year; the solutions are yours. No copied textbook pages or videos.</li>
        <li><b>Lessons run in a sandbox</b>: no internet, no storage, no access to the student's account. Data and images go in the lesson folder.</li>
        <li><b>Free for now</b>: teacher courses are free for every signed-in student.</li>
        <li><b>Nothing private</b> in the course folder: no passwords, tokens or personal data. Everything in it can be published.</li>
      </ul>
      <p className="muted small">
        The full rulebook is inside the plugin; ask Claude <i>"show me the Nano Syllabus style guide"</i>, or run <code>ns guide</code>.
      </p>

      <h2 id="review">After you push</h2>
      <div className="rows">
        <div className="card"><span><span className="status status-building">Checking</span> The site is checking and building your push. Usually under a minute.</span></div>
        <div className="card"><span><span className="status status-failed">Failed checks</span> Something would break for students. Ask Claude what failed; it fixes it and pushes again.</span></div>
        <div className="card"><span><span className="status status-review">Waiting for review</span> Passed. A reviewer looks at it in the real player, usually within a day or two.</span></div>
        <div className="card"><span><span className="status status-rejected">Sent back</span> The reviewer left a note on what to change. Ask Claude to read it and fix it.</span></div>
        <div className="card"><span><span className="status status-approved">Live</span> Every signed-in student can take it. Push again any time to update it; students keep their progress.</span></div>
      </div>
      <p className="muted small">A new push of the same course replaces one still waiting, so you never need to cancel anything.</p>

      <h2 id="other-ai">Using another AI tool</h2>
      <p>
        Any AI app that supports MCP (Model Context Protocol) can read our rules, check a course and submit it, using the same access token. The connector address is:
      </p>
      <CopyBlock text={`${location.origin}/mcp`} />
      <p className="muted small">With Claude Code you don't need this: the plugin connects it for you when <code>NANO_SYLLABUS_TOKEN</code> is set. Elsewhere, add it as a remote MCP server with the header:</p>
      <CopyBlock text={'Authorization: Bearer nst_…'} />
      <p className="muted small">
        Tools: <code>guide</code>, <code>list_courses</code>, <code>get_course_files</code>, <code>check_course</code>, <code>submit_course</code>, <code>submission_status</code>.
        Large videos are easier to send with Claude Code and <code>ns push</code>.
      </p>

      <h2 id="faq">Questions</h2>
      <details className="card"><summary>Do I need to know how to code?</summary><p>No. You describe what you want; Claude writes the files, runs the checks and fixes errors. You review the lessons in the preview, like a student would.</p></details>
      <details className="card"><summary>Who owns the course?</summary><p>You do. Only you (and our admins) can push updates to a course you created. Your name is on it.</p></details>
      <details className="card"><summary>How big can videos be?</summary><p>Up to 500 MB each, but aim for under 200 MB (720p is plenty). Ask Claude to shrink a big video; it uses ffmpeg if you have it installed.</p></details>
      <details className="card"><summary>Can I work on several courses?</summary><p>Yes. Keep them in the same folder; push one at a time (<i>"push the physics course"</i>).</p></details>
      <details className="card"><summary>Can I charge for my course?</summary><p>Not yet. Teacher courses are free for students while we start; talk to us if you want to offer a paid course.</p></details>
      <details className="card"><summary>Something doesn't work.</summary><p>Ask Claude <i>"what went wrong?"</i> first; the toolkit's messages say what to fix. Otherwise contact the Nano Syllabus team with your submission number.</p></details>
    </main>
  );
}
