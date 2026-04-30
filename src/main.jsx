import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const clerkPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.VITE_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  console.error(
    'Missing Clerk publishable key. Set VITE_CLERK_PUBLISHABLE_KEY in your .env file.',
  );
}

function handleClerkNavigate(to) {
  window.history.pushState(null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

const rootElement = document.getElementById('root');

const appElement = (
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          navigate={handleClerkNavigate}
          afterSignInUrl="/learn"
          afterSignUpUrl="/learn"
        >
          <App />
        </ClerkProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

const missingKeyElement = (
  <React.StrictMode>
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-center shadow-2xl">
          <h1 className="mb-4 text-3xl font-bold">Clerk is not configured</h1>
          <p className="text-sm text-slate-300">
            The app requires a Clerk publishable key to render correctly.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            Please set <code className="rounded bg-slate-800 px-2 py-1">VITE_CLERK_PUBLISHABLE_KEY</code> in your Vercel environment variables.
          </p>
        </div>
      </div>
    </ErrorBoundary>
  </React.StrictMode>
);

ReactDOM.createRoot(rootElement).render(
  clerkPublishableKey ? appElement : missingKeyElement,
);
