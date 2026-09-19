export default function Toast({ message, tone = 'green' }) {
  if (!message) return null;

  const toneClass = tone === 'red' ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-bold shadow-soft ${toneClass}`}>
      {message}
    </div>
  );
}
