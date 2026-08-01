import { ArrowLeft, ArrowRight, Check, SkipForward } from 'lucide-react';

export default function QuizNavigation({
  canCheck,
  canGoNext,
  canGoPrevious,
  isLast,
  locked,
  mode,
  onCheck,
  onFinish,
  onNext,
  onPrevious,
  onSkip,
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        disabled={!canGoPrevious}
        onClick={onPrevious}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 disabled:opacity-40"
      >
        <ArrowLeft size={17} />
        Precedent
      </button>

      <div className="flex flex-col gap-3 sm:flex-row">
        {!locked ? (
          <>
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600"
            >
              <SkipForward size={17} />
              Passer
            </button>
            <button
              type="button"
              disabled={!canCheck}
              onClick={onCheck}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white disabled:opacity-40"
            >
              <Check size={17} />
              {mode === 'exam' ? 'Valider' : 'Check Answer'}
            </button>
          </>
        ) : null}

        {isLast ? (
          <button
            type="button"
            onClick={onFinish}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            Terminer
          </button>
        ) : (
          <button
            type="button"
            disabled={!canGoNext}
            onClick={onNext}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-40"
          >
            Suivant
            <ArrowRight size={17} />
          </button>
        )}
      </div>
    </div>
  );
}
