import { Award, Clock3, Flame, Target, Trophy } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import Badge from '../../components/concours/common/Badge.jsx';
import LoadingState from '../../components/concours/common/LoadingState.jsx';
import ProgressBar from '../../components/concours/common/ProgressBar.jsx';
import StatCard from '../../components/concours/common/StatCard.jsx';
import { getConcoursProgress } from '../../services/concoursApi.js';

export default function ProgressPage() {
  const { getToken } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const body = await getConcoursProgress(getToken);
        if (!cancelled) setProgress(body.progress);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Impossible de charger la progression.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getToken]);

  if (loading) return <LoadingState label="Chargement de la progression..." />;
  const data = progress || {};

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <Badge tone="violet">Progression Firestore</Badge>
        <h2 className="mt-4 text-3xl font-black text-slate-950">Ton tableau de progression</h2>
        <div className="mt-6 max-w-2xl"><ProgressBar value={data.averageScore || 0} max={100} label={`Score moyen ${data.averageScore || 0}%`} /></div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Trophy size={20} />} label="Best score" value={`${data.bestScore || 0}%`} />
        <StatCard icon={<Target size={20} />} label="Questions resolues" value={data.totalQuestionsAnswered || 0} />
        <StatCard icon={<Award size={20} />} label="Taux de reussite" value={`${data.accuracy || 0}%`} />
        <StatCard icon={<Flame size={20} />} label="Attempts" value={data.attemptsCount || 0} />
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="text-xl font-black text-slate-950">Progression par concours</h3>
          <div className="mt-5 space-y-4">
            {(data.byConcours || []).length === 0 ? <p className="text-sm text-slate-500">Termine une tentative pour afficher les donnees.</p> : (data.byConcours || []).map((item) => <ProgressBar key={item.id} value={item.bestPercentage || 0} max={100} label={`${item.concoursId} - best ${item.bestPercentage || 0}%`} />)}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="text-xl font-black text-slate-950">Recent attempts</h3>
          <div className="mt-5 space-y-3">
            {(data.recentAttempts || []).length === 0 ? <p className="text-sm text-slate-500">Aucune tentative.</p> : data.recentAttempts.map((attempt) => <div key={attempt.id} className="rounded-2xl bg-slate-50 p-4"><div className="font-black text-slate-900">{attempt.concoursName}</div><div className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Clock3 size={16} />{attempt.status} - {attempt.percentage || 0}%</div></div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
