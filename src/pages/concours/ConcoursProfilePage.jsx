import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Save, UserRound } from 'lucide-react';
import Badge from '../../components/concours/common/Badge.jsx';
import Toast from '../../components/concours/common/Toast.jsx';
import { concoursContests } from '../../data/concours/index.js';
import { getProfile, saveProfile } from '../../services/concoursLocalStorage.js';

const BAC_TRACKS = ['Sciences mathematiques', 'Sciences physiques', 'SVT', 'Economie', 'Technique', 'Autre'];

function estimateScore(profile) {
  const regional = Number(profile.regionalScore || 0);
  const national = Number(profile.nationalScore || 0);
  const base = regional * 0.25 + national * 0.75;
  const ambition = profile.targetContests?.includes('medicine') ? 0.9 : 0.8;
  return Math.round(base * ambition * 100) / 100;
}

export default function ConcoursProfilePage() {
  const { user } = useUser();
  const savedProfile = getProfile();
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    pseudo: savedProfile.pseudo || user?.username || 'ShazaxStudent',
    phone: '',
    city: '',
    bacTrack: BAC_TRACKS[0],
    bacYear: '2026',
    regionalScore: '',
    nationalScore: '',
    targetContests: ['medicine'],
    goal: 'Reussir le concours medecine',
    ...savedProfile,
  });
  const [message, setMessage] = useState('');
  const estimate = estimateScore(profile);

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function toggleContest(contestId) {
    setProfile((current) => {
      const currentTargets = current.targetContests || [];
      return {
        ...current,
        targetContests: currentTargets.includes(contestId)
          ? currentTargets.filter((id) => id !== contestId)
          : [...currentTargets, contestId],
      };
    });
  }

  function submit(event) {
    event.preventDefault();
    saveProfile(profile);
    setMessage('Profil concours enregistre localement.');
    window.setTimeout(() => setMessage(''), 1800);
  }

  return (
    <div className="space-y-6">
      <Toast message={message} />
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-primary">
            <UserRound size={24} />
          </div>
          <div>
            <Badge tone="blue">Profil local</Badge>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Mon profil Concours</h2>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['firstName', 'Prenom'],
              ['lastName', 'Nom'],
              ['pseudo', 'Pseudo public'],
              ['phone', 'Telephone'],
              ['city', 'Ville'],
              ['bacYear', 'Annee du bac'],
              ['regionalScore', 'Note regionale'],
              ['nationalScore', 'Note nationale'],
            ].map(([field, label]) => (
              <label key={field} className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
                <input
                  value={profile[field] || ''}
                  onChange={(event) => update(field, event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>
            ))}
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-black text-slate-700">Filiere du bac</span>
              <select
                value={profile.bacTrack}
                onChange={(event) => update('bacTrack', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold"
              >
                {BAC_TRACKS.map((track) => <option key={track}>{track}</option>)}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-black text-slate-700">Objectif</span>
              <textarea
                value={profile.goal}
                onChange={(event) => update('goal', event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold"
              />
            </label>
          </div>
          <button type="submit" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white">
            <Save size={17} />
            Enregistrer localement
          </button>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-lg font-black text-slate-950">Concours cibles</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {concoursContests.map((contest) => (
                <button
                  key={contest.id}
                  type="button"
                  onClick={() => toggleContest(contest.id)}
                  className={`rounded-full px-3 py-2 text-xs font-black ${
                    profile.targetContests?.includes(contest.id)
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {contest.name}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-blue-100 bg-blue-50 p-6 text-blue-900 shadow-soft">
            <h3 className="text-lg font-black">Estimateur de seuil</h3>
            <div className="mt-3 text-4xl font-black">{estimate}/20</div>
            <p className="mt-3 text-sm leading-6">
              Estimation indicative pour t aider a te situer. Ce calcul n est pas officiel et ne garantit aucune admission.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
