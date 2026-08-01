export default function StatCard({ icon, label, value, detail }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-primary">
        {icon}
      </div>
      <div className="text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-500">{label}</div>
      {detail ? <div className="mt-3 text-xs text-slate-400">{detail}</div> : null}
    </div>
  );
}
