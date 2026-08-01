export default function ProgressBar({ value = 0, max = 100, label }) {
  const percent = Math.min(Math.max(Math.round((Number(value) / Number(max || 100)) * 100), 0), 100);

  return (
    <div>
      {label ? (
        <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
          <span>{label}</span>
          <span>{percent}%</span>
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
