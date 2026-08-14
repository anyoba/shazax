import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Flag, Loader2, Menu, Send, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import ConfirmDialog from '../../components/concours/common/ConfirmDialog.jsx';
import EmptyState from '../../components/concours/common/EmptyState.jsx';
import LoadingState from '../../components/concours/common/LoadingState.jsx';
import Toast from '../../components/concours/common/Toast.jsx';
import ChoiceButton from '../../components/concours/quiz/ChoiceButton.jsx';
import QuestionMedia from '../../components/concours/quiz/QuestionMedia.jsx';
import NumericAnswerInput from '../../components/concours/quiz/NumericAnswerInput.jsx';
import { getAttempt, saveAttemptAnswer, submitAttempt } from '../../services/concoursApi.js';

function formatClock(seconds = 0) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export default function QuizSessionPage() {
  const params = useParams();
  const attemptId = params.attemptId || params.sessionId;
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [questionMenuOpen, setQuestionMenuOpen] = useState(false);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const body = await getAttempt(attemptId, getToken);
        if (cancelled) return;
        setAttempt(body.attempt);
        setQuestions(body.questions || []);
        setAnswers(body.answersByQuestionId || {});
        setCurrentIndex(Math.min(body.attempt?.currentIndex || 0, Math.max(0, (body.questions || []).length - 1)));
        setRemainingSeconds(body.remainingSeconds || 0);
        if (body.attempt?.status !== 'IN_PROGRESS') {
          navigate(`/concours/${body.attempt.concoursSlug}/results/${body.attempt.id}`, { replace: true });
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Session introuvable.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [attemptId, getToken, navigate]);

  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS') return undefined;
    const interval = window.setInterval(() => {
      setRemainingSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [attempt]);

  useEffect(() => {
    if (!attempt || remainingSeconds > 0 || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    finish({ expired: true });
  }, [attempt, remainingSeconds]);

  const question = questions[currentIndex];
  const answer = question ? answers[question.id] : null;
  const selectedAnswer = answer?.answerValue || '';
  const flagged = Boolean(answer?.flagged);
  const progressPercent = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = useMemo(() => Object.values(answers).filter((item) => item?.answerValue).length, [answers]);

  if (loading) return <LoadingState label="Chargement de l examen..." />;
  if (error) return <EmptyState title="Session indisponible" description={error} />;
  if (!attempt || !question) return <EmptyState title="Session vide" description="Aucune question publiee pour cet examen." />;

  async function persistAnswer(questionId, answerValue, nextFlagged = flagged, nextIndex = currentIndex) {
    const previous = answers[questionId];
    const optimistic = {
      ...(previous || {}),
      questionId,
      answerValue,
      flagged: nextFlagged,
      updatedAt: new Date().toISOString(),
    };
    setAnswers((current) => ({ ...current, [questionId]: optimistic }));
    setSaving(true);
    try {
      await saveAttemptAnswer({ attemptId: attempt.id, questionId, answerValue, flagged: nextFlagged, currentIndex: nextIndex }, getToken);
    } catch (err) {
      setAnswers((current) => ({ ...current, [questionId]: previous }));
      setToast(err?.message || 'Sauvegarde impossible.');
      window.setTimeout(() => setToast(''), 2200);
    } finally {
      setSaving(false);
    }
  }

  function goToIndex(index) {
    const nextIndex = Math.max(0, Math.min(index, questions.length - 1));
    setCurrentIndex(nextIndex);
    setQuestionMenuOpen(false);
    if (question) persistAnswer(question.id, selectedAnswer, flagged, nextIndex);
  }

  function toggleFlag() {
    persistAnswer(question.id, selectedAnswer, !flagged);
  }

  async function finish({ expired = false } = {}) {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const body = await submitAttempt(attempt.id, getToken, { expired });
      navigate(`/concours/${body.attempt.concoursSlug}/results/${body.attempt.id}`, { replace: true });
    } catch (err) {
      setError(err?.message || 'Soumission impossible.');
      setSubmitting(false);
    }
  }

  function getQuestionButtonClass(questionId, index) {
    const item = answers[questionId];
    if (index === currentIndex) return 'border-slate-950 bg-slate-950 text-white shadow-lg';
    if (item?.flagged) return 'border-amber-300 bg-amber-100 text-amber-800';
    if (item?.answerValue) return 'border-emerald-300 bg-emerald-100 text-emerald-800';
    return 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50';
  }

  return (
    <main className="min-h-screen overflow-hidden bg-cover bg-center bg-fixed text-white" style={{ backgroundImage: "linear-gradient(180deg, rgba(18, 12, 34, 0.62), rgba(28, 18, 46, 0.42)), url('/background-sh.png')" }}>
      <Toast message={toast} />
      <button type="button" onClick={() => navigate('/concours')} className="fixed left-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white shadow-lg backdrop-blur" aria-label="Quitter"><X size={22} /></button>
      <button type="button" onClick={() => setQuestionMenuOpen((value) => !value)} className="fixed right-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white shadow-lg backdrop-blur" aria-label="Questions"><Menu size={22} /></button>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6">
        <header className="mx-auto w-full max-w-3xl pt-12 text-center sm:pt-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">{attempt.concoursName}</p>
          <h1 className="mt-2 text-3xl font-black text-white drop-shadow sm:text-4xl">Examen Shazaxx</h1>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-black uppercase text-white/80">
            <span className="rounded-full bg-white/16 px-3 py-1 backdrop-blur">{answeredCount}/{questions.length} repondues</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/16 px-3 py-1 backdrop-blur"><Clock size={14} />{formatClock(remainingSeconds)}</span>
            {saving ? <span className="inline-flex items-center gap-1 rounded-full bg-white/16 px-3 py-1 backdrop-blur"><Loader2 size={14} className="animate-spin" />saving</span> : null}
          </div>
        </header>

        <section className="mx-auto mt-5 w-full max-w-3xl">
          <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-white/85"><span>Question {currentIndex + 1}/{questions.length}</span><span>{Math.round(progressPercent)}%</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-white/25 shadow-inner"><div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${progressPercent}%` }} /></div>
        </section>

        {questionMenuOpen ? (
          <aside className="fixed right-4 top-20 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-[1.5rem] border border-white/30 bg-white/95 p-4 text-slate-900 shadow-2xl backdrop-blur">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">Questions</h2><button type="button" onClick={() => setQuestionMenuOpen(false)} className="rounded-full p-2 text-slate-500"><X size={18} /></button></div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((item, index) => <button key={item.id} type="button" onClick={() => goToIndex(index)} className={`h-11 rounded-2xl border text-sm font-black transition ${getQuestionButtonClass(item.id, index)}`}>{index + 1}</button>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500"><span>Vert: repondu</span><span>Jaune: flag</span></div>
          </aside>
        ) : null}

        <div className="mx-auto mt-6 flex w-full max-w-3xl flex-1 items-center pb-24">
          <article className="w-full rounded-[1.6rem] border-[3px] border-slate-950 bg-white p-5 text-slate-900 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Question {currentIndex + 1}</p>
                <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">{question.statement}</h2>
              </div>
              <button type="button" onClick={toggleFlag} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${flagged ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500'}`} aria-label="Flag question"><Flag size={19} fill={flagged ? 'currentColor' : 'none'} /></button>
            </div>
            <QuestionMedia imageUrl={question.imageUrl} />
            {question.type === 'numeric' ? <NumericAnswerInput value={selectedAnswer} onChange={(value) => persistAnswer(question.id, value)} /> : (
              <div className="mt-6 grid gap-3">
                {question.choices.map((choice) => <ChoiceButton key={choice.id} choice={choice} disabled={false} isCorrect={false} isSelected={selectedAnswer === choice.id} isWrong={false} onSelect={(value) => persistAnswer(question.id, value)} />)}
              </div>
            )}
          </article>
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/20 bg-black/35 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:justify-between">
          <button type="button" disabled={currentIndex === 0} onClick={() => goToIndex(currentIndex - 1)} className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-4 py-3 text-sm font-black text-white disabled:opacity-40"><ChevronLeft size={18} />Precedent</button>
          <button type="button" onClick={() => setConfirmSubmit(true)} disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl disabled:opacity-50">{submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}Submit</button>
          <button type="button" disabled={currentIndex >= questions.length - 1} onClick={() => goToIndex(currentIndex + 1)} className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-4 py-3 text-sm font-black text-white disabled:opacity-40">Suivant<ChevronRight size={18} /></button>
        </div>
      </footer>

      <ConfirmDialog open={confirmSubmit} title="Soumettre l examen ?" message="Le score sera calcule cote serveur. Tu ne pourras plus modifier tes reponses." confirmLabel="Soumettre" onCancel={() => setConfirmSubmit(false)} onConfirm={() => finish()} />
      {error ? <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-xl">{error}</div> : null}
    </main>
  );
}
