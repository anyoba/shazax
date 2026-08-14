import { Link } from 'react-router-dom';
import { RotateCcw, Target } from 'lucide-react';
import EmptyState from '../../components/concours/common/EmptyState.jsx';

export default function MistakesPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3 text-primary"><RotateCcw size={22} /><h2 className="text-3xl font-black text-slate-950">Carnet d erreurs</h2></div>
        <p className="mt-3 text-sm leading-6 text-slate-500">Les erreurs sont maintenant calculees depuis les resultats serveur. Ouvre un resultat recent pour revoir chaque question, ta reponse, la bonne reponse et l explication.</p>
      </section>
      <EmptyState title="Revue disponible dans les resultats" description="Termine un concours pour voir la correction complete question par question." />
      <Link to="/concours/progress" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white"><Target size={17} />Voir ma progression</Link>
    </div>
  );
}
