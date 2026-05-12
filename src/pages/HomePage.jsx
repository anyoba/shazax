import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, animate, motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Book,
  BrainCircuit,
  CheckCircle,
  CheckCircle2,
  Heart,
  Loader2,
  Mail,
  Play,
  Star,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import logo from '../assets/he.png';
import { addEmail } from '../waitlist';


function WaitlistModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email) return;

  setStatus('loading');

  try {
    await addEmail(email);
    setStatus('success');
    setEmail('');
  } catch (err) {
    setStatus('error');
  }
}
  function handleClose() {
    onClose();
    window.setTimeout(() => {
      setEmail('');
      setStatus('idle');
    }, 400);
  }

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            data-testid="waitlist-modal-backdrop"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
              className="relative w-full max-w-sm rounded-3xl border border-border bg-background p-8 shadow-2xl pointer-events-auto"
              data-testid="modal-waitlist"
            >
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                data-testid="button-close-waitlist"
              >
                <X size={18} />
              </button>

              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-4 text-center"
                  >
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckCircle size={36} />
                    </div>
                    <h2 className="mb-2 font-heading text-2xl font-black">You&apos;re on the list!</h2>
                    <p className="font-medium text-muted-foreground">
                      We&apos;ll notify you when Shazaxx launches any{' '}
                      <span className="font-bold text-foreground">Update</span>
                    </p>
                    <button
                      onClick={handleClose}
                      className="mt-8 w-full rounded-xl bg-primary py-3 text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Got it!
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="form">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Mail size={28} />
                    </div>
                    <h2 className="mb-2 font-heading text-2xl font-black">Join the Waitlist</h2>
                    <p className="mb-6 font-medium text-muted-foreground">
                      Be first to know when we launch any{' '}
                      <span className="font-bold text-foreground">Update</span>
                    </p>
                   <form onSubmit={handleSubmit} className="flex flex-col gap-3">
  <div className="relative">
    <Mail
      size={16}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
    />
    <input
      type="email"
      name="email" // ✅ IMPORTANT pour Formspree
      value={email}
      onChange={(event) => setEmail(event.target.value)}
      placeholder="your@email.com"
      required
      data-testid="input-waitlist-email"
      className="w-full rounded-xl border border-border bg-secondary/50 py-3.5 pl-10 pr-4 font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
    />
  </div>

  <button
    type="submit"
    disabled={status === "loading"}
    data-testid="button-waitlist-submit"
    className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 disabled:scale-100 disabled:opacity-70"
  >
    {status === "loading" ? (
      <>
        <Loader2 size={18} className="animate-spin" /> Joining...
      </>
    ) : (
      <>
        Notify Me <ArrowRight size={18} />
      </>
    )}
  </button>

  {/* ✅ feedback utilisateur */}
  {status === "success" && (
    <p className="text-green-500 font-semibold">
      🚀 You're on the waitlist!
    </p>
  )}

  {status === "error" && (
    <p className="text-red-500 font-semibold">
      Something went wrong. Try again.
    </p>
  )}
