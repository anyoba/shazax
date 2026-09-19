import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, GraduationCap, Play, Search, Target } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/concours/common/Badge.jsx';
import EmptyState from '../../components/concours/common/EmptyState.jsx';
import LoadingState from '../../components/concours/common/LoadingState.jsx';
import ProgressBar from '../../components/concours/common/ProgressBar.jsx';
import SearchInput from '../../components/concours/common/SearchInput.jsx';
import { getConcoursDetail, getConcoursProgress, listConcours, startConcoursAttempt } from '../../services/concoursApi.js';

function getTone(status) {
  return status === 'published' ? 'green' : status === 'archived' ? 'slate' : 'amber';
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6 text-red-900 shadow-soft">
      <div className="font-black">Impossible de charger les concours</div>
      <p className="mt-2 text-sm leading-6">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white">Reessayer</button>
    </div>
  );
}

function ContestCard({ contest, progress }) {
  const concoursProgress = progress?.byConcours?.find((item) => item.concoursId === contest.id);
  const value = concoursProgress?.bestPercentage || 0;
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-float motion-reduce:hover:translate-y-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-black text-slate-950">{contest.name}</div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{contest.description || 'Preparation concours avec suivi complet.'}</p>
        </div>
        <Badge tone={getTone(contest.status)}>Publie</Badge>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-lg font-black text-slate-950">{contest.questionCount || 0}</div>
          <div className="text-xs font-bold text-slate-400">Questions</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-lg font-black text-slate-950">{contest.durationMinutes || 0}m</div>
          <div className="text-xs font-bold text-slate-400">Duree</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-lg font-black text-slate-950">{contest.year || '-'}</div>
          <div className="text-xs font-bold text-slate-400">Annee</div>
        </div>
      </div>
      <div className="mt-5">
        <ProgressBar value={value} max={100} label={value ? `Meilleur score ${value}%` : 'Aucun essai termine'} />
      </div>
      <Link to={`/concours/${contest.slug}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white">
        Explorer
        <ArrowRight size={17} />
      </Link>
    </article>
  );
}

function ContestDetail({ slug }) {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [detail, progressBody] = await Promise.all([
          getConcoursDetail(slug),
          getConcoursProgress(getToken).catch(() => ({ progress: null })),
        ]);
        if (!cancelled) {
          setContest(detail.concours);
          setProgress(progressBody.progress);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Concours introuvable.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getToken, slug]);

  async function startExam() {
    if (!contest) return;
    setStarting(true);
    setError('');
    try {
      const body = await startConcoursAttempt(contest.slug, getToken);
      navigate(`/concours/${contest.slug}/exam/${body.attempt.id}`);
    } catch (err) {
      setError(err?.message || 'Impossible de demarrer cet examen.');
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <LoadingState label="Chargement du concours..." />;
  if (error && !contest) return <ErrorPanel message={error} onRetry={() => window.location.reload()} />;
  if (!contest) return <EmptyState title="Concours introuvable" description="Ce concours n est pas publie ou n existe pas." />;

  const itemProgress = progress?.byConcours?.find((item) => item.concoursId === contest.id);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="green">Concours publie</Badge>
            <h2 className="mt-4 text-4xl font-black text-slate-950">{contest.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{contest.description}</p>
          </div>
          <button type="button" disabled={starting || !contest.questionCount} onClick={startExam} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
            <Play size={17} />
            {starting ? 'Creation...' : itemProgress?.attemptsCount ? 'Continuer / Recommencer' : 'Start Exam'}
          </button>
        </div>
        {error ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-violet-50 p-4 text-violet-800"><GraduationCap size={18} /><div className="mt-2 text-2xl font-black">{contest.school || '-'}</div><div className="text-sm font-bold">ecole</div></div>
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-800"><Calendar size={18} /><div className="mt-2 text-2xl font-black">{contest.year}</div><div className="text-sm font-bold">annee</div></div>
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800"><Target size={18} /><div className="mt-2 text-2xl font-black">{contest.questionCount}</div><div className="text-sm font-bold">questions</div></div>
          <div className="rounded-2xl bg-amber-50 p-4 text-amber-800"><Clock size={18} /><div className="mt-2 text-2xl font-black">{contest.durationMinutes}m</div><div className="text-sm font-bold">duree</div></div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="text-xl font-black text-slate-950">Modules</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {(contest.modules?.length ? contest.modules : [contest.category || 'General']).map((module) => <Badge key={module} tone="blue">{module}</Badge>)}
          </div>
        </article>
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="text-xl font-black text-slate-950">Historique</h3>
          <p className="mt-2 text-sm text-slate-500">{itemProgress?.attemptsCount || 0} tentatives, meilleur score {itemProgress?.bestPercentage || 0}%.</p>
        </article>
      </section>
    </div>
  );
}

export default function ContestsPage() {
  const { contestSlug } = useParams();
  const { getToken } = useAuth();
  const [query, setQuery] = useState('');
  const [school, setSchool] = useState('all');
  const [year, setYear] = useState('all');
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contestSlug) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [body, progressBody] = await Promise.all([
          listConcours(),
          getConcoursProgress(getToken).catch(() => ({ progress: null })),
        ]);
        if (!cancelled) {
          setItems(body.concours || []);
          setProgress(progressBody.progress);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Impossible de charger les concours.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [contestSlug, getToken]);

  const schools = useMemo(() => ['all', ...new Set(items.map((item) => item.school).filter(Boolean))], [items]);
  const years = useMemo(() => ['all', ...new Set(items.map((item) => item.year).filter(Boolean))], [items]);
  const categories = useMemo(() => ['all', ...new Set(items.map((item) => item.category).filter(Boolean))], [items]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesText = !normalized || [item.name, item.description, item.school, item.category].some((value) => String(value || '').toLowerCase().includes(normalized));
      return matchesText && (school === 'all' || item.school === school) && (year === 'all' || item.year === year) && (category === 'all' || item.category === category);
    });
  }, [category, items, query, school, year]);

  if (contestSlug) return <ContestDetail slug={contestSlug} />;
  if (loading) return <LoadingState label="Chargement des concours..." />;
  if (error) return <ErrorPanel message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-950">Mes concours</h2>
            <p className="mt-2 text-sm text-slate-500">Concours publies, attempts persistants et resultats securises.</p>
          </div>
          <div className="w-full lg:max-w-sm"><SearchInput value={query} onChange={setQuery} placeholder="Rechercher un concours" /></div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[['school', school, setSchool, schools], ['year', year, setYear, years], ['category', category, setCategory, categories]].map(([id, value, setter, options]) => (
            <label key={id} className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-slate-400"><Search size={13} />{id}</span>
              <select value={value} onChange={(event) => setter(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
                {options.map((option) => <option key={option} value={option}>{option === 'all' ? 'Tous' : option}</option>)}
              </select>
            </label>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? <EmptyState title="Aucun concours publie" description="Publie un concours depuis l admin pour le voir ici." /> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => <ContestCard key={item.id} contest={item} progress={progress} />)}
        </div>
      )}
    </div>
  );
}
