import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Repeat2, ShieldCheck, Target, Trophy, XCircle } from 'lucide-react';
import Badge from '../../components/concours/common/Badge.jsx';
import EmptyState from '../../components/concours/common/EmptyState.jsx';
import ProgressBar from '../../components/concours/common/ProgressBar.jsx';
import StatCard from '../../components/concours/common/StatCard.jsx';
import { createSession, getSession } from '../../services/concoursLocalStorage.js';
import { getQuestionMeta, getQuestionById } from '../../utils/concours/catalog.js';
import { getCorrectAnswerLabel, summarizeSession } from '../../utils/concours/scoring.js';

function formatTime(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

export default function QuizResultsPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = getSession(sessionId);

  if (!session) {
    return <EmptyState title="Resultats introuvables" description="Cette session locale n est plus disponible." />;
  }

  const summary = session.summary || summarizeSession(session);
  const wrongAnswers = Object.values(session.answers || {}).filter((answer) => !answer.correct && !answer.skipped);
  const skippedAnswers = Object.values(session.answers || {}).filter((answer) => answer.skipped);

  function restart() {
    const nextSession = createSession(session.config);
    navigate(`/concours/session/${nextSession.id}`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-float sm:p-8">
        <Badge tone={summary.successRate >= 80 ? 'green' : 'amber'}>{summary.successRate}% de reussite</Badge>
        <h2 className="mt-4 text-4xl font-black">Resultat de session</h2>
        <p className="mt-2 text-sm text-slate-300">
          {summary.correct} bonnes reponses, {summary.wrong} erreurs, {summary.skipped} questions passees.
        </p>
        <div className="mt-6 max-w-xl">
          <ProgressBar value={summary.successRate} max={100} label="Score global" />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Trophy size={20} />} label="XP gagne" value={`+${summary.totalXp}`} detail={summary.perfectBonus ? `Bonus serie parfaite +${summary.perfectBonus}` : 'Sans penalite negative'} />
        <StatCard icon={<ShieldCheck size={20} />} label="Bonnes reponses" value={summary.correct} />
        <StatCard icon={<XCircle size={20} />} label="A revoir" value={summary.wrong + skippedAnswers.length} />
        <StatCard icon={<Target size={20} />} label="Temps moyen" value={formatTime(session.averageSecondsPerQuestion || 0)} />
      </div>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-xl font-black text-slate-950">Performance par chapitre</h3>
        <div className="mt-5 grid gap-3">
          {session.questionIds.map((questionId) => getQuestionById(questionId)).filter(Boolean).slice(0, 4).map((question) => {
            const meta = getQuestionMeta(question);
            const answer = session.answers?.[question.id];
            return (
              <div key={question.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-slate-900">{meta.chapterName}</div>
                    <div className="text-sm text-slate-500">{question.statement}</div>
                  </div>
                  <Badge tone={answer?.correct ? 'green' : answer?.skipped ? 'slate' : 'red'}>
                    {answer?.correct ? 'Juste' : answer?.skipped ? 'Passe' : 'Erreur'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-xl font-black text-slate-950">Liste des erreurs</h3>
        {wrongAnswers.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucune erreur dans cette session.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {wrongAnswers.map((answer) => {
              const question = getQuestionById(answer.questionId);
              const meta = getQuestionMeta(question);
              return (
                <div key={answer.questionId} className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <div className="text-sm font-black text-red-900">{meta.subjectName} - {meta.chapterName}</div>
                  <p className="mt-2 text-sm text-slate-700">{question?.statement}</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">Bonne reponse : {getCorrectAnswerLabel(question)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{question?.explanation}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {session.badgesUnlocked?.length ? (
        <section className="rounded-[1.75rem] border border-amber-100 bg-amber-50 p-6 shadow-soft">
          <h3 className="text-xl font-black text-amber-900">Badges debloques</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {session.badgesUnlocked.map((badge) => (
              <Badge key={badge.id} tone="amber">{badge.name}</Badge>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={restart} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white">
          <Repeat2 size={17} />
          Recommencer
        </button>
        <Link to="/concours/mistakes" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">
          Revoir les erreurs
        </Link>
        <Link to="/concours" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">
          <ArrowLeft size={17} />
          Retour dashboard
        </Link>
      </div>
    </div>
  );
}
