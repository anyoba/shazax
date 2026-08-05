import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SignIn, SignUp, SignedIn, SignedOut } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Sparkles, X } from 'lucide-react';

const clerkAppearance = {
  variables: {
    colorPrimary: '#2563eb',
    colorText: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    colorBackground: '#020617',
    colorInputBackground: '#0f172a',
    colorInputText: '#f8fafc',
    borderRadius: '1.2rem',
    fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
  },
  elements: {
    rootBox: 'mx-auto flex w-full justify-center',
    card: 'mx-auto w-full max-w-[420px] border-0 bg-transparent p-0 shadow-none',
    header: 'hidden',
    footer: 'hidden',
    socialButtonsBlockButton:
      'h-12 rounded-2xl border border-blue-300/40 bg-blue-600 text-white text-sm font-black shadow-lg shadow-blue-950/25 transition hover:bg-blue-500',
    socialButtonsBlockButtonText: 'font-black text-white',
    dividerLine: 'bg-blue-200/30',
    dividerText: 'text-blue-100/80 font-bold',
    formFieldLabel: 'sr-only',
    formFieldLabelRow: 'sr-only',
    formFieldHintText: 'hidden',
    formFieldInput:
      'h-12 rounded-2xl border border-blue-200/35 bg-blue-950/50 px-4 text-base font-semibold text-white placeholder:text-blue-50/70 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-400/25',
    formButtonPrimary:
      'h-12 rounded-2xl bg-blue-600 text-base font-black text-white shadow-xl shadow-blue-950/30 transition hover:bg-blue-500 active:scale-[0.99]',
    formFieldAction: 'text-blue-200 font-bold',
    footerActionText: 'text-blue-50/80',
    footerActionLink: 'font-black text-blue-200 hover:text-white',
    identityPreviewText: 'text-blue-50/90',
    identityPreviewEditButton: 'text-blue-200',
    formResendCodeLink: 'text-blue-200 font-bold',
    otpCodeFieldInput: 'border-blue-200/30 bg-blue-950/45 text-white',
    alert: 'rounded-2xl border border-red-400/20 bg-red-500/10 text-red-100',
    formFieldErrorText: 'text-red-300',
  },
};

export default function AuthPage() {
  const [mode, setMode] = useState('signUp');
  const isSignUp = mode === 'signUp';

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] px-4 py-5 text-white sm:px-6 sm:py-8">
      <img
        src="/goodimg.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.16),rgba(7,17,31,0.08)_48%,rgba(11,16,32,0.2)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(37,99,235,0.12),transparent_38%,rgba(14,165,233,0.1))]" />
      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-blue-500/45 to-transparent" />

      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-blue-200/35 bg-blue-600/70 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-500/80 sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} />
        Home
      </Link>

      <Link
        to="/"
        aria-label="Fermer"
        className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-200/35 bg-blue-600/70 text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-500/80 sm:right-6 sm:top-6"
      >
        <X size={20} />
      </Link>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center justify-center pt-14">
        <section className="relative w-full max-w-[580px] bg-transparent">
          <div className="relative rounded-[2.6rem] bg-transparent px-5 py-7 sm:px-9 sm:py-9">
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-500/16 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-sky-400/14 blur-3xl" />

            <div className="relative mx-auto max-w-[500px]">
              <div className="mb-7 flex items-center justify-center">
                <motion.div
                  animate={{ y: [0, -10, 2, 0], rotate: [0, 5, -3, 0] }}
                  transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex origin-center will-change-transform items-center gap-3 rounded-full border border-blue-100/45 bg-blue-500/25 px-4 py-2 shadow-[0_18px_45px_rgba(30,64,175,0.22),inset_0_1px_0_rgba(255,255,255,0.32)] backdrop-blur-md"
                >
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-transparent shadow-lg shadow-blue-950/25">
                    <img
                      src="/he.png"
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-contain mix-blend-screen"
                    />
                  </span>
                  <span className="text-sm font-black tracking-tight text-white drop-shadow">Shazax Learn</span>
                </motion.div>
              </div>

              <SignedIn>
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-950/30">
                    <ShieldCheck size={24} />
                  </div>
                  <h1 className="mt-5 font-heading text-3xl font-black">You are already signed in</h1>
                  <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-6 text-blue-50/90 drop-shadow">
                    Continue to your learning space and pick up where you left off.
                  </p>
                  <Link
                    to="/learn"
                    className="mt-8 inline-flex rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-blue-950/30 transition hover:bg-blue-500"
                  >
                    Go to Learn
                  </Link>
                </div>
              </SignedIn>

              <SignedOut>
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  className="mx-auto w-full rounded-[2.25rem] bg-blue-950/18 p-5 shadow-[0_28px_80px_rgba(8,47,73,0.18)] backdrop-blur-md sm:p-7"
                >
                <div className="mb-7 text-center">
                  <motion.div
                    animate={{ y: [0, -6, 1, 0], rotate: [0, -3, 5, 0] }}
                    transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
                    className="mb-4 inline-flex origin-center will-change-transform items-center gap-2 rounded-full border border-blue-100/45 bg-blue-500/25 px-3 py-1.5 text-xs font-black text-blue-50 shadow-[0_14px_36px_rgba(30,64,175,0.2),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md"
                  >
                    <Sparkles size={14} />
                    Private learning access
                  </motion.div>
                  <h1 className="font-heading text-3xl font-black tracking-tight sm:text-4xl">
                    {isSignUp ? 'Create your account' : 'Welcome back'}
                  </h1>
                  <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-blue-50/90 drop-shadow">
                    {isSignUp
                      ? 'Join Shazax and keep your resources, progress and dashboard in one place.'
                      : 'Sign in to continue your study session.'}
                  </p>
                </div>

                <div className="mx-auto mb-7 grid max-w-[420px] grid-cols-2 rounded-2xl border border-blue-200/35 bg-blue-950/35 p-1">
                  <button
                    type="button"
                    onClick={() => setMode('signUp')}
                    className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                      isSignUp ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-50/85 hover:text-white'
                    }`}
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('signIn')}
                    className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                      !isSignUp ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-50/85 hover:text-white'
                    }`}
                  >
                    Sign in
                  </button>
                </div>

                <div className="mx-auto w-full max-w-[420px]">
                  {isSignUp ? (
                    <SignUp
                      routing="hash"
                      signInUrl="/auth"
                      afterSignUpUrl="/learn"
                      appearance={clerkAppearance}
                    />
                  ) : (
                    <SignIn
                      routing="hash"
                      signUpUrl="/auth"
                      afterSignInUrl="/learn"
                      appearance={clerkAppearance}
                    />
                  )}
                </div>
                </motion.div>
              </SignedOut>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
