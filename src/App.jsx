import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react'
import { trackPageVisit } from './analytics';
import { useResources } from './hooks/useResources';
import { useAuth, useUser } from '@clerk/clerk-react';
import { createResource, deleteResource, updateResource } from './services/resourcesApi';
import { syncCurrentUser } from './services/userApi.js';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LearnPage from './pages/LearnPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import { USER_ROLES } from './constants/roles';

const ConcoursLayout = lazy(() => import('./layouts/ConcoursLayout.jsx'));
const ConcoursDashboardPage = lazy(() => import('./pages/concours/ConcoursDashboardPage.jsx'));
const ContestsPage = lazy(() => import('./pages/concours/ContestsPage.jsx'));
const TrainingSetupPage = lazy(() => import('./pages/concours/TrainingSetupPage.jsx'));
const QuizSessionPage = lazy(() => import('./pages/concours/QuizSessionPage.jsx'));
const QuizResultsPage = lazy(() => import('./pages/concours/QuizResultsPage.jsx'));
const ProgressPage = lazy(() => import('./pages/concours/ProgressPage.jsx'));
const RankingPage = lazy(() => import('./pages/concours/RankingPage.jsx'));
const FavoritesPage = lazy(() => import('./pages/concours/FavoritesPage.jsx'));
const MistakesPage = lazy(() => import('./pages/concours/MistakesPage.jsx'));
const ConcoursProfilePage = lazy(() => import('./pages/concours/ConcoursProfilePage.jsx'));
const ActivationPage = lazy(() => import('./pages/concours/ActivationPage.jsx'));
const SettingsPage = lazy(() => import('./pages/concours/SettingsPage.jsx'));
const ConcoursAdminPage = lazy(() => import('./pages/admin/concours/ConcoursAdminPage.jsx'));
const syncedUsers = new Map();

function LoadingRoute() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-slate-700">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold shadow-soft">
        Chargement...
      </div>
    </div>
  );
}

function concoursRoute(page) {
  return (
    <ProtectedRoute
      element={
        <>
          <UserSync />
          <ConcoursLayout>
            {page}
          </ConcoursLayout>
        </>
      }
    />
  );
}

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/concours') || location.pathname.startsWith('/admin/concours')) {
      return;
    }

    trackPageVisit(`${location.pathname}${location.search}`).catch((error) => {
      console.error('Failed to track analytics visit', error);
    });
  }, [location.pathname, location.search]);

  return null;
}

export default function App() {
  return (
    <>
      <AnalyticsTracker />
      <Analytics />
      <Layout>
        <Suspense fallback={<LoadingRoute />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/learn" element={<LearnRoute />} />
            <Route path="/learn/:institutionSlug" element={<LearnRoute />} />
            <Route path="/learn/:institutionSlug/:programSlug" element={<LearnRoute />} />
            <Route path="/learn/:institutionSlug/:programSlug/:semesterSlug" element={<LearnRoute />} />
            <Route path="/learn/:institutionSlug/:programSlug/:semesterSlug/:moduleSlug" element={<LearnRoute />} />
            <Route path="/concours" element={concoursRoute(<ConcoursDashboardPage />)} />
            <Route path="/concours/concours" element={concoursRoute(<ContestsPage />)} />
            <Route path="/concours/concours/:contestSlug" element={concoursRoute(<ContestsPage />)} />
            <Route path="/concours/training" element={concoursRoute(<TrainingSetupPage />)} />
            <Route path="/concours/session/:sessionId" element={<ProtectedRoute element={<><UserSync /><QuizSessionPage /></>} />} />
            <Route path="/concours/:contestSlug/exam/:attemptId" element={<ProtectedRoute element={<><UserSync /><QuizSessionPage /></>} />} />
            <Route path="/concours/results/:sessionId" element={concoursRoute(<QuizResultsPage />)} />
            <Route path="/concours/:contestSlug/results/:attemptId" element={concoursRoute(<QuizResultsPage />)} />
            <Route path="/concours/progress" element={concoursRoute(<ProgressPage />)} />
            <Route path="/concours/ranking" element={concoursRoute(<RankingPage />)} />
            <Route path="/concours/favorites" element={concoursRoute(<FavoritesPage />)} />
            <Route path="/concours/mistakes" element={concoursRoute(<MistakesPage />)} />
            <Route path="/concours/profile" element={concoursRoute(<ConcoursProfilePage />)} />
            <Route path="/concours/activation" element={concoursRoute(<ActivationPage />)} />
            <Route path="/concours/settings" element={concoursRoute(<SettingsPage />)} />
            <Route path="/concours/:contestSlug" element={concoursRoute(<ContestsPage />)} />
            <Route
              path="/admin/concours/*"
              element={
                <RoleProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
                  <ConcoursAdminPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="/admin" element={<AdminRoute />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}

function UserSync() {
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const cacheKey = JSON.stringify({
      fullName: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || '',
      email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '',
      profileImageUrl: user.profileImageUrl || '',
    });

    if (syncedUsers.get(user.id) === cacheKey) return;
    syncedUsers.set(user.id, cacheKey);

    syncCurrentUser(user, getToken).catch((error) => {
      syncedUsers.delete(user.id);
      console.error('Unable to sync Clerk user to Firestore', error?.message || error);
    });
  }, [getToken, user]);

  return null;
}

function LearnRoute() {
  const { resources } = useResources();

  return (
    <>
      <UserSync />
      <ProtectedRoute element={<LearnPage resources={resources} />} />
    </>
  );
}

function AdminRoute() {
  const { getToken } = useAuth();

  async function addAdminResource(resource) {
    return createResource(resource, getToken);
  }

  async function deleteAdminResource(resourceId) {
    return deleteResource(resourceId, getToken);
  }

  async function restoreAdminResource(resource) {
    const previousStatus =
      resource?.previousStatus && resource.previousStatus !== 'archived'
        ? resource.previousStatus
        : 'published';
    return updateResource(resource.id, { status: previousStatus }, getToken);
  }

  return (
    <>
      <UserSync />
      <RoleProtectedRoute
        allowedRoles={[
          USER_ROLES.MODERATOR,
          USER_ROLES.EDITOR,
          USER_ROLES.ADMIN,
          USER_ROLES.OWNER,
        ]}
      >
        <AdminPage
          onAddResource={addAdminResource}
          onDeleteResource={deleteAdminResource}
          onRestoreResource={restoreAdminResource}
        />
      </RoleProtectedRoute>
    </>
  );
}
