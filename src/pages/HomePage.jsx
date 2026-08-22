import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
import BrandLogo from '../components/BrandLogo';
import { addEmail } from '../waitlist';

gsap.registerPlugin(ScrollTrigger);

const pageMotifs = [
  { left: '6%', top: '18%', size: 18, color: 'hsl(var(--primary) / 0.45)', x: '8px', y: '-10px', delay: 0 },
  { left: '87%', top: '20%', size: 14, color: 'rgba(255, 200, 18, 0.55)', x: '-9px', y: '7px', delay: 0.5 },
  { left: '12%', top: '58%', size: 11, color: 'rgba(8, 145, 178, 0.38)', x: '7px', y: '9px', delay: 0.25 },
  { left: '78%', top: '68%', size: 20, color: 'hsl(var(--primary) / 0.34)', x: '-7px', y: '-12px', delay: 0.7 },
  { left: '45%', top: '12%', size: 10, color: 'rgba(255, 200, 18, 0.45)', x: '10px', y: '6px', delay: 0.95 },
];

const ctaTopMarks = [
  { left: '16%', top: '23%', size: 28, x: '5px', y: '-8px' },
  { left: '84%', top: '23%', size: 28, x: '-6px', y: '9px' },
];

const finalTitleMotion = {
  'Ready to Upgrade': {
    up: [9, 14],
    down: [0, 6],
  },
  'Your Brain?': {
    up: [1, 8],
    down: [0, 5],
  },
};

function MotifCross({ left, top, bottom, size, color = 'rgba(255,255,255,0.6)', x = '6px', y = '-8px', delay = 0 }) {
  return (
    <span
      className="shazax-motif-cross absolute block"
      style={{
        left,
        top,
        bottom,
        width: size,
        height: size,
        color,
        animationDelay: `${delay}s`,
        '--motif-x': x,
        '--motif-y': y,
      }}
    >
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 rounded-full bg-current" />
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 rounded-full bg-current" />
    </span>
  );
}

function AnimatedTitleLetter({ char, direction, delay }) {
  if (char === ' ') {
    return <span className="inline-block w-[0.28em]" aria-hidden="true" />;
  }

  if (!direction) {
    return <span className="inline-block">{char}</span>;
  }

  return (
    <span
      className={`shazax-title-letter shazax-title-letter-${direction}`}
      style={{ '--letter-delay': `${delay}s` }}
    >
      <span className="shazax-title-letter-track">
        <span>{char}</span>
        <span>{char}</span>
      </span>
    </span>
  );
}

