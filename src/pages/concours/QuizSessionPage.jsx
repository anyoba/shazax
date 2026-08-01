import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Clock, Lightbulb, Menu, SkipForward, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/concours/common/ConfirmDialog.jsx';
import EmptyState from '../../components/concours/common/EmptyState.jsx';
import Toast from '../../components/concours/common/Toast.jsx';
import ChoiceButton from '../../components/concours/quiz/ChoiceButton.jsx';
import ExplanationPanel from '../../components/concours/quiz/ExplanationPanel.jsx';
import FavoriteQuestionButton from '../../components/concours/quiz/FavoriteQuestionButton.jsx';
import HintPanel from '../../components/concours/quiz/HintPanel.jsx';
import NumericAnswerInput from '../../components/concours/quiz/NumericAnswerInput.jsx';
import QuestionMedia from '../../components/concours/quiz/QuestionMedia.jsx';
import ReportQuestionButton from '../../components/concours/quiz/ReportQuestionButton.jsx';
import {
  addReport,
  answerQuestion,
  completeSession,
  getFavorites,
  getSession,
  getSettings,
  toggleFavorite,
  updateSession,
} from '../../services/concoursLocalStorage.js';
import { getQuestionMeta } from '../../utils/concours/catalog.js';
import { playConcoursSound } from '../../utils/concours/sounds.js';

