import { Menu } from 'lucide-react';

export default function ConcoursMobileHeader({ onOpen }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onOpen}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
        <div className="text-center">
          <div className="text-sm font-black text-slate-950">Shazax Concours</div>
          <div className="text-xs font-bold text-slate-400">QCM premium</div>
        </div>
        <div className="h-11 w-11" />
      </div>
    </header>
  );
}
