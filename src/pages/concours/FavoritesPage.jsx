import { Link } from 'react-router-dom';
import { Heart, Target } from 'lucide-react';
import EmptyState from '../../components/concours/common/EmptyState.jsx';

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3 text-primary"><Heart size={22} /><h2 className="text-3xl font-black text-slate-950">Favoris</h2></div>
        <p className="mt-3 text-sm leading-6 text-slate-500">Les favoris locaux ont ete retires pour garder Firestore comme source unique. Utilise les flags dans l examen et consulte tes resultats sauvegardes.</p>
      </section>
      <EmptyState title="Aucun favori serveur" description="Les questions flaggees restent dans tes attempts et seront exploitees dans une prochaine vue dediee." />
      <Link to="/concours/concours" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white"><Target size={17} />Choisir un concours</Link>
    </div>
  );
}
