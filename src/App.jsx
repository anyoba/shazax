import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { trackPageVisit } from './analytics';
import { useResources } from './hooks/useResources';
import AdminPage from './pages/AdminPage';
import HomePage from './pages/HomePage';
import LearnPage from './pages/LearnPage';

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
  const { resources, addResource, removeResource } = useResources();

  return (
    <>
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn" element={<LearnPage resources={resources} />} />
        <Route
          path="/admin"
          element={
            <AdminPage
              resources={resources}
              onAddResource={addResource}
              onDeleteResource={removeResource}
            />
          }
        />
      </Routes>
    </>
  );
}