</form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function InteractiveDemo() {
  const [angle, setAngle] = useState(45);
  const [ballT, setBallT] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [result, setResult] = useState(null);
  const animControls = useRef(null);

  const V2_OVER_G = 75;
  const radians = (angle * Math.PI) / 180;
  const range = V2_OVER_G * Math.sin(2 * radians);
  const SCALE = 1.8;

  function getPos(time) {
    const xPhys = range * time;
    const yPhys = range * Math.tan(radians) * time * (1 - time);
    return { x: 10 + xPhys, y: 90 - yPhys * SCALE };
  }

  const steps = 60;
  const pathPoints = Array.from({ length: steps + 1 }, (_, index) => {
    const { x, y } = getPos(index / steps);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const pathD = pathPoints.map((point, index) => (index === 0 ? `M${point}` : `L${point}`)).join(' ');

  const landX = 10 + range;
  const hitTarget = Math.abs(landX - 85) < 6;
  const ballPos = getPos(ballT);

  function launch() {
    if (animating) return;
    if (animControls.current) animControls.current.stop();
    setResult(null);
    setAnimating(true);
    setBallT(0);

    animControls.current = animate(0, 1, {
      duration: 1.6,
      ease: 'linear',
      onUpdate: (value) => setBallT(value),
      onComplete: () => {
        setResult(hitTarget ? 'hit' : 'miss');
        setAnimating(false);
      },
    });
  }

  return (
    <section id="demo" className="relative overflow-hidden bg-secondary/50 px-4 py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="relative z-10 mb-16 text-center">
          <h2 className="mb-6 font-heading text-4xl font-black md:text-5xl">Learn by Doing</h2>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Try a sample interactive challenge. No boring multiple choice, just actual problem
            solving.
          </p>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-border bg-background shadow-2xl">
          <div className="flex h-12 items-center gap-2 border-b border-border bg-muted/50 px-4">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="mx-auto rounded-md bg-background px-8 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              shazaxx.com/learn/physics
            </div>
          </div>

          <div className="flex flex-col items-center gap-12 p-8 md:flex-row md:p-12">
            <div className="flex-1 space-y-6">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Zap size={14} /> Dynamics
              </div>
              <h3 className="font-heading text-3xl font-bold">Calculate the trajectory</h3>
              <p className="text-lg text-muted-foreground">
                Drag the slider to adjust the launch angle until the projectile hits the target.
              </p>

              <div className="space-y-4 pt-6">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-muted-foreground">Launch Angle</span>
                  <span className="text-lg text-primary">{angle}°</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={85}
                  value={angle}
                  onChange={(event) => {
                    setAngle(Number(event.target.value));
                    setResult(null);
                    setBallT(0);
                    if (animControls.current) animControls.current.stop();
                    setAnimating(false);
                  }}
                  disabled={animating}
                  data-testid="input-angle-slider"
                  className="h-3 w-full cursor-pointer appearance-none rounded-full bg-muted outline-none accent-primary"
                />
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>5°</span>
                  <span className={hitTarget ? 'font-bold text-green-500' : 'text-muted-foreground'}>
                    {hitTarget ? 'Perfect angle, this one will hit.' : 'Adjust angle to hit the target'}
                  </span>
                  <span>85°</span>
                </div>

                <AnimatePresence>
                  {result ? (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`rounded-xl border px-4 py-3 text-center text-sm font-bold ${
                        result === 'hit'
                          ? 'border-green-500/20 bg-green-500/10 text-green-600'
                          : 'border-destructive/20 bg-destructive/10 text-destructive'
                      }`}
                    >
                      {result === 'hit' ? 'Direct hit! Great aim!' : 'Missed, try a different angle.'}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <button
                  onClick={launch}
                  disabled={animating}
                  data-testid="button-launch-demo"
                  className="mt-4 w-full rounded-xl bg-foreground py-4 font-bold text-background shadow-lg transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {animating ? 'In flight...' : 'Launch Projectile'}
                </button>
              </div>
            </div>

            <div className="relative aspect-square w-full flex-1 overflow-hidden rounded-3xl border border-primary/10 bg-primary/5">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <line x1="5" y1="90" x2="100" y2="90" stroke="hsl(var(--border))" strokeWidth="1" />
                <rect x="82" y="85" width="10" height="5" fill="hsl(var(--accent))" rx="1" opacity="0.9" />
                <line
                  x1="87"
                  y1="85"
                  x2="87"
                  y2="70"
                  stroke="hsl(var(--accent))"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
                <path
                  d={pathD}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx="10" cy="90" r="3" fill="hsl(var(--foreground))" />
                <motion.circle cx={ballPos.x} cy={ballPos.y} r="4" fill="hsl(var(--primary))" initial={false} />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ name, handle, quote, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="rounded-3xl border border-border bg-card p-8 text-card-foreground transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="mb-6 flex gap-1 text-accent">
        {[...Array(5)].map((_, index) => (
          <Star key={index} size={20} fill="currentColor" />
        ))}
      </div>
      <p className="mb-8 text-lg font-medium leading-relaxed">&quot;{quote}&quot;</p>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
          {name[0]}
        </div>
        <div>
          <div className="font-bold">{name}</div>
          <div className="text-sm text-muted-foreground">{handle}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-background selection:bg-primary selection:text-white">
      <WaitlistModal isOpen={waitlistOpen} onClose={() => setWaitlistOpen(false)} />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30">
        <motion.div style={{ y: y1 }} className="absolute left-10 top-20 text-primary">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 14a8 8 0 0 1 16 0" />
            <path d="M4 14v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
            <path d="M12 14v4" />
            <path d="M12 10V6" />
            <path d="M10 4h4" />
          </svg>
        </motion.div>
        <motion.div style={{ y: y2 }} className="absolute right-20 top-40 text-accent">
          <svg
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </motion.div>
        <div className="absolute left-1/2 top-[20%] h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Shazaxx Logo"
              className="h-10 w-10 rounded-xl shadow-lg shadow-primary/20"
            />
            <span className="font-heading text-2xl font-black tracking-tight">Shazaxx</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#how-it-works"
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#demo"
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              Play Demo
            </a>
            <a
              href="#reviews"
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              Reviews
            </a>
          </nav>
          <button
            onClick={() => navigate('/auth')}
            data-testid="button-nav-login"
            className="rounded-full bg-secondary px-6 py-2.5 text-sm font-bold text-secondary-foreground transition-all hover:bg-secondary/80"
          >
            Log In
          </button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="px-6 pb-20 pt-24 md:pb-32 md:pt-36">
          <div className="container mx-auto max-w-6xl">
            <div className="grid items-center gap-16 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col gap-8"
              >
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/20 px-4 py-2 text-sm font-bold text-accent-foreground">
                  <Zap size={16} className="text-accent-foreground" />
                  <span>The new way to learn STEM</span>
                </div>
                <h1 className="font-heading text-6xl font-black leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
                  Stop Reading.
                  <br />
                  <span className="text-primary">Start Doing.</span>
                </h1>
                <p className="max-w-lg text-xl font-medium leading-relaxed text-muted-foreground">
                  Bridge the gap between lectures and exams. Master FST with organized TD, solutions, and interactive tools for total success.
                </p>
                <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                      <button
  onClick={() => window.location.href = '/auth'}
  data-testid="button-hero-cta"
  className="flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-black text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
>
  Start Learning <ArrowRight size={20} />
</button>
                  <button
                    onClick={() => setWaitlistOpen(true)}
                    data-testid="button-hero-secondary"
                    className="rounded-full border border-border bg-secondary px-8 py-4 text-lg font-bold text-secondary-foreground transition-all hover:bg-secondary/80"
                  >
                    Join Waitlist
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: 'spring' }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-tr from-primary/30 to-accent/30 blur-3xl" />
                <div className="relative mx-auto max-w-md rotate-3 transform overflow-hidden rounded-[2.5rem] border-[6px] border-foreground bg-card p-6 shadow-2xl transition-transform duration-500 hover:rotate-0">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-xl font-black text-primary">
                        ∫
                      </div>
                      <div>
                        <div className="text-sm font-black">Calculus 101</div>
                        <div className="text-xs font-medium text-muted-foreground">Derivatives</div>
                      </div>
                    </div>
                    <div className="rounded-full bg-accent px-3 py-1.5 text-xs font-black text-accent-foreground">
                      Level 4
                    </div>
                  </div>

                  <div className="relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary p-6">
                    <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-bold shadow-sm backdrop-blur">
                      <TrendingUp size={14} className="text-primary" /> 12k
                    </div>
                    <h3 className="mb-6 text-center font-heading text-3xl font-black">
                      Find the slope of
                      <br />y = x² at x = 2
                    </h3>
                    <div className="relative mb-10 h-32 w-full">
                      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
                        <path
                          d="M10,90 L90,90 M10,10 L10,90"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth="2"
                          fill="none"
                          opacity="0.3"
                        />
                        <path
                          d="M10,90 Q50,90 90,10"
                          stroke="hsl(var(--primary))"
                          strokeWidth="4"
                          fill="none"
                          strokeLinecap="round"
                        />
                        <circle cx="65" cy="40" r="5" fill="hsl(var(--accent))" />
                        <path
                          d="M45,70 L85,10"
                          stroke="hsl(var(--accent))"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          fill="none"
                        />
                      </svg>
                    </div>
                    <div className="w-full space-y-3">
                      <button className="w-full rounded-xl border-2 border-border bg-background py-3.5 font-black transition-colors hover:border-primary">
                        A) 2
                      </button>
                      <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary py-3.5 font-black text-primary-foreground shadow-lg">
                        B) 4 <CheckCircle2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-secondary/30 py-12">
          <div className="container mx-auto px-6">
            <div className="flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="font-heading text-5xl font-black text-foreground md:text-6xl">99%</div>
                <div className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                  <Heart size={18} fill="currentColor" /> Positive Feedback from Students
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-24">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-20 text-center"
            >
              <h2 className="mb-6 font-heading text-4xl font-black md:text-6xl">Designed for Focus</h2>
              <p className="mx-auto max-w-2xl text-xl font-medium text-muted-foreground">
                We engineered the ultimate learning loop. Visual, fast, and intensely interactive.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Play,
                  title: 'Courses',
                  desc: 'Concept breakdowns immediately . Complex science simplified into quick, high-impact study sessions.',
                },
                {
                  icon: BrainCircuit,
                  title: 'TD & Solutions',
                  desc: 'See the physics and math come alive. Master exercises through step-by-step logic and clear, fluid animations.',
                },
                {
                  icon: Book,
                  title: 'Exams',
                  desc: 'Challenges for total mastery. Apply your knowledge immediately with real exam problems and instant feedback.',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-3xl border border-border bg-card p-8"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <feature.icon size={28} />
                  </div>
                  <h3 className="mb-3 font-heading text-2xl font-bold">{feature.title}</h3>
                  <p className="font-medium text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <InteractiveDemo />

        <section id="reviews" className="px-6 py-32">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-20 text-center"
            >
              <h2 className="font-heading text-4xl font-black md:text-6xl">
                Students <Heart className="inline text-accent" fill="currentColor" size={48} /> It
              </h2>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              <TestimonialCard
                name="Aya noussi"
                handle="@aya_ol"
                quote="This platform saved me hours of searching. Having the courses, TDs, and exams all in one organized path made my midterm prep twice as fast ."
                delay={0}
              />
              <TestimonialCard
                name="Mohamed"
                handle="@med_ty"
                quote="he 'Level Upgrade' logic is amazing. The detailed solutions explain the 'why' behind the math, helping me move easily from basic exercises to final exams."
                delay={0.1}
              />
              <TestimonialCard
                name="Cristiano Ronalado"
                handle="@CR7"
                quote="The clean structure and step-by-step progressions make complex science modules much less intimidating. It’s now my top resource for every revision session . Suiiiiiiiiii !!"
                delay={0.2}
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 py-24">
          <div className="absolute inset-0 bg-primary" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10 container mx-auto max-w-4xl text-center">
            <h2 className="mb-8 font-heading text-5xl font-black text-primary-foreground md:text-7xl">
              Ready to Upgrade
              <br />
              Your Brain?
            </h2>
            <button
              onClick={() => setWaitlistOpen(true)}
              data-testid="button-final-cta"
              className="inline-flex items-center gap-3 rounded-full bg-accent px-10 py-5 text-xl font-black text-accent-foreground shadow-2xl transition-all hover:scale-105 hover:bg-white hover:text-foreground active:scale-95"
            >
              Get Early Access <Zap size={24} fill="currentColor" />
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-foreground px-6 py-12 text-background">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Shazaxx Logo"
              className="h-8 w-8 rounded-lg"
            />
            <span className="font-heading text-xl font-bold tracking-tight">Shazaxx</span>
          </div>
          <div className="flex gap-6 text-sm font-medium opacity-70">
            <span>© 2025 Shazaxx Inc.</span>
            <a href="#" className="transition-opacity hover:opacity-100">
              Privacy
            </a>
            <a href="#" className="transition-opacity hover:opacity-100">
              Terms
            </a>
            <span className="text-white">
              made by{' '}
              <a
                href="https://www.instagram.com/med_shazaxx/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                med_shazaxx
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
