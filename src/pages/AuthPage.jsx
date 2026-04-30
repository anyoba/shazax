import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, LogIn } from 'lucide-react';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to landing page
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/5 p-8 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-10">
          <div className="mb-10 flex flex-col gap-4 text-center sm:gap-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-white">
              <Lock size={28} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">Authentication</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-100 sm:text-5xl">
                Continue with Google or create your account
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                Sign up or sign in with Clerk and get instant access to the live Learn page.
              </p>
            </div>
          </div>

          <SignedIn>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center text-slate-100 shadow-inner shadow-black/20">
              <p className="text-lg font-semibold">You are already signed in.</p>
              <p className="mt-3 text-sm text-slate-400">Continue to the Learn page to access live resources.</p>
              <Link
                to="/learn"
                className="mt-6 inline-flex rounded-full bg-primary px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
              >
                Go to Learn Page
              </Link>
            </div>
          </SignedIn>

          <SignedOut>
            <div className="grid gap-4 sm:grid-cols-2">
              <SignInButton mode="modal" redirectUrl="/learn">
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 rounded-3xl border border-white/10 bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:border-primary hover:bg-slate-900"
                >
                  <LogIn size={18} />
                  Continuer avec Google
                </button>
              </SignInButton>

              <SignUpButton mode="modal" redirectUrl="/learn">
                <button
                  type="button"
                  className="rounded-3xl bg-primary px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-primary/90"
                >
                  Sign up / Sign in
                </button>
              </SignUpButton>
            </div>

            <div className="mt-10 rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-slate-300">
              <p className="text-sm leading-6">
                Use the Google option to sign in immediately, or choose the sign up flow to create an account and access the Learn page directly.
              </p>
            </div>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
