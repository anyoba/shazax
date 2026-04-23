export default function ModuleCard({ moduleName, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group animate-rise rounded-[1.75rem] border border-white/80 bg-white/80 p-6 text-left shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-float"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-[#f7efe6] px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-cocoa">
            Module
          </span>
          <h3 className="mt-4 text-xl font-bold text-ink">{moduleName}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Open the resource categories for this subject and browse available material.
          </p>
        </div>
        <div className="rounded-full border border-[#ead9c5] bg-[#fffaf5] px-3 py-2 text-sm font-semibold text-cocoa transition group-hover:bg-cocoa group-hover:text-white">
          Open
        </div>
      </div>
    </button>
  );
}