function WaterCursorLayer() {
  const layerRef = useRef(null);
  const canvasRef = useRef(null);

  useLayoutEffect(() => {
    const layer = layerRef.current;
    const canvas = canvasRef.current;
    if (!layer || !canvas) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    const trail = [];
    let dpr = 1;
    let frameId = 0;
    let previousFrameAt = performance.now();
    let lastMoveAt = 0;
    let lastPointer = null;

    function resizeCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.ceil(window.innerWidth * dpr);
      canvas.height = Math.ceil(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function addTrailPoint(x, y, speed, now) {
      trail.push({
        x,
        y,
        age: 0,
        life: 560 + Math.min(speed * 1.45, 260),
        width: Math.max(7, Math.min(30, 10 + speed * 0.07)),
        wobble: Math.random() * Math.PI * 2,
      });

      if (trail.length > 48) {
        trail.splice(0, trail.length - 48);
      }
    }

    function scheduleRender() {
      if (!frameId) {
        frameId = window.requestAnimationFrame(render);
      }
    }

    function handlePointerMove(event) {
      if (event.pointerType === 'touch') return;

      const now = performance.now();
      const nextPointer = { x: event.clientX, y: event.clientY, time: now };

      if (lastPointer && now - lastPointer.time > 180) {
        lastPointer = null;
      }

      if (!lastPointer) {
        addTrailPoint(nextPointer.x, nextPointer.y, 0, now);
        lastPointer = nextPointer;
        lastMoveAt = now;
        scheduleRender();
        return;
      }

      const deltaX = nextPointer.x - lastPointer.x;
      const deltaY = nextPointer.y - lastPointer.y;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance < 2) return;

      const elapsed = Math.max(16, now - lastPointer.time);
      const speed = distance / elapsed * 16.67;
      const steps = Math.max(1, Math.min(4, Math.ceil(distance / 24)));

      for (let step = 1; step <= steps; step += 1) {
        const progress = step / steps;
        addTrailPoint(
          lastPointer.x + deltaX * progress,
          lastPointer.y + deltaY * progress,
          speed,
          now,
        );
      }

      lastPointer = nextPointer;
      lastMoveAt = now;
      scheduleRender();
    }

    function drawStroke(points, {
      color,
      widthScale = 1,
      alphaScale = 1,
      blur = 0,
      offset = 0,
      wave = 0,
      composite = 'source-over',
    }) {
      if (points.length < 2) return;

      context.save();
      context.globalCompositeOperation = composite;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      if (blur) {
        context.shadowBlur = blur;
        context.shadowColor = color;
      }

      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const point = points[index];
        const fade = Math.max(0, 1 - point.age / point.life);
        if (fade <= 0.01) continue;

        const angle = Math.atan2(point.y - previous.y, point.x - previous.x);
        const normalX = Math.cos(angle + Math.PI / 2);
        const normalY = Math.sin(angle + Math.PI / 2);
        const shimmer = Math.sin(point.wobble + point.age * 0.028 + index * 0.62) * wave;
        const lineWidth = Math.max(1, point.width * widthScale * fade);
        const alpha = Math.min(1, Math.pow(fade, 1.45) * alphaScale);

        context.globalAlpha = alpha;
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.beginPath();
        context.moveTo(previous.x + normalX * (offset + shimmer), previous.y + normalY * (offset + shimmer));
        context.quadraticCurveTo(
          previous.x * 0.45 + point.x * 0.55 + normalX * (offset - shimmer * 0.35),
          previous.y * 0.45 + point.y * 0.55 + normalY * (offset - shimmer * 0.35),
          point.x + normalX * (offset + shimmer),
          point.y + normalY * (offset + shimmer),
        );
        context.stroke();
      }

      context.restore();
    }

    function render(now) {
      frameId = 0;
      const delta = Math.min(48, now - previousFrameAt);
      previousFrameAt = now;
      const idleFor = now - lastMoveAt;
      const activeAmount = trail.length
        ? Math.max(0, Math.min(1, 1 - Math.max(idleFor - 520, 0) / 900))
        : 0;

      layer.style.setProperty('--water-active', activeAmount.toFixed(3));
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let index = trail.length - 1; index >= 0; index -= 1) {
        trail[index].age += delta;
        if (trail[index].age >= trail[index].life) {
          trail.splice(index, 1);
        }
      }

      if (!trail.length) {
        layer.style.setProperty('--water-active', '0');
        return;
      }

      if (trail.length > 1) {
        const visibleTrail = trail.slice(-42);
        drawStroke(visibleTrail, {
          color: 'rgba(71, 54, 142, 0.12)',
          widthScale: 1.72,
          alphaScale: 0.54,
        });
        drawStroke(visibleTrail, {
          color: 'rgba(217, 226, 255, 0.48)',
          widthScale: 0.86,
          alphaScale: 0.86,
        });
        drawStroke(visibleTrail, {
          color: 'rgba(93, 92, 255, 0.34)',
          widthScale: 0.16,
          alphaScale: 0.62,
          offset: 7,
          wave: 3.6,
          composite: 'lighter',
        });
        drawStroke(visibleTrail, {
          color: 'rgba(255, 166, 94, 0.26)',
          widthScale: 0.1,
          alphaScale: 0.42,
          offset: -8,
          wave: 3.2,
          composite: 'lighter',
        });
        drawStroke(visibleTrail, {
          color: 'rgba(255, 255, 255, 0.88)',
          widthScale: 0.055,
          alphaScale: 0.58,
          offset: -1.5,
          wave: 2.6,
          composite: 'lighter',
        });
      }

      if (trail.length) {
        scheduleRender();
      }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return (
    <div ref={layerRef} className="shazax-water-trail-layer absolute inset-0">
      <canvas ref={canvasRef} className="shazax-water-trail-canvas" aria-hidden="true" />
    </div>
  );
}

function PageMotifLayer() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[12] overflow-hidden" aria-hidden="true">
      <div className="shazax-page-grid absolute inset-0" />
      <WaterCursorLayer />
      {pageMotifs.map((motif) => (
        <MotifCross key={`${motif.left}-${motif.top}`} {...motif} />
      ))}
    </div>
  );
}

