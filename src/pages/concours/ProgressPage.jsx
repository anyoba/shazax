import { Award, Clock3, Flame, Target, Trophy } from 'lucide-react';
import Badge from '../../components/concours/common/Badge.jsx';
import ProgressBar from '../../components/concours/common/ProgressBar.jsx';
import StatCard from '../../components/concours/common/StatCard.jsx';
import { concoursBadges } from '../../data/concours/index.js';
import { getProgress, getSessions } from '../../services/concoursLocalStorage.js';
import { buildChapterPerformance, getNextLevelProgress } from '../../utils/concours/scoring.js';

export default function ProgressPage() {
  const progress = getProgress();
  const sessions = getSessions();
  const levelProgress = getNextLevelProgress(progress.xp);
  const successRate = progress.totalAnswered ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) : 0;
  const chapterPerformance = buildChapterPerformance(sessions);
  const unlockedBadges = concoursBadges.filter((badge) => progress.badges?.includes(badge.id));

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <Badge tone="violet">Progression locale</Badge>
        <h2 className="mt-4 text-3xl font-black text-slate-950">Ton tableau de progression</h2>
        <div className="mt-6 max-w-2xl">
          <ProgressBar value={levelProgress.percent} max={100} label={`Niveau ${levelProgress.current.level} - ${levelProgress.current.label}`} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Trophy size={20} />} label="XP" value={progress.xp} />
        <StatCard icon={<Target size={20} />} label="Questions resolues" value={progress.totalAnswered} />
        <StatCard icon={<Award size={20} />} label="Taux de reussite" value={`${successRate}%`} />
        <StatCard icon={<Flame size={20} />} label="Streak" value={`${progress.streak} jours`} />
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="text-xl font-black text-slate-950">Reussite par chapitre</h3>
          <div className="mt-5 space-y-4">
            {chapterPerformance.length === 0 ? (
              <p className="text-sm text-slate-500">Termine une session pour afficher les donnees.</p>
            ) : (
              chapterPerformance.map((item) => (
                <ProgressBar key={item.chapterId} value={item.rate} max={100} label={`${item.name} (${item.correct}/${item.total})`} />
              ))
            )}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="text-xl font-black text-slate-950">Badges</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {unlockedBadges.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun badge debloque pour le moment.</p>
            ) : (
              unlockedBadges.map((badge) => <Badge key={badge.id} tone="amber">{badge.name}</Badge>)
            )}
          </div>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            <Clock3 size={16} className="mr-2 inline text-primary" />
            Evolution des scores : graphique simple local, pret pour une future source serveur.
          </div>
        </div>
      </section>
    </div>
  );
}
