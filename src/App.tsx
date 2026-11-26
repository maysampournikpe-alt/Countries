import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LinkButton } from './components/ui';
import Home from './pages/Home';

const Diagnostic = lazy(() => import('./pages/Diagnostic'));
const Learn = lazy(() => import('./pages/Learn'));
const Review = lazy(() => import('./pages/Review'));
const Challenges = lazy(() => import('./pages/Challenges'));
const ChallengeMode = lazy(() => import('./pages/ChallengeMode'));
const Detective = lazy(() => import('./pages/Detective'));
const DetectiveGroup = lazy(() => import('./pages/DetectiveGroup'));
const Exam = lazy(() => import('./pages/Exam'));
const Atlas = lazy(() => import('./pages/Atlas'));
const AtlasDetail = lazy(() => import('./pages/AtlasDetail'));
const Practice = lazy(() => import('./pages/Practice'));
const Stats = lazy(() => import('./pages/Stats'));
const Settings = lazy(() => import('./pages/Settings'));

function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 text-ink-soft">This page does not exist. Your progress is safe.</p>
      <LinkButton to="/" className="mt-6">Go to home</LinkButton>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<div className="py-20 text-center text-ink-faint" role="status">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/review" element={<Review />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/challenges/:mode" element={<ChallengeMode />} />
            <Route path="/detective" element={<Detective />} />
            <Route path="/detective/:id" element={<DetectiveGroup />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/atlas" element={<Atlas />} />
            <Route path="/atlas/:code" element={<AtlasDetail />} />
            <Route path="/practice/:code" element={<Practice />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
