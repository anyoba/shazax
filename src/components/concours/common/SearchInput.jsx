import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Rechercher' }) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 shadow-soft outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}
