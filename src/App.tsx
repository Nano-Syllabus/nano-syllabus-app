import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { NotFound, RequireAuth } from './components/bits';
import Landing from './pages/Landing';

// The landing page ships in the main bundle (first paint for most visitors);
// every other page is its own chunk, fetched on first visit.
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AppHome = lazy(() => import('./pages/AppHome'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentResult = lazy(() => import('./pages/PaymentResult'));
const Subject = lazy(() => import('./pages/Subject'));
const Watch = lazy(() => import('./pages/Watch'));
const TeachGuide = lazy(() => import('./pages/TeachGuide'));
const Teach = lazy(() => import('./pages/Teach'));
const TeachPreview = lazy(() => import('./pages/TeachPreview'));
const Admin = lazy(() => import('./pages/Admin'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const MyCourses = lazy(() => import('./pages/MyCourses'));

function ScrollToTop() {
  const { pathname } = useLocation();
  // Block body on purpose: Chromium now returns a Promise from scrollTo, and
  // React would treat that as the effect's cleanup function and crash.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const authed = (el: JSX.Element) => <RequireAuth>{el}</RequireAuth>;

// The server answers "/" with the pre-rendered landing page (landing.html), not
// this app. So reaching "/" from inside the app is a full page load. Only when
// the app itself was loaded at "/" (vite dev, or a build without landing.html)
// does it show its own Landing.
const BOOTED_AT_HOME = window.location.pathname === '/';
function Home() {
  if (BOOTED_AT_HOME) return <Landing />;
  window.location.assign('/');
  return null;
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="wrap page" />}>
        <Routes>
          {/* Full-screen, as in nano_sylabus: no sidebar or header. */}
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="signup" element={<AuthPage mode="signup" />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:slug" element={<CourseDetail />} />
            <Route path="app" element={authed(<AppHome />)} />
            <Route path="app/courses" element={authed(<MyCourses />)} />
            <Route path="app/checkout/:slug" element={authed(<Checkout />)} />
            <Route path="app/payment/result" element={authed(<PaymentResult />)} />
            <Route path="app/courses/:slug/:subject" element={authed(<Subject />)} />
            <Route path="app/watch/:id" element={authed(<Watch />)} />
            <Route path="teach" element={<TeachGuide />} />
            <Route path="app/teach" element={authed(<Teach />)} />
            <Route path="app/teach/preview/:id" element={authed(<TeachPreview />)} />
            <Route path="app/admin" element={authed(<Admin />)} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
