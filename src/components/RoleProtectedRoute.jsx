import { Navigate } from 'react-router-dom';
import { Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useUserRole } from '../hooks/useUserRole';
import AccessDenied from './AccessDenied';

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6 text-white">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70 shadow-2xl">
        <Loader2 size={18} className="animate-spin text-primary" />
        Verification des permissions...
      </div>
    </div>
  );
}

function RoleErrorState({ error, onRetry }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
          <ShieldAlert size={26} />
        </div>
        <h1 className="text-2xl font-bold">Role indisponible</h1>
        <p className="mt-3 text-sm leading-6 text-red-100/70">
          {error || 'Impossible de verifier vos permissions pour le moment.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-950 transition hover:bg-white/90"
        >
          <RefreshCw size={16} />
          Reessayer
        </button>
      </div>
    </div>
  );
}

export default function RoleProtectedRoute({ allowedRoles, children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { loading, error, hasRole, refetch } = useUserRole();

  if (!isLoaded || loading) {
    return <LoadingState />;
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  if (error) {
    return <RoleErrorState error={error} onRetry={refetch} />;
  }

  if (!hasRole(allowedRoles)) {
    return <AccessDenied />;
  }

  return children;
}
