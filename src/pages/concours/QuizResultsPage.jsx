import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleMinus, Repeat2, ShieldCheck, Target, Trophy, XCircle } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import Badge from '../../components/concours/common/Badge.jsx';
import EmptyState from '../../components/concours/common/EmptyState.jsx';
import LoadingState from '../../components/concours/common/LoadingState.jsx';
import ProgressBar from '../../components/concours/common/ProgressBar.jsx';
import StatCard from '../../components/concours/common/StatCard.jsx';
import { getAttemptResults, startConcoursAttempt } from '../../services/concoursApi.js';

function formatTime(seconds = 0) {
  const minutes = Math.floor(Number(seconds || 0) / 60);
  const rest = Number(seconds || 0) % 60;
  return `${minutes}m ${String(rest).padStart(2, '0')}s`;
}

function answerLabel(question, value) {
  if (!value) return 'Unanswered';
  const option = question.choices?.find((choice) => choice.id === value);
  return option ? `${option.id}. ${option.text}` : value;
}

export default function QuizResultsPage() {
  const params = useParams();
  const attemptId = params.attemptId || params.sessionId;
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const body = await getAttemptResults(attemptId, getToken);
        if (!cancelled) setPayload(body);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Resultats introuvables.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [attemptId, getToken]);

  async function restart() {
    if (!payload?.concours?.slug) return;
    setRestarting(true);
    try {
      const body = await startConcoursAttempt(payload.concours.slug, getToken);
      navigate(`/concours/${payload.concours.slug}/exam/${body.attempt.id}`);
    } catch (err) {
      setError(err?.message || 'Impossible de relancer cet examen.');
    } finally {
      setRestarting(false);
    }
  }

  if (loading) return <LoadingState label="Chargement des resultats..." />;
  if (error && !payload) return <EmptyState title="Resultats indisponibles" description={error} />;
  if (!payload) return <EmptyState title="Resultats introuvables" description="Aucun resultat disponible." />;

  const { attempt, concours, questions, answersByQuestionId } = payload;
  const unanswered = Number(attempt.unansweredCount || 0);
  const incorrect = Number(attempt.incorrectCount || 0);
  const correct = Number(attempt.correctCount || 0);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-float sm:p-8">
        <Badge tone={attempt.percentage >= 80 ? 'green' : 'amber'}>{attempt.percentage}% de reussite</Badge>
        <h2 className="mt-4 text-4xl font-black">{concours.name}</h2>
        <p className="mt-2 text-sm text-slate-300">Score: {attempt.score} / {attempt.totalPoints}. {correct} correctes, {incorrect} incorrectes, {unanswered} sans reponse.</p>
        <div className="mt-6 max-w-xl"><ProgressBar value={attempt.percentage} max={100} label="Score global" /></div>
      </section>

      {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Trophy size={20} />} label="Score" value={`${attempt.score}/${attempt.totalPoints}`} />
        <StatCard icon={<ShieldCheck size={20} />} label="Bonnes reponses" value={correct} />
        <StatCard icon={<XCircle size={20} />} label="Incorrectes" value={incorrect} />
        <StatCard icon={<Target size={20} />} label="Temps passe" value={formatTime(attempt.timeSpentSeconds)} />
      </div>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-xl font-black text-slate-950">Question review</h3>
        <div className="mt-5 space-y-4">
          {questions.map((question, index) => {
            const answer = answersByQuestionId?.[question.id];
            const hasAnswer = Boolean(answer?.answerValue);
            const tone = !hasAnswer ? 'slate' : answer.correct ? 'green' : 'red';
            const Icon = !hasAnswer ? CircleMinus : answer.correct ? CheckCircle2 : XCircle;
            return (
              <article key={question.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge tone={tone}><Icon size={14} className="mr-1 inline" />{!hasAnswer ? 'Unanswered' : answer.correct ? 'Correct' : 'Incorrect'}</Badge>
                    <h4 className="mt-3 font-black text-slate-950">{index + 1}. {question.statement}</h4>
                  </div>
                  <span className="text-sm font-black text-slate-400">{question.points} pts</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 text-sm"><div className="font-black text-slate-500">Your answer</div><p className="mt-1 text-slate-900">{answerLabel(question, answer?.answerValue)}</p></div>
                  <div className="rounded-2xl bg-white p-4 text-sm"><div className="font-black text-slate-500">Correct answer</div><p className="mt-1 text-slate-900">{answerLabel(question, question.correctOptionId)}</p></div>
                </div>
                {question.explanation ? <p className="mt-4 rounded-2xl bg-violet-50 p-4 text-sm leading-6 text-violet-900">{question.explanation}</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={restart} disabled={restarting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white disabled:opacity-50"><Repeat2 size={17} />{restarting ? 'Creation...' : 'Recommencer'}</button>
        <Link to="/concours" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"><ArrowLeft size={17} />Retour dashboard</Link>
      </div>
    </div>
  );
}
