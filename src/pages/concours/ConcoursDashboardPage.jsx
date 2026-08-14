import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '@clerk/clerk-react';
import { Activity, Award, Clock3, Flame, Sparkles, Target, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import StatCard from '../../components/concours/common/StatCard.jsx';
import ProgressBar from '../../components/concours/common/ProgressBar.jsx';
import Badge from '../../components/concours/common/Badge.jsx';
import LoadingState from '../../components/concours/common/LoadingState.jsx';
import { getConcoursProgress, listConcours } from '../../services/concoursApi.js';

function formatHours(seconds = 0) {
  return `${Math.max(Math.round(Number(seconds || 0) / 3600), 0)}h`;
}

export default function ConcoursDashboardPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const firstName = user?.firstName || user?.fullName?.split(' ')?.[0] || 'Etudiant';
  const [progress, setProgress] = useState(null);
  const [concours, setConcours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [progressBody, concoursBody] = await Promise.all([getConcoursProgress(getToken), listConcours()]);
        if (!cancelled) {
          setProgress(progressBody.progress);
          setConcours(concoursBody.concours || []);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Impossible de charger ta progression.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getToken]);

  if (loading) return <LoadingState label="Chargement du dashboard..." />;

  const data = progress || {};
  const recentAttempts = data.recentAttempts || [];
  const totalStudySeconds = recentAttempts.reduce((sum, attempt) => sum + Number(attempt.timeSpentSeconds || 0), 0);

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-float sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="blue">Espace concours</Badge>
            <h2 className="mt-4 max-w-2xl text-3xl font-black sm:text-5xl">{firstName}, transforme tes QCM en reflexes de concours.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">Attempts persistants, timer serveur, resultats securises et historique lie a ton compte.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5">
            <div className="text-sm font-bold text-slate-300">Meilleur score</div>
            <div className="mt-2 text-5xl font-black">{data.bestScore || 0}%</div>
            <div className="mt-5"><ProgressBar value={data.accuracy || 0} max={100} label={`${data.accuracy || 0}% accuracy`} /></div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Sparkles size={20} />} label="Attempts" value={data.attemptsCount || 0} />
        <StatCard icon={<Flame size={20} />} label="Completed" value={data.completedCount || 0} />
        <StatCard icon={<Target size={20} />} label="Accuracy" value={`${data.accuracy || 0}%`} detail={`${data.totalCorrect || 0}/${data.totalQuestionsAnswered || 0} correctes`} />
        <StatCard icon={<Clock3 size={20} />} label="Temps d etude" value={formatHours(totalStudySeconds)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-xl font-black text-slate-950">Progression globale</h3><p className="text-sm font-semibold text-slate-400">Moyenne: {data.averageScore || 0}%</p></div>
            <Link to="/concours/concours" className="rounded-2xl bg-primary px-4 py-2 text-sm font-black text-white">Choisir un concours</Link>
          </div>
          <ProgressBar value={data.averageScore || 0} max={100} label="Average score" />
        </section>
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="text-xl font-black text-slate-950">Status</h3>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-emerald-50 p-4"><div className="text-sm font-black text-emerald-800">Base de donnees</div><p className="mt-1 text-sm text-emerald-700">Progression sauvegardee sur Firestore.</p></div>
            <div className="rounded-2xl bg-violet-50 p-4"><div className="text-sm font-black text-violet-800">Security</div><p className="mt-1 text-sm text-violet-700">Les scores sont calcules cote serveur.</p></div>
          </div>
        </section>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950"><Trophy size={20} className="text-primary" />Concours recommandes</h3>
          <div className="grid gap-3">
            {concours.slice(0, 3).map((item) => <Link key={item.id} to={`/concours/${item.slug}`} className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"><div className="font-black text-slate-900">{item.name}</div><div className="mt-1 text-sm text-slate-500">{item.questionCount || 0} questions disponibles</div></Link>)}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950"><Award size={20} className="text-primary" />Derniers resultats</h3>
          {recentAttempts.length === 0 ? <p className="text-sm text-slate-500">Aucune tentative pour le moment.</p> : (
            <div className="space-y-3">{recentAttempts.map((attempt) => <Link key={attempt.id} to={`/concours/${attempt.concoursSlug}/results/${attempt.id}`} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><div className="font-black text-slate-900">{attempt.concoursName}</div><div className="text-sm text-slate-500">{attempt.status}</div></div><Badge tone={attempt.status === 'IN_PROGRESS' ? 'amber' : 'green'}>{attempt.percentage || 0}%</Badge></Link>)}</div>
          )}
        </div>
      </section>
    </div>
  );
}
