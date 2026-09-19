import { Link } from 'react-router-dom';
import { ArrowLeft, Flag } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import QuizTimer from './QuizTimer.jsx';

export default function QuizHeader({ meta, mode, totalSeconds, onQuit }) {
  return (
    <div className="mb-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onQuit}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            aria-label="Quitter la session"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={mode === 'exam' ? 'amber' : 'blue'}>
                {mode === 'exam' ? 'Mode examen' : 'Mode entrainement'}
              </Badge>
              <Badge tone="violet">{meta.subjectName}</Badge>
            </div>
            <h1 className="mt-2 text-lg font-black text-slate-950">{meta.chapterName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <QuizTimer seconds={totalSeconds} />
          <Link
            to="/concours/mistakes"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
            aria-label="Carnet d erreurs"
          >
            <Flag size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
}
