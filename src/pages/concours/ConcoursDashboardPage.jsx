import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Activity, Award, BookOpen, Clock3, Flame, Sparkles, Target, Trophy } from 'lucide-react';
import { concoursContests } from '../../data/concours/index.js';
import StatCard from '../../components/concours/common/StatCard.jsx';
import ProgressBar from '../../components/concours/common/ProgressBar.jsx';
import Badge from '../../components/concours/common/Badge.jsx';
import {
  getProgress,
  getSessions,
  getSettings,
} from '../../services/concoursLocalStorage.js';
import { getCatalogStats, getContestById } from '../../utils/concours/catalog.js';
import { getLevelForXp, getNextLevelProgress } from '../../utils/concours/scoring.js';

function formatHours(seconds = 0) {
  return `${Math.max(Math.round(seconds / 3600), 1)}h`;
}

export default function ConcoursDashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || user?.fullName?.split(' ')?.[0] || 'Etudiant';
  const progress = getProgress();
  const settings = getSettings();
  const sessions = getSessions();
  const level = getLevelForXp(progress.xp);
  const nextProgress = getNextLevelProgress(progress.xp);
  const lastSession = sessions[0];
  const successRate = progress.totalAnswered
    ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
    : 0;
  const dailyValue = Math.min(progress.totalAnswered % settings.dailyGoal, settings.dailyGoal);
  const recentSessions = sessions.slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-float sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="blue">Espace premium local</Badge>
            <h2 className="mt-4 max-w-2xl text-3xl font-black sm:text-5xl">
              {firstName}, transforme tes QCM en reflexes de concours.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Entrainement immediat, corrections detaillees, XP, favoris et carnet d erreurs. Tout fonctionne localement pour cette premiere version.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5">
            <div className="text-sm font-bold text-slate-300">Niveau actuel</div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-black">{level.level}</span>
              <span className="pb-2 text-sm font-bold text-slate-300">{level.label}</span>
            </div>
            <div className="mt-5">
              <ProgressBar value={nextProgress.percent} max={100} label={`${nextProgress.remaining} XP avant le prochain palier`} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Sparkles size={20} />} label="XP total" value={progress.xp} detail="+10 XP par bonne reponse sans indice" />
        <StatCard icon={<Flame size={20} />} label="Streak" value={`${progress.streak} jours`} detail="Objectif de regularite" />
        <StatCard icon={<Target size={20} />} label="Reussite" value={`${successRate}%`} detail={`${progress.totalCorrect}/${progress.totalAnswered} bonnes reponses`} />
        <StatCard icon={<Clock3 size={20} />} label="Temps d etude" value={formatHours(progress.totalStudySeconds)} detail="Temps local estime" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-950">Progression quotidienne</h3>
              <p className="text-sm font-semibold text-slate-400">Objectif : {settings.dailyGoal} questions par jour</p>
            </div>
            <Link to="/concours/training" className="rounded-2xl bg-primary px-4 py-2 text-sm font-black text-white">
              Commencer
            </Link>
          </div>
          <ProgressBar value={dailyValue} max={settings.dailyGoal} label={`${dailyValue}/${settings.dailyGoal} questions`} />
          {lastSession ? (
            <Link
              to={`/concours/session/${lastSession.id}`}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <Activity size={17} />
              Continuer ma derniere session
            </Link>
          ) : null}
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="text-xl font-black text-slate-950">Matieres fortes et faibles</h3>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <div className="text-sm font-black text-emerald-800">Fortes</div>
              <p className="mt-1 text-sm text-emerald-700">Limites, suites logiques, calcul direct</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <div className="text-sm font-black text-amber-800">A renforcer</div>
              <p className="mt-1 text-sm text-amber-700">Developpements limites, interpretation graphique</p>
            </div>
          </div>
        </section>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950">
            <Trophy size={20} className="text-primary" />
            Concours recommandes
          </h3>
          <div className="grid gap-3">
            {concoursContests.slice(0, 3).map((contest) => {
              const stats = getCatalogStats(contest.id);
              return (
                <Link key={contest.id} to={`/concours/concours/${contest.slug}`} className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <div className="font-black text-slate-900">{contest.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{stats.questionsCount} questions disponibles</div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950">
            <Award size={20} className="text-primary" />
            Derniers resultats
          </h3>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune session terminee pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => {
                const contest = getContestById(session.config?.contestId);
                return (
                  <Link key={session.id} to={`/concours/results/${session.id}`} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div>
                      <div className="font-black text-slate-900">{contest?.name || 'Concours'}</div>
                      <div className="text-sm text-slate-500">{session.summary?.successRate || 0}% de reussite</div>
                    </div>
                    <Badge tone="green">+{session.summary?.totalXp || 0} XP</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
