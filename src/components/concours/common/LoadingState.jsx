import { Loader2 } from 'lucide-react';

export default function LoadingState({ label = 'Chargement...' }) {
  return (
    <div className="flex min-h-[16rem] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-soft">
        <Loader2 size={18} className="animate-spin text-primary" />
        {label}
      </div>
    </div>
  );
}
