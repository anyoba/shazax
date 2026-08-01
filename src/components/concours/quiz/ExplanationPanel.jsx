import { CheckCircle2, XCircle } from 'lucide-react';
import { getCorrectAnswerLabel } from '../../../utils/concours/scoring.js';

export default function ExplanationPanel({ answer, question, visible }) {
  if (!visible || !answer) return null;

  return (
    <div
      className={`mt-5 rounded-[1.25rem] border p-5 ${
        answer.correct ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {answer.correct ? (
          <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-emerald-600" />
        ) : (
          <XCircle size={21} className="mt-0.5 shrink-0 text-red-600" />
        )}
        <div>
          <h3 className={`font-black ${answer.correct ? 'text-emerald-900' : 'text-red-900'}`}>
            {answer.correct ? 'Bonne reponse' : 'Correction'}
          </h3>
          {!answer.correct ? (
            <p className="mt-1 text-sm font-bold text-slate-700">
              Bonne reponse : {getCorrectAnswerLabel(question)}
            </p>
          ) : null}
          <p className="mt-3 text-sm leading-6 text-slate-700">{question.explanation}</p>
          {question.quickTip ? (
            <div className="mt-4 rounded-2xl bg-white/70 p-3 text-sm font-bold text-slate-700">
              Astuce : {question.quickTip}
            </div>
          ) : null}
          <div className="mt-3 text-xs font-black text-slate-400">XP gagne : +{answer.xp}</div>
        </div>
      </div>
    </div>
  );
}
