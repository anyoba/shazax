import { Heart } from 'lucide-react';

export default function FavoriteQuestionButton({ active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
        active
          ? 'border-pink-200 bg-pink-50 text-pink-600'
          : 'border-slate-200 bg-white text-slate-400 hover:text-pink-600'
      }`}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart size={19} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
