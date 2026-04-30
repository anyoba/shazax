import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

export default function ProtectedRoute({ element }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-gray-900">
        <div className="animate-pulse rounded-3xl border border-gray-200/50 bg-white/90 px-6 py-4 text-center shadow-lg">
          Loading secure content...
        </div>
      </div>
    );
  }

  return isSignedIn ? element : <Navigate to="/auth" replace />;
}
