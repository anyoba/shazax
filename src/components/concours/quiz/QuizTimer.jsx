import { Clock } from 'lucide-react';

function formatTime(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export default function QuizTimer({ seconds, label = 'Temps' }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
      <Clock size={16} className="text-primary" />
      <span className="sr-only">{label}</span>
      {formatTime(seconds)}
    </div>
  );
}
