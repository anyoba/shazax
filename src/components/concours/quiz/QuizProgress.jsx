import ProgressBar from '../common/ProgressBar.jsx';

export default function QuizProgress({ currentIndex, total }) {
  return (
    <div className="mb-5 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex justify-between text-sm font-black text-slate-700">
        <span>Question {currentIndex + 1}</span>
        <span>{currentIndex + 1}/{total}</span>
      </div>
      <ProgressBar value={currentIndex + 1} max={total} />
    </div>
  );
}
