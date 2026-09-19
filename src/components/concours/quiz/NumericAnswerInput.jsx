export default function NumericAnswerInput({ disabled, value, onChange }) {
  return (
    <label className="mt-5 block">
      <span className="mb-2 block text-sm font-black text-slate-700">Reponse numerique</span>
      <input
        type="number"
        inputMode="decimal"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 text-lg font-black text-slate-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-slate-50"
        placeholder="Entrer un nombre"
      />
    </label>
  );
}
