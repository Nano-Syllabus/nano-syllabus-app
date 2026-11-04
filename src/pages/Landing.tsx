import { Link } from 'react-router-dom';
import { CardSkeletons, CourseCard } from '../components/bits';
import { useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { SITE, SITE_DESCRIPTION, useSeo } from '../lib/seo';
import type { CourseCard as Card } from '../lib/types';

export default function Landing() {
  const { user } = useAuth();
  const { data } = useQuery<{ courses: Card[] }>('courses', '/api/courses');
  useSeo({
    title: `${SITE} — learn your syllabus, one short lesson at a time`,
    description: SITE_DESCRIPTION,
    path: '/',
    jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE, url: location.origin + '/' },
  });

  return (
    <main>
      <section className="hero container">
        <h1>Learn your syllabus, one short lesson at a time</h1>
        <p className="lead">
          Animated video lessons and interactive explainers that follow your university syllabus topic by topic,
          with model answers to real past exam questions.
        </p>
        <div className="row" style={{ marginTop: 24 }}>
          <Link to="/courses" className="btn btn-primary btn-lg">Browse courses</Link>
          {!user && <Link to="/signup" className="btn btn-lg">Create a free account</Link>}
          {user && <Link to="/app" className="btn btn-lg">Continue learning</Link>}
        </div>
      </section>

      <section className="container">
        <div className="features">
          <div className="card">
            <h3>Made from your syllabus</h3>
            <p className="muted small">Every course follows the official units, so you study exactly what the exam covers.</p>
          </div>
          <div className="card">
            <h3>Short and clear</h3>
            <p className="muted small">Each lesson explains one idea in a few minutes, in simple language with English technical terms.</p>
          </div>
          <div className="card">
            <h3>Exam-ready answers</h3>
            <p className="muted small">Finish each topic with a model answer written the way examiners want to read it.</p>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 56 }}>
        <div className="row" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Courses</h2>
          <span className="spacer" />
          <Link to="/courses" className="small">See all</Link>
        </div>
        {data ? (
          <div className="grid">
            {data.courses.slice(0, 6).map((c) => <CourseCard key={c.slug} c={c} />)}
          </div>
        ) : (
          <CardSkeletons />
        )}
      </section>
    </main>
  );
}
