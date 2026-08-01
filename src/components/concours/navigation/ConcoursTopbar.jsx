import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

export default function ConcoursTopbar() {
  const { user } = useUser();
  const firstName = user?.firstName || user?.fullName?.split(' ')?.[0] || 'Etudiant';

  return (
    <div className="mb-6 hidden items-center justify-between gap-4 lg:flex">
      <div>
        <p className="text-sm font-bold text-slate-400">Bonjour {firstName}</p>
        <h1 className="text-2xl font-black text-slate-950">Prepare tes concours avec precision</h1>
      </div>
      <Link
        to="/concours/training"
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10"
      >
        <Sparkles size={17} />
        Nouvelle serie
      </Link>
    </div>
  );
}
