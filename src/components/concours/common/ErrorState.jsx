import { AlertTriangle } from 'lucide-react';

export default function ErrorState({ title = 'Une erreur est survenue', description, onRetry }) {
  return (
    <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-6 text-red-800">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} />
        <div>
          <h3 className="font-black">{title}</h3>
          {description ? <p className="mt-1 text-sm text-red-700">{description}</p> : null}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
            >
              Reessayer
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
