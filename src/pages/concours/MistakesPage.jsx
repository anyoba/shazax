import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Play, RotateCcw } from 'lucide-react';
import Badge from '../../components/concours/common/Badge.jsx';
import EmptyState from '../../components/concours/common/EmptyState.jsx';
import FilterSelect from '../../components/concours/common/FilterSelect.jsx';
import { createSession, getMistakes, markMistakeMastered } from '../../services/concoursLocalStorage.js';
import { getQuestionById, getQuestionMeta } from '../../utils/concours/catalog.js';

export default function MistakesPage() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState(() => getMistakes());
  const [status, setStatus] = useState('all');
  const filtered = mistakes.filter((mistake) => status === 'all' || mistake.status === status);

  function master(questionId) {
    setMistakes(markMistakeMastered(questionId));
  }

  function startMistakesSession() {
    const firstQuestion = getQuestionById(filtered[0]?.questionId);
    if (!firstQuestion) return;
    const session = createSession({
      contestId: firstQuestion.contestId,
      subjectId: firstQuestion.subjectId,
      chapterId: firstQuestion.chapterId,
      questionCount: Math.min(filtered.length, 10),
      questionIds: filtered.slice(0, 10).map((mistake) => mistake.questionId),
      difficulty: 'mixed',
      timerEnabled: true,
      mode: 'training',
    });
    navigate(`/concours/session/${session.id}`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="amber">Carnet d erreurs</Badge>
            <h2 className="mt-4 text-3xl font-black text-slate-950">Questions a revoir</h2>
            <p className="mt-2 text-sm text-slate-500">Chaque erreur est stockee localement avec son historique.</p>
          </div>
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={startMistakesSession}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            <Play size={17} />
            Serie erreurs
          </button>
        </div>
        <div className="mt-5 max-w-xs">
          <FilterSelect
            label="Filtrer par statut"
            value={status}
            onChange={setStatus}
            options={[
              { id: 'all', label: 'Toutes' },
              { id: 'a_revoir', label: 'A revoir' },
              { id: 'maitrisee', label: 'Maitrisees' },
            ]}
          />
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune erreur" description="Les erreurs apparaitront apres tes sessions." />
      ) : (
        <div className="grid gap-4">
          {filtered.map((mistake) => {
            const question = getQuestionById(mistake.questionId);
            const meta = getQuestionMeta(question);
            return (
              <article key={mistake.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="blue">{meta.contestName}</Badge>
                      <Badge tone={mistake.status === 'maitrisee' ? 'green' : 'amber'}>{mistake.status === 'maitrisee' ? 'Maitrisee' : 'A revoir'}</Badge>
                    </div>
                    <p className="mt-3 font-black text-slate-900">{question?.statement}</p>
                    <p className="mt-2 text-sm text-slate-500">Bonne reponse : {mistake.correctAnswer}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{mistake.explanation}</p>
                    <p className="mt-2 text-xs font-bold text-slate-400">Echecs : {mistake.failures}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => master(mistake.questionId)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700"
                  >
                    <CheckCircle2 size={16} />
                    Marquer maitrisee
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
