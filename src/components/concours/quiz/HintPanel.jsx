import { Lightbulb } from 'lucide-react';

export default function HintPanel({ hint, visible }) {
  if (!visible) return null;

  return (
    <div className="mt-5 rounded-[1.25rem] border border-amber-100 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-start gap-3">
        <Lightbulb size={18} className="mt-0.5 shrink-0" />
        <div>
          <div className="text-sm font-black">Indice leger</div>
          <p className="mt-1 text-sm leading-6">{hint}</p>
        </div>
      </div>
    </div>
  );
}
