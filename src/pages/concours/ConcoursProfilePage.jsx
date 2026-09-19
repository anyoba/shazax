import { useUser } from '@clerk/clerk-react';
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import Badge from '../../components/concours/common/Badge.jsx';
import LoadingState from '../../components/concours/common/LoadingState.jsx';
import StatCard from '../../components/concours/common/StatCard.jsx';
import { getConcoursProgress } from '../../services/concoursApi.js';

export default function ConcoursProfilePage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getConcoursProgress(getToken)
      .then((body) => { if (!cancelled) setProgress(body.progress); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [getToken]);

  if (loading) return <LoadingState label="Chargement profil..." />;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <Badge tone="violet">Profil compte</Badge>
        <div className="mt-5 flex items-center gap-4">
          {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-primary"><User size={28} /></div>}
          <div><h2 className="text-3xl font-black text-slate-950">{user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Student'}</h2><p className="mt-1 text-sm text-slate-500">{user?.primaryEmailAddress?.emailAddress}</p></div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<User size={20} />} label="Attempts" value={progress?.attemptsCount || 0} />
        <StatCard icon={<User size={20} />} label="Completed" value={progress?.completedCount || 0} />
        <StatCard icon={<User size={20} />} label="Best score" value={`${progress?.bestScore || 0}%`} />
        <StatCard icon={<User size={20} />} label="Accuracy" value={`${progress?.accuracy || 0}%`} />
      </div>
    </div>
  );
}