export default function QuizSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession(sessionId));
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [hintVisible, setHintVisible] = useState(false);
  const [seconds, setSeconds] = useState(session?.elapsedSeconds || 0);
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [toast, setToast] = useState('');
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [questionMenuOpen, setQuestionMenuOpen] = useState(false);
  const touchStart = useRef(null);
  const settings = getSettings();

  const questionIds = session?.questionIds || [];
  const currentIndex = session?.currentIndex || 0;
  const currentQuestionId = questionIds[currentIndex];
  const question = session?.questionsById?.[currentQuestionId];
  const answer = session?.answers?.[currentQuestionId];
  const locked = Boolean(answer);
  const mode = session?.mode || 'training';
  const meta = getQuestionMeta(question);
  const isLast = currentIndex === questionIds.length - 1;
  const isFavorite = favorites.includes(currentQuestionId);

  useEffect(() => {
    const nextAnswer = session?.answers?.[currentQuestionId];
    setSelectedAnswer(nextAnswer?.answerValue || '');
    setHintVisible(Boolean(nextAnswer?.usedHint));
  }, [currentQuestionId, session]);

  useEffect(() => {
    if (!session || session.status === 'completed') return undefined;
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    updateSession(session.id, { elapsedSeconds: seconds });
  }, [seconds, session]);

  if (!session || !question) {
    return <EmptyState title="Session introuvable" description="Cette session locale n existe plus ou a ete reinitialisee." />;
  }

  function goToIndex(index) {
    if (index < 0 || index >= questionIds.length) return;
    updateSession(session.id, { currentIndex: index });
    setSession(getSession(sessionId));
    setQuestionMenuOpen(false);
  }

  function handleCheck({ skipped = false } = {}) {
    if (locked) return;
    const needsAnswer = !skipped && selectedAnswer !== '';
    if (!needsAnswer && !skipped) return;

    const updated = answerQuestion(session.id, currentQuestionId, selectedAnswer, {
      usedHint: hintVisible,
      skipped,
    });
    setSession(updated);

    const nextAnswer = updated?.answers?.[currentQuestionId];
    if (mode === 'training') {
      playConcoursSound(nextAnswer?.correct ? 'correct' : 'wrong');
    }

    if (mode === 'exam' && !isLast) {
      goToIndex(currentIndex + 1);
    }
  }

  function handleNext() {
    if (!isLast) goToIndex(currentIndex + 1);
  }

  function handlePrevious() {
    goToIndex(currentIndex - 1);
  }

  function handleFinish() {
    const completed = completeSession(session.id, seconds);
    playConcoursSound(completed?.badgesUnlocked?.length ? 'badge' : 'finish');
    navigate(`/concours/results/${session.id}`);
  }

  function handleQuit() {
    if (settings.confirmBeforeQuit) {
      setConfirmQuit(true);
      return;
    }
    navigate('/concours');
  }

  function showHint() {
    if (mode === 'exam' || locked) return;
    setHintVisible(true);
  }

  function handleFavorite() {
    const nextFavorites = toggleFavorite(currentQuestionId);
    setFavorites(nextFavorites);
    setToast(nextFavorites.includes(currentQuestionId) ? 'Question ajoutee aux favoris.' : 'Question retiree des favoris.');
    window.setTimeout(() => setToast(''), 1800);
  }

  function handleReport(report) {
    addReport({
      ...report,
      questionId: currentQuestionId,
      sessionId: session.id,
    });
    setToast('Signalement enregistre localement.');
    window.setTimeout(() => setToast(''), 1800);
  }

  function handleTouchStart(event) {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event) {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dy) > 45 || Math.abs(dx) < 70) return;
    if (dx < 0 && (locked || mode === 'exam')) handleNext();
    if (dx > 0) handlePrevious();
  }

  const canCheck = selectedAnswer !== '' && !locked;
  const canGoNext = currentIndex < questionIds.length - 1 && (locked || mode === 'exam');
  const canGoPrevious = currentIndex > 0;
  const progressPercent = questionIds.length ? ((currentIndex + 1) / questionIds.length) * 100 : 0;

  function getQuestionButtonClass(questionId, index) {
    const item = session.answers?.[questionId];

    if (index === currentIndex) return 'border-white bg-slate-950 text-white shadow-lg';
    if (!item) return 'border-white/70 bg-white/85 text-slate-700 hover:bg-white';
    if (item.skipped) return 'border-slate-300 bg-slate-500 text-white';
    if (item.correct) return 'border-emerald-300 bg-emerald-500 text-white';
    return 'border-red-300 bg-red-500 text-white';
  }

  return (
    <main
      className="min-h-screen overflow-hidden bg-cover bg-center bg-fixed text-white"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(18, 12, 34, 0.54), rgba(28, 18, 46, 0.36)), url('/background-sh.png')",
      }}
    >
      <Toast message={toast} />
      <button
        type="button"
        onClick={handleQuit}
        className="fixed left-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white shadow-lg backdrop-blur transition hover:bg-black/50 focus:outline-none focus:ring-4 focus:ring-white/30"
        aria-label="Quitter le QCM"
      >
        <X size={22} />
      </button>

      <button
        type="button"
        onClick={() => setQuestionMenuOpen((value) => !value)}
        className="fixed right-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white shadow-lg backdrop-blur transition hover:bg-black/50 focus:outline-none focus:ring-4 focus:ring-white/30"
        aria-label="Ouvrir le menu des questions"
      >
        <Menu size={22} />
      </button>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6">
        <header className="mx-auto w-full max-w-3xl pt-12 text-center sm:pt-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
            {meta.contest?.name} · {meta.subject?.name} · {meta.chapter?.name}
          </p>
          <h1 className="mt-2 text-3xl font-black text-white drop-shadow sm:text-4xl">Shazax QCM</h1>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-black uppercase text-white/80">
            <span className="rounded-full bg-white/16 px-3 py-1 backdrop-blur">{mode === 'exam' ? 'Mode examen' : 'Mode entrainement'}</span>
            <span className="rounded-full bg-white/16 px-3 py-1 backdrop-blur">{question.difficulty}</span>
            {settings.timerVisible ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/16 px-3 py-1 backdrop-blur">
                <Clock size={14} />
                {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
              </span>
            ) : null}
          </div>
        </header>

        <section className="mx-auto mt-5 w-full max-w-3xl" aria-label="Progression de la serie">
          <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-white/85">
            <span>
              Question {currentIndex + 1}/{questionIds.length}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/25 shadow-inner">
            <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </section>

        {questionMenuOpen ? (
          <aside className="fixed right-4 top-20 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-[1.5rem] border border-white/30 bg-white/92 p-4 text-slate-900 shadow-2xl backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black">Choisir une question</h2>
              <button
                type="button"
                onClick={() => setQuestionMenuOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Fermer le menu des questions"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questionIds.map((questionId, index) => (
                <button
                  key={questionId}
                  type="button"
                  onClick={() => goToIndex(index)}
                  className={`h-11 rounded-2xl border text-sm font-black transition ${getQuestionButtonClass(questionId, index)}`}
                  aria-label={`Aller a la question ${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Juste</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Faux</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-500" /> Passee</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-200" /> Vide</span>
            </div>
          </aside>
        ) : null}

        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="mx-auto mt-6 flex w-full max-w-3xl flex-1 items-center pb-24 transition-transform duration-200"
        >
          <article className="w-full rounded-[1.6rem] border-[3px] border-slate-950 bg-white p-5 text-slate-900 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Question {currentIndex + 1}</p>
                <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">{question.statement}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <FavoriteQuestionButton active={isFavorite} onToggle={handleFavorite} />
                <ReportQuestionButton onReport={handleReport} />
              </div>
            </div>

            <QuestionMedia imageUrl={question.imageUrl} />

            {question.statementLatex ? (
              <div className="mt-5 rounded-[1.25rem] border border-violet-100 bg-violet-50 px-4 py-4 text-center text-lg font-black text-violet-900">
                {question.statementLatex}
              </div>
            ) : null}

            {question.type === 'numeric' ? (
              <NumericAnswerInput disabled={locked} value={selectedAnswer} onChange={setSelectedAnswer} />
            ) : (
              <div className="mt-6 grid gap-3">
                {question.choices.map((choice) => (
                  <ChoiceButton
                    key={choice.id}
                    choice={choice}
                    disabled={locked}
                    isCorrect={locked && choice.id === question.correctChoiceId}
                    isSelected={selectedAnswer === choice.id}
                    isWrong={locked && selectedAnswer === choice.id && !answer?.correct}
                    onSelect={setSelectedAnswer}
                  />
                ))}
              </div>
            )}

            <HintPanel hint={question.hint} visible={hintVisible} />
            <ExplanationPanel answer={answer} question={question} visible={mode === 'training' && locked} />
          </article>
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/20 bg-black/35 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:justify-between">
          <button
            type="button"
            disabled={!canGoPrevious}
            onClick={handlePrevious}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} />
            Precedent
          </button>

          {mode === 'training' ? (
            <button
              type="button"
              disabled={locked || hintVisible}
              onClick={showHint}
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900 shadow-lg transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lightbulb size={18} />
              Hint
            </button>
          ) : null}

          <button
            type="button"
            disabled={locked}
            onClick={() => handleCheck({ skipped: true })}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SkipForward size={18} />
            Passer
          </button>

          {!locked ? (
            <button
              type="button"
              disabled={!canCheck}
              onClick={() => handleCheck()}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={18} />
              Check Answer
            </button>
          ) : isLast ? (
            <button
              type="button"
              onClick={handleFinish}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-violet-50"
            >
              Terminer
            </button>
          ) : (
            <button
              type="button"
              disabled={!canGoNext}
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suivant
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </footer>

      <ConfirmDialog
        open={confirmQuit}
        title="Quitter la session ?"
        message="Ta progression locale de cette session sera conservee, mais la serie ne sera pas terminee."
        confirmLabel="Quitter"
        onCancel={() => setConfirmQuit(false)}
        onConfirm={() => navigate('/concours')}
      />
    </main>
  );
}
