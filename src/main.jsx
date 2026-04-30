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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        navigate={handleClerkNavigate}
        afterSignInUrl="/learn"
        afterSignUpUrl="/learn"
      >
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
