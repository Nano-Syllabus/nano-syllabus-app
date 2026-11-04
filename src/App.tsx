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

export function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="container page" />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:slug" element={<CourseDetail />} />
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="signup" element={<AuthPage mode="signup" />} />
            <Route path="app" element={authed(<AppHome />)} />
            <Route path="app/checkout/:slug" element={authed(<Checkout />)} />
            <Route path="app/payment/result" element={authed(<PaymentResult />)} />
            <Route path="app/courses/:slug/:subject" element={authed(<Subject />)} />
            <Route path="app/watch/:id" element={authed(<Watch />)} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
