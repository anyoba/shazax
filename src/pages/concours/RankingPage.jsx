import { Crown, Medal } from 'lucide-react';
import Badge from '../../components/concours/common/Badge.jsx';
import Tabs from '../../components/concours/common/Tabs.jsx';
import { concoursLeaderboard } from '../../data/concours/index.js';

export default function RankingPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <Badge tone="amber">Classement de demonstration</Badge>
        <h2 className="mt-4 text-3xl font-black text-slate-950">Classement national</h2>
        <p className="mt-2 text-sm text-slate-500">
          Donnees fictives locales. Aucun email, telephone ou nom complet n est affiche.
        </p>
        <div className="mt-5">
          <Tabs
            activeTab="global"
            onChange={() => {}}
            tabs={[
              { id: 'global', label: 'Global' },
              { id: 'medicine', label: 'Medecine soon' },
              { id: 'city', label: 'Par ville soon' },
            ]}
          />
        </div>
      </section>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-soft">
        {concoursLeaderboard.map((student) => (
          <div key={student.rank} className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-b-0">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-black ${
                student.rank <= 3 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {student.rank <= 3 ? <Crown size={20} /> : student.rank}
              </div>
              <div>
                <div className="font-black text-slate-950">{student.pseudo}</div>
                <div className="text-sm font-bold text-slate-400">Niveau {student.level}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-slate-950">{student.xp} XP</div>
              {student.badge ? (
                <div className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary">
                  <Medal size={13} />
                  {student.badge}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
