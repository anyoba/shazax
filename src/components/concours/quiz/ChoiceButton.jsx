export default function ChoiceButton({ choice, disabled, isCorrect, isSelected, isWrong, onSelect }) {
  const stateClass = isCorrect
    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
    : isWrong
      ? 'border-red-300 bg-red-50 text-red-800'
      : isSelected
        ? 'border-primary bg-violet-50 text-violet-800'
        : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-violet-50/50';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(choice.id)}
      className={`flex w-full items-start gap-3 rounded-[1.25rem] border p-4 text-left text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-default ${stateClass}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-soft">
        {choice.id}
      </span>
      <span className="pt-1">{choice.text}</span>
    </button>
  );
}
