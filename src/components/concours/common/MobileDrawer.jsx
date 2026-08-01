import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function MobileDrawer({ children, open, onClose, title = 'Menu' }) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] lg:hidden">
      <button
        type="button"
        aria-label="Fermer le menu"
        className="absolute inset-0 bg-slate-950/35"
        onClick={onClose}
      />
      <aside className="absolute left-0 top-0 h-full w-[min(20rem,85vw)] overflow-y-auto bg-white p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-black text-slate-900">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
