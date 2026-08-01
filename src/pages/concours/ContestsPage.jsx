import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Search, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import Badge from '../../components/concours/common/Badge.jsx';
import EmptyState from '../../components/concours/common/EmptyState.jsx';
import ProgressBar from '../../components/concours/common/ProgressBar.jsx';
import SearchInput from '../../components/concours/common/SearchInput.jsx';
import { concoursContests } from '../../data/concours/index.js';
import { getChaptersForSubject, getContestBySlug, getCatalogStats, getSubjectsForContest } from '../../utils/concours/catalog.js';
import { getProgress } from '../../services/concoursLocalStorage.js';

function ContestCard({ contest }) {
  const stats = getCatalogStats(contest.id);
  const progress = getProgress();
  const localProgress = contest.id === 'medicine' ? Math.min(Math.round(progress.totalAnswered / 80 * 100), 100) : 0;

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-float motion-reduce:hover:translate-y-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-black text-slate-950">{contest.name}</div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{contest.description}</p>
        </div>
        <Badge tone={contest.status === 'active' ? 'green' : 'amber'}>
          {contest.status === 'active' ? 'Actif' : 'Soon'}
        </Badge>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-lg font-black text-slate-950">{stats.subjectsCount}</div>
          <div className="text-xs font-bold text-slate-400">Matieres</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-lg font-black text-slate-950">{stats.chaptersCount}</div>
          <div className="text-xs font-bold text-slate-400">Chapitres</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="text-lg font-black text-slate-950">{stats.questionsCount}</div>
          <div className="text-xs font-bold text-slate-400">QCM</div>
        </div>
      </div>
      <div className="mt-5">
        <ProgressBar value={localProgress} max={100} label="Progression locale" />
      </div>
      <Link
        to={`/concours/concours/${contest.slug}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white"
      >
        Explorer
        <ArrowRight size={17} />
      </Link>
    </article>
  );
}

function ContestDetail({ contest }) {
  const subjects = getSubjectsForContest(contest.id);
  const stats = getCatalogStats(contest.id);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone={contest.status === 'active' ? 'green' : 'amber'}>
              {contest.status === 'active' ? 'Concours actif' : 'Preparation en cours'}
            </Badge>
            <h2 className="mt-4 text-4xl font-black text-slate-950">{contest.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{contest.description}</p>
          </div>
          <Link
            to={`/concours/training?contest=${contest.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            <Target size={17} />
            Commencer
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-violet-50 p-4 text-violet-800">
            <div className="text-2xl font-black">{stats.subjectsCount}</div>
            <div className="text-sm font-bold">matieres</div>
          </div>
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-800">
            <div className="text-2xl font-black">{stats.chaptersCount}</div>
            <div className="text-sm font-bold">chapitres</div>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
            <div className="text-2xl font-black">{stats.questionsCount}</div>
            <div className="text-sm font-bold">questions</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {subjects.map((subject) => {
          const chapters = getChaptersForSubject(contest.id, subject.id);
          return (
            <article key={subject.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
              <h3 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <BookOpen size={19} className="text-primary" />
                {subject.name}
              </h3>
              <p className="mt-2 text-sm text-slate-500">{subject.description}</p>
              <div className="mt-5 space-y-3">
                {chapters.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-400">Chapitres bientot disponibles.</div>
                ) : (
                  chapters.map((chapter) => (
                    <Link
                      key={chapter.id}
                      to={`/concours/training?contest=${contest.id}&subject=${subject.id}&chapter=${chapter.id}`}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 hover:bg-violet-50"
                    >
                      <span className="font-black text-slate-800">{chapter.name}</span>
                      <span className="text-sm font-bold text-slate-400">{chapter.estimatedQuestions} QCM</span>
                    </Link>
                  ))
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default function ContestsPage() {
  const { contestSlug } = useParams();
  const [query, setQuery] = useState('');
  const contest = contestSlug ? getContestBySlug(contestSlug) : null;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return concoursContests.filter((item) => {
      return !normalized || item.name.toLowerCase().includes(normalized) || item.description.toLowerCase().includes(normalized);
    });
  }, [query]);

  if (contestSlug) {
    return contest ? <ContestDetail contest={contest} /> : <EmptyState title="Concours introuvable" description="Ce concours n existe pas dans la demo locale." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-950">Mes concours</h2>
            <p className="mt-2 text-sm text-slate-500">Explore les parcours de preparation disponibles en demo.</p>
          </div>
          <div className="w-full lg:max-w-sm">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un concours" />
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <ContestCard key={item.id} contest={item} />
          ))}
        </div>
      )}
    </div>
  );
}
