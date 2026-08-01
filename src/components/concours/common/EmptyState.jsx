import { SearchX } from 'lucide-react';

export default function EmptyState({ title = 'Aucun resultat', description = 'Essaie avec un autre filtre.' }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center shadow-soft">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <SearchX size={22} />
      </div>
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}
