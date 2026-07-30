import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
          <ShieldAlert size={26} />
        </div>
        <h1 className="text-2xl font-bold">Acces refuse</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Votre compte est connecte, mais il ne possede pas les permissions necessaires pour
          ouvrir cette zone d'administration.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          <ArrowLeft size={16} />
          Retour a l'accueil
        </Link>
      </div>
    </div>
  );
}
