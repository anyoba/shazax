import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Play, Target } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/concours/common/Badge.jsx';
import EmptyState from '../../components/concours/common/EmptyState.jsx';
import LoadingState from '../../components/concours/common/LoadingState.jsx';
import ProgressBar from '../../components/concours/common/ProgressBar.jsx';
import { listConcours, startConcoursAttempt } from '../../services/concoursApi.js';

export default function TrainingSetupPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const body = await listConcours();
        if (cancelled) return;
        const concours = body.concours || [];
        setItems(concours);
        const requested = params.get('contest') || params.get('slug');
        setSelectedSlug(concours.find((item) => item.slug === requested || item.id === requested)?.slug || concours[0]?.slug || '');
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Impossible de charger les concours.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params]);

  const selected = useMemo(() => items.find((item) => item.slug === selectedSlug), [items, selectedSlug]);

  async function start() {
    if (!selected) return;
    setStarting(true);
    setError('');
    try {
      const body = await startConcoursAttempt(selected.slug, getToken);
      navigate(`/concours/${selected.slug}/exam/${body.attempt.id}`);
    } catch (err) {
      setError(err?.message || 'Impossible de demarrer.');
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <LoadingState label="Chargement..." />;
  if (items.length === 0) return <EmptyState title="Aucun concours publie" description="Publie un concours depuis l admin pour demarrer un examen." />;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <Badge tone="violet">Exam setup</Badge>
        <h2 className="mt-4 text-3xl font-black text-slate-950">Choisis un concours publie</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">La session sera creee dans Firestore, avec timer serveur et sauvegarde des reponses.</p>
        {error ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <button key={item.id} type="button" onClick={() => setSelectedSlug(item.slug)} className={`rounded-2xl border p-5 text-left transition ${selectedSlug === item.slug ? 'border-primary bg-violet-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <div className="font-black text-slate-950">{item.name}</div>
              <div className="mt-2 text-sm text-slate-500">{item.school} - {item.year}</div>
              <div className="mt-4 flex gap-2 text-xs font-black text-slate-400"><span>{item.questionCount || 0} questions</span><span>{item.durationMinutes || 0} min</span></div>
            </button>
          ))}
        </div>
      </section>

      <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-primary"><Target size={22} /></div>
        <h3 className="mt-4 text-xl font-black text-slate-950">Apercu</h3>
        {selected ? (
          <div className="mt-5 space-y-4">
            <ProgressBar value={selected.questionCount || 0} max={Math.max(selected.questionCount || 1, 1)} label={`${selected.questionCount || 0} questions disponibles`} />
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600"><Clock size={16} className="mr-2 inline" />{selected.durationMinutes || 0} minutes</div>
            <button type="button" disabled={starting || !selected.questionCount} onClick={start} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-black text-white shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-50"><Play size={18} />{starting ? 'Creation...' : 'Lancer examen'}</button>
            <Link to={`/concours/${selected.slug}`} className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">Voir details</Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