function FinalCtaSection({ onOpenWaitlist }) {
  const titleLines = [
    'Ready to Upgrade',
    'Your Brain?',
  ];

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#3a00d4] px-4 pb-0 text-white sm:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#4b12ef_0%,#3700c9_47%,#2f00bd_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:96px_96px] opacity-25" />

      <div className="relative z-20 mx-auto max-w-[92rem] pt-[18vh] text-center md:pt-[19vh]">
        <p className="mb-10 text-sm font-medium uppercase tracking-[0.08em] text-white/86 md:text-lg">
          IS YOUR SUCCESS READY TO GO WILD ?
        </p>
        <h2
          className="relative inline-block font-heading text-[clamp(3.45rem,10vw,10.6rem)] font-black leading-[0.96] tracking-normal text-white"
          aria-label={titleLines.join(' ')}
        >
          {titleLines.map((line, index) => (
            <motion.span
              key={line}
              initial={{ opacity: 0, y: 80, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.55 }}
              transition={{ delay: index * 0.12, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="block"
              aria-hidden="true"
            >
              <span className="inline-block [text-shadow:0_22px_64px_rgba(18,0,82,0.24)]">
                {Array.from(line).map((char, charIndex) => {
                  const motionConfig = finalTitleMotion[line];
                  const direction = motionConfig?.up.includes(charIndex)
                    ? 'up'
                    : motionConfig?.down.includes(charIndex)
                      ? 'down'
                      : null;

                  return (
                    <AnimatedTitleLetter
                      key={`${line}-${char}-${charIndex}`}
                      char={char}
                      direction={direction}
                      delay={2.05 + index * 0.35 + charIndex * 0.045}
                    />
                  );
                })}
              </span>
              <motion.span
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.55 }}
                transition={{ delay: 1.04 + index * 0.16, duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                className={`mx-auto mt-3 block h-[0.065em] origin-left bg-white/90 shadow-[0_0_26px_rgba(255,255,255,0.46)] md:mt-4 ${
                  index === 0 ? 'w-full' : 'w-[62%]'
                }`}
              />
            </motion.span>
          ))}
        </h2>
      </div>

      {ctaTopMarks.map((mark, index) => (
        <MotifCross
          key={`${mark.left}-${mark.top}`}
          left={mark.left}
          top={mark.top}
          size={mark.size}
          color="rgba(255,255,255,0.88)"
          x={mark.x}
          y={mark.y}
          delay={index * 0.18}
        />
      ))}

      <div className="absolute bottom-[9vh] left-1/2 z-30 -translate-x-1/2">
        <motion.button
          onClick={onOpenWaitlist}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          data-testid="button-final-cta"
          className="inline-flex w-[min(26rem,calc(100vw-2rem))] items-center justify-between gap-5 rounded-full bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.04em] text-slate-950 shadow-[0_12px_34px_rgba(10,0,70,0.34),inset_0_0_16px_rgba(75,0,180,0.12)] transition-all hover:scale-105 hover:bg-white active:scale-95 sm:px-9 sm:py-5 sm:text-base"
        >
          <BrainCircuit size={23} strokeWidth={2.5} />
          <span>Get Early Access Now</span>
          <Zap size={23} strokeWidth={2.5} fill="currentColor" />
        </motion.button>
      </div>
    </section>
  );
}


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
                    <motion.button
                      onClick={handleClose}
                      whileTap={{ scale: 0.97 }}
                      className="mt-8 w-full rounded-xl bg-primary py-3 text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Got it!
                    </motion.button>
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

  <motion.button
    type="submit"
    disabled={status === "loading"}
    whileTap={{ scale: status === "loading" ? 1 : 0.96 }}
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
  </motion.button>

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

                <motion.button
                  onClick={launch}
                  disabled={animating}
                  whileTap={{ scale: animating ? 1 : 0.97 }}
                  data-testid="button-launch-demo"
                  className="mt-4 w-full rounded-xl bg-foreground py-4 font-bold text-background shadow-lg transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {animating ? 'In flight...' : 'Launch Projectile'}
                </motion.button>
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

const focusFeatures = [
  {
    icon: Play,
    title: 'Courses',
    desc: 'Short visual lessons that turn dense concepts into clear study moves.',
    backLabel: 'LEARN',
    backText: 'From first idea to confident understanding.',
    backItems: ['Visual courses', 'Fast explanations', 'Module roadmap'],
  },
  {
    icon: BrainCircuit,
    title: 'TD & Solutions',
    desc: 'Step-by-step practice that shows the logic behind every exercise.',
    backLabel: 'PRACTICE',
    backText: 'Solve, compare, and understand the method.',
    backItems: ['Guided TDs', 'Clear solutions', 'Reasoning steps'],
  },
  {
    icon: Book,
    title: 'Exams',
    desc: 'Real challenges that help you test speed, accuracy, and mastery.',
    backLabel: 'MASTER',
    backText: 'Train with exam-style pressure and feedback.',
    backItems: ['Exam problems', 'Timed practice', 'Instant feedback'],
  },
];

const focusCurvePaths = [
  {
    from: 'M 126 330 C 330 330 470 330 654 330',
    to: 'M 126 330 C 330 145 470 185 654 286',
  },
  {
    from: 'M 374 110 C 610 110 840 110 1066 110',
    to: 'M 374 110 C 620 250 842 250 1066 126',
  },
  {
    from: 'M 760 386 C 965 386 1130 386 1318 386',
    to: 'M 760 386 C 940 220 1116 218 1318 320',
  },
];

function FocusSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const innerRefs = useRef([]);
  const iconRefs = useRef([]);
  const curveRefs = useRef([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      const cards = cardRefs.current.filter(Boolean);
      const inners = innerRefs.current.filter(Boolean);
      const curves = curveRefs.current.filter(Boolean);
      curves.forEach((curve, index) => {
        curve.setAttribute('d', focusCurvePaths[index].to);
        const length = curve.getTotalLength();
        gsap.set(curve, { autoAlpha: 0.36, strokeDasharray: length, strokeDashoffset: 0 });
      });
      gsap.set([titleRef.current, ...cards], { clearProps: 'all' });
      gsap.set(inners, { rotateY: 180 });
      return undefined;
    }

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean);
      const inners = innerRefs.current.filter(Boolean);
      const icons = iconRefs.current.filter(Boolean);
      const curves = curveRefs.current.filter(Boolean);

      curves.forEach((curve, index) => {
        curve.setAttribute('d', focusCurvePaths[index].from);
        const length = curve.getTotalLength();
        gsap.set(curve, { autoAlpha: 0, strokeDasharray: length, strokeDashoffset: length });
      });
      gsap.set(titleRef.current, { autoAlpha: 0, y: 34 });
      gsap.set(inners, { transformStyle: 'preserve-3d', transformOrigin: '50% 50%', rotateY: 0 });
      gsap.set(cards, { transformOrigin: '50% 50%', transformStyle: 'preserve-3d' });

      mm.add('(min-width: 1024px)', () => {
        gsap.set(stageRef.current, { perspective: 1400 });
        gsap.set(cards[0], { x: '124%', y: 18, z: 15, rotateX: 0, rotateY: -5, rotateZ: -11, scale: 0.98 });
        gsap.set(cards[1], { x: 0, y: 0, z: 90, rotateX: 0, rotateY: 0, rotateZ: 1, scale: 1 });
        gsap.set(cards[2], { x: '-124%', y: 14, z: 45, rotateX: 0, rotateY: 5, rotateZ: 10, scale: 0.98 });

        gsap.to(inners, {
          y: (index) => [-6, 4, -5][index],
          duration: (index) => [2.8, 3.2, 2.95][index],
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.12,
        });

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=2800',
            scrub: 1.2,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        tl.addLabel('intro')
          .to(titleRef.current, { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power3.out' }, 0)
          .addLabel('shuffle', 0.28)
          .to(cards[0], { x: '96%', y: 6, z: 55, rotateX: 0, rotateY: -8, rotateZ: -16, duration: 0.62, ease: 'power2.inOut' }, 'shuffle')
          .to(cards[1], { x: 0, y: -8, z: 140, rotateX: 0, rotateY: 0, rotateZ: 1, duration: 0.62, ease: 'power2.inOut' }, 'shuffle+=0.04')
          .to(cards[2], { x: '-96%', y: 8, z: 70, rotateX: 0, rotateY: 8, rotateZ: 15, duration: 0.62, ease: 'power2.inOut' }, 'shuffle+=0.08')
          .to(curves[0], { attr: { d: focusCurvePaths[0].to }, strokeDashoffset: 0, autoAlpha: 0.44, duration: 0.72, ease: 'power2.inOut' }, 'shuffle+=0.06')
          .to(icons, { scale: 1.1, rotateZ: 8, boxShadow: '0 0 0 10px rgba(255,255,255,0.08)', duration: 0.42, stagger: 0.06, ease: 'power2.out' }, 'shuffle+=0.08')
          .addLabel('deal', 0.92)
          .to(cards[0], { x: 0, y: 6, z: 85, rotateX: 0, rotateY: 0, rotateZ: -7, duration: 0.82, ease: 'power2.inOut' }, 'deal')
          .to(cards[1], { x: 0, y: -16, z: 165, rotateX: 0, rotateY: 0, rotateZ: 0, duration: 0.82, ease: 'power2.inOut' }, 'deal+=0.06')
          .to(cards[2], { x: 0, y: 6, z: 85, rotateX: 0, rotateY: 0, rotateZ: 7, duration: 0.82, ease: 'power2.inOut' }, 'deal+=0.12')
          .to(curves[1], { attr: { d: focusCurvePaths[1].to }, strokeDashoffset: 0, autoAlpha: 0.38, duration: 0.78, ease: 'power2.inOut' }, 'deal+=0.02')
          .addLabel('turn', 1.72)
          .to(cards[0], { x: 0, y: 2, z: 105, rotateX: 0, rotateY: 0, rotateZ: -5, duration: 0.82, ease: 'power2.inOut' }, 'turn')
          .to(cards[1], { x: 0, y: -18, z: 190, rotateX: 0, rotateY: 0, rotateZ: 0, duration: 0.82, ease: 'power2.inOut' }, 'turn+=0.1')
          .to(cards[2], { x: 0, y: 2, z: 105, rotateX: 0, rotateY: 0, rotateZ: 5, duration: 0.82, ease: 'power2.inOut' }, 'turn+=0.2')
          .to(curves[2], { attr: { d: focusCurvePaths[2].to }, strokeDashoffset: 0, autoAlpha: 0.34, duration: 0.78, ease: 'power2.inOut' }, 'turn+=0.1')
          .addLabel('flip', 2.18)
          .to(inners, { rotateY: 180, duration: 0.82, stagger: 0.08, ease: 'power2.inOut' }, 'flip')
          .addLabel('frontFan', 2.86)
          .to(cards[0], { x: 0, y: 4, z: 90, rotateX: 0, rotateY: 0, rotateZ: -6, scale: 1, duration: 0.86, ease: 'power2.inOut' }, 'frontFan')
          .to(cards[1], { x: 0, y: -18, z: 185, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1.035, duration: 0.86, ease: 'power2.inOut' }, 'frontFan+=0.04')
          .to(cards[2], { x: 0, y: 4, z: 90, rotateX: 0, rotateY: 0, rotateZ: 6, scale: 1, duration: 0.86, ease: 'power2.inOut' }, 'frontFan+=0.08')
          .addLabel('settle', 3.72)
          .to(cards[0], { x: 0, y: 2, z: 70, rotateX: 0, rotateY: 0, rotateZ: -4, scale: 1, duration: 0.78, ease: 'power2.inOut' }, 'settle')
          .to(cards[1], { x: 0, y: -10, z: 155, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1.03, duration: 0.78, ease: 'power2.inOut' }, 'settle+=0.04')
          .to(cards[2], { x: 0, y: 2, z: 70, rotateX: 0, rotateY: 0, rotateZ: 4, scale: 1, duration: 0.78, ease: 'power2.inOut' }, 'settle+=0.08')
          .addLabel('exit', 4.72)
          .to(curves, { autoAlpha: 0.18, duration: 0.5, stagger: 0.04, ease: 'power2.inOut' }, 'exit')
          .to(cards, { y: (index) => [4, -8, 4][index], z: (index) => [55, 140, 55][index], scale: (index) => (index === 1 ? 1.02 : 0.99), duration: 0.58, stagger: 0.03, ease: 'power2.inOut' }, 'exit')
          .to(icons, { scale: 1, rotateZ: 0, boxShadow: '0 0 0 0 rgba(255,255,255,0)', duration: 0.45, stagger: 0.04, ease: 'power2.inOut' }, 'exit+=0.05');
      });

      mm.add('(max-width: 1023px)', () => {
        const cardTilts = [-3, 0, 3];
        gsap.set(cards, { autoAlpha: 0, y: 46, rotateZ: (index) => cardTilts[index], scale: 0.96 });
        gsap.set(inners, { rotateY: 0 });

        gsap.to(inners, {
          y: (index) => [-5, 3, -4][index],
          duration: (index) => [2.8, 3.15, 2.95][index],
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.12,
        });

        gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: section,
            start: 'top 78%',
            end: 'top 38%',
            scrub: 0.65,
          },
        })
          .to(titleRef.current, { autoAlpha: 1, y: 0, duration: 0.35 }, 0)
          .to(curves[0], { attr: { d: focusCurvePaths[0].to }, strokeDashoffset: 0, autoAlpha: 0.26, duration: 0.7 }, 0.08)
          .to(curves[1], { attr: { d: focusCurvePaths[1].to }, strokeDashoffset: 0, autoAlpha: 0.22, duration: 0.7 }, 0.2)
          .to(curves[2], { attr: { d: focusCurvePaths[2].to }, strokeDashoffset: 0, autoAlpha: 0.2, duration: 0.7 }, 0.32);

        cards.forEach((card, index) => {
          gsap.timeline({
            defaults: { ease: 'power2.out' },
            scrollTrigger: {
              trigger: card,
              start: 'top 82%',
              end: 'center 48%',
              scrub: 0.72,
            },
          })
            .to(card, { autoAlpha: 1, y: 0, rotateZ: cardTilts[index], scale: 1, duration: 0.42 }, 0)
            .to(inners[index], { rotateY: 180, duration: 0.54, ease: 'power2.inOut' }, 0.36)
            .to(card, { y: -8, rotateZ: cardTilts[index] * 0.72, scale: index === 1 ? 1.015 : 1, duration: 0.4 }, 0.72);
        });
      });
    }, section);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="relative z-10 overflow-hidden bg-primary px-6 py-20 text-primary-foreground shadow-[0_-42px_90px_rgba(18,12,40,0.18)] lg:px-0 lg:py-0">
      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 hidden h-[34rem] w-[min(94rem,120vw)] -translate-x-1/2 -translate-y-1/2 overflow-visible lg:block"
        viewBox="0 0 1440 520"
        fill="none"
        aria-hidden="true"
      >
        {focusCurvePaths.map((curve, index) => (
          <path
            key={curve.to}
            ref={(node) => {
              curveRefs.current[index] = node;
            }}
            d={curve.from}
            stroke="rgba(255,255,255,0.46)"
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center py-8 lg:py-10">
        <div className="mx-auto mb-14 max-w-3xl text-center lg:mb-16">
          <h2 ref={titleRef} className="font-heading text-4xl font-black tracking-tight text-white md:text-5xl xl:text-6xl">
            Designed for Focus
          </h2>
        </div>

        <div ref={stageRef} className="relative mx-auto grid w-full max-w-[57rem] gap-8 md:grid-cols-3 md:gap-7 lg:[perspective:1400px] lg:[transform-style:preserve-3d]">
          {focusFeatures.map((feature, index) => (
            <div
              key={feature.title}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className="relative mx-auto aspect-[5/7.75] w-[min(78vw,14.5rem)] sm:w-[15.5rem] md:w-[14.35rem] lg:w-[15.65rem] lg:[transform-style:preserve-3d] lg:[will-change:transform] xl:w-[16.15rem]"
            >
              <div
                ref={(node) => {
                  innerRefs.current[index] = node;
                }}
                className="relative h-full rounded-[26px] lg:[transform-style:preserve-3d] lg:[will-change:transform]"
              >
                <div className="absolute inset-0 overflow-hidden rounded-[26px] border-[3px] border-white bg-primary text-white shadow-[0_34px_80px_rgba(15,10,60,0.28)] [backface-visibility:hidden]">
                  <div className="absolute inset-3 rounded-[20px] border-2 border-white/95" />
                  <div className="absolute inset-7 rounded-[15px] border border-white/62" />
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.18)_0_1px,transparent_1px_13px)] opacity-70" />
                  <div className="absolute left-1/2 top-1/2 h-[54%] w-[54%] -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white/90" />
                  <div className="absolute left-1/2 top-1/2 h-[35%] w-[35%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80" />
                  <div className="absolute left-5 top-5 grid h-8 w-8 grid-cols-2 gap-1.5">
                    {[...Array(4)].map((_, dot) => (
                      <span key={dot} className="rounded-full bg-white/90" />
                    ))}
                  </div>
                  <div className="absolute bottom-5 right-5 grid h-8 w-8 rotate-180 grid-cols-2 gap-1.5">
                    {[...Array(4)].map((_, dot) => (
                      <span key={dot} className="rounded-full bg-white/90" />
                    ))}
                  </div>
                  <div
                    ref={(node) => {
                      iconRefs.current[index] = node;
                    }}
                    className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-[0_0_0_8px_rgba(255,255,255,0.08)] lg:[will-change:transform]"
                  >
                    <feature.icon size={42} strokeWidth={1.7} />
                  </div>
                </div>

                <div className="absolute inset-0 flex flex-col rounded-[26px] border border-slate-950/10 bg-white p-6 text-slate-950 shadow-[0_34px_90px_rgba(15,10,60,0.22)] [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-7 md:p-6 xl:p-7">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <div className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary/70">{feature.backLabel}</div>
                      <h3 className="mt-2 font-heading text-[1.42rem] font-black leading-none tracking-tight text-slate-950 lg:text-[1.56rem]">{feature.title}</h3>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_10px_26px_rgba(97,74,190,0.24)]">
                      <feature.icon size={22} strokeWidth={2.1} />
                    </div>
                  </div>

                  <p className="mt-5 text-[0.78rem] font-semibold leading-[1.18rem] text-slate-600">{feature.desc}</p>
                  <p className="mt-4 rounded-2xl bg-primary/[0.07] px-4 py-3 text-[0.74rem] font-bold leading-[1.14rem] text-primary">{feature.backText}</p>

                  <div className="mt-auto grid gap-2 pt-5">
                    {feature.backItems.map((item) => (
                      <div key={item} className="border-b border-dotted border-primary/25 pb-1.5 text-[0.74rem] font-bold leading-4 text-slate-800 last:border-b-0">
                        {item}
                      </div>
                    ))}
                  </div>

                  {feature.title === 'TD & Solutions' && (
                    <div className="mt-4 text-center text-[0.58rem] font-black uppercase tracking-[0.2em] text-slate-400">
                      Shazaxx learning card
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
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
  const { scrollY, scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const statsPinRef = useRef(null);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setHeaderScrolled(latest > 24);
  });

  useLayoutEffect(() => {
    const stats = statsPinRef.current;
    if (!stats) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: stats,
        start: 'center center',
        end: '+=100%',
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
    }, stats);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-background selection:bg-primary selection:text-white">
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
      <PageMotifLayer />

      <motion.header
        className={`fixed left-0 right-0 top-0 z-50 w-full transition-all duration-500 ${
          headerScrolled ? 'px-3 py-3' : 'border-b border-border bg-background/80 backdrop-blur-xl'
        }`}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className={`container mx-auto flex items-center justify-between px-6 transition-all duration-500 ${
            headerScrolled
              ? 'h-16 max-w-6xl rounded-full border border-white/45 bg-white/58 shadow-[0_18px_55px_rgba(15,23,42,0.16)] ring-1 ring-slate-900/5 backdrop-blur-2xl'
              : 'h-20'
          }`}
        >
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10 w-10" alt="Shazax" />
            <span className="font-heading text-2xl font-black tracking-tight">Shazaxx</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#how-it-works"
              className={`text-sm font-bold transition-colors hover:text-foreground ${
                headerScrolled ? 'text-slate-700' : 'text-muted-foreground'
              }`}
            >
              How it works
            </a>
            <a
              href="#demo"
              className={`text-sm font-bold transition-colors hover:text-foreground ${
                headerScrolled ? 'text-slate-700' : 'text-muted-foreground'
              }`}
            >
              Play Demo
            </a>
            <a
              href="#reviews"
              className={`text-sm font-bold transition-colors hover:text-foreground ${
                headerScrolled ? 'text-slate-700' : 'text-muted-foreground'
              }`}
            >
              Reviews
            </a>
          </nav>
          <motion.button
            onClick={() => navigate('/auth')}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            data-testid="button-nav-login"
            className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
              headerScrolled
                ? 'border border-slate-900/10 bg-white/35 text-slate-900 shadow-sm hover:bg-white/60'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Log In
          </motion.button>
        </motion.div>
      </motion.header>

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
                  <motion.span
                    initial={{ clipPath: 'inset(0 100% 0 0)', y: 8 }}
                    animate={{ clipPath: 'inset(0 0% 0 0)', y: 0 }}
                    transition={{ delay: 1.05, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="block"
                  >
                    Stop Reading.
                  </motion.span>
                  <motion.span
                    initial={{ clipPath: 'inset(0 100% 0 0)', y: 8 }}
                    animate={{ clipPath: 'inset(0 0% 0 0)', y: 0 }}
                    transition={{ delay: 1.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="block text-primary"
                  >
                    Start Doing.
                  </motion.span>
                </h1>
                <p className="max-w-lg text-xl font-medium leading-relaxed text-muted-foreground">
                  Bridge the gap between lectures and exams. Master universities with organized TD, solutions, and interactive tools for total success.
                </p>
                <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                      <motion.button
  onClick={() => window.location.href = '/auth'}
  whileHover={{ y: -2 }}
  whileTap={{ scale: 0.95 }}
  data-testid="button-hero-cta"
  className="flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-black text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
>
  Start Learning <ArrowRight size={20} />
</motion.button>
                  <motion.button
                    onClick={() => setWaitlistOpen(true)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    data-testid="button-hero-secondary"
                    className="rounded-full border border-border bg-secondary px-8 py-4 text-lg font-bold text-secondary-foreground transition-all hover:bg-secondary/80"
                  >
                    Join Waitlist
                  </motion.button>
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

        <section ref={statsPinRef} className="relative z-0 flex min-h-screen items-center overflow-hidden border-y border-border bg-background px-6 py-16">
          <div className="container mx-auto px-0">
            <div className="flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-4 text-center"
              >
                <div className="font-heading text-7xl font-black text-foreground md:text-8xl lg:text-9xl">99%</div>
                <div className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-primary md:text-base">
                  <Heart size={18} fill="currentColor" /> Positive Feedback from Students
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <FocusSection />

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

        <FinalCtaSection onOpenWaitlist={() => setWaitlistOpen(true)} />
      </main>

      <footer className="relative overflow-hidden bg-[#080a13] px-6 py-16 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(139,92,246,0.18),transparent_38%,rgba(59,130,246,0.14))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:54px_54px] opacity-25" />

        <div className="container relative mx-auto max-w-6xl">
          <div className="grid gap-10 rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl md:grid-cols-[1.25fr_0.75fr_0.75fr] md:p-8">
            <div>
              <div className="flex items-center gap-3">
                <BrandLogo className="h-11 w-11" alt="Shazax" />
                <span className="font-heading text-2xl font-black tracking-tight">Shazaxx</span>
              </div>
              <p className="mt-5 max-w-md text-sm font-medium leading-6 text-white/55">
                Organized courses, TDs, exams, and academic resources built for Moroccan students who want to move faster.
              </p>
              <button
                type="button"
                onClick={() => setWaitlistOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-primary hover:text-white"
              >
                Get early access
                <ArrowRight size={16} />
              </button>
            </div>

            <div>
              <h3 className="font-heading text-sm font-black uppercase tracking-[0.22em] text-white/35">Explore</h3>
              <div className="mt-5 grid gap-3 text-sm font-bold text-white/62">
                <a href="#how-it-works" className="transition hover:text-white">How it works</a>
                <a href="#demo" className="transition hover:text-white">Play Demo</a>
                <a href="#reviews" className="transition hover:text-white">Reviews</a>
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="w-fit text-left transition hover:text-white"
                >
                  Log In
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-heading text-sm font-black uppercase tracking-[0.22em] text-white/35">Legal</h3>
              <div className="mt-5 grid gap-3 text-sm font-bold text-white/62">
                <Link to="/privacy" className="transition hover:text-white">Privacy</Link>
                <Link to="/terms" className="transition hover:text-white">Terms</Link>
              </div>
            </div>
          </div>

          <div className="mt-8 grid items-center gap-3 border-t border-white/10 pt-6 text-center text-xs font-semibold text-white/38 md:grid-cols-3">
            <span className="md:justify-self-start">&copy; 2025 Shazaxx Inc. All rights reserved.</span>
            <span className="md:justify-self-center">
              Made with <span className="text-white/70">{'\u2764\uFE0F'}</span> by{' '}
              <a
                href="https://www.instagram.com/med_shazaxx/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/62 transition hover:text-white"
              >
                med_shazaxx
              </a>
            </span>
            <span className="md:justify-self-end">Made for focused students, one module at a time.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
