import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react'
import { trackPageVisit } from './analytics';
import { useResources } from './hooks/useResources';
import { useAuth, useUser } from '@clerk/clerk-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { createResource, deleteResource } from './services/resourcesApi';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LearnPage from './pages/LearnPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import { USER_ROLES } from './constants/roles';

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageVisit(`${location.pathname}${location.search}`).catch((error) => {
      console.error('Failed to track analytics visit', error);
    });
  }, [location.pathname, location.search]);

  return null;
}

export default function App() {
  const { resources } = useResources();
  const { getToken } = useAuth();
  const { user } = useUser();

  async function addAdminResource(resource) {
    return createResource(resource, getToken);
  }

  async function deleteAdminResource(resourceId) {
    return deleteResource(resourceId, getToken);
  }

  useEffect(() => {
    if (!user) return;

    const userData = {
      id: user.id,
      fullName: user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'Student',
      email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    if (user.profileImageUrl) {
      userData.profileImageUrl = user.profileImageUrl;
    }

    setDoc(doc(db, 'users', user.id), userData, { merge: true }).catch((error) => {
      console.error('Unable to sync Clerk user to Firestore', error);
    });
  }, [user]);

  return (
    <>
      <AnalyticsTracker />
      <Analytics />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/learn" element={<ProtectedRoute element={<LearnPage resources={resources} />} />} />
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  USER_ROLES.MODERATOR,
                  USER_ROLES.EDITOR,
                  USER_ROLES.ADMIN,
                  USER_ROLES.OWNER,
                ]}
              >
                <AdminPage
                  resources={resources}
                  onAddResource={addAdminResource}
                  onDeleteResource={deleteAdminResource}
                />
              </RoleProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </>
  );
}
