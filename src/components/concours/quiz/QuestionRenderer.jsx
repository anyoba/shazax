import Badge from '../common/Badge.jsx';
import ChoiceButton from './ChoiceButton.jsx';
import FavoriteQuestionButton from './FavoriteQuestionButton.jsx';
import HintPanel from './HintPanel.jsx';
import NumericAnswerInput from './NumericAnswerInput.jsx';
import QuestionMedia from './QuestionMedia.jsx';
import ReportQuestionButton from './ReportQuestionButton.jsx';

const DIFFICULTY_TONES = {
  easy: 'green',
  medium: 'amber',
  hard: 'red',
};

const DIFFICULTY_LABELS = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

export default function QuestionRenderer({
  answer,
  favorite,
  hintVisible,
  locked,
  meta,
  question,
  selectedAnswer,
  onReport,
  onSelect,
  onToggleFavorite,
}) {
  const isNumeric = question.type === 'numeric';

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge tone={DIFFICULTY_TONES[question.difficulty] || 'slate'}>
            {DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
          </Badge>
          <Badge tone="blue">{meta.contestName}</Badge>
          <Badge tone="slate">{meta.chapterName}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteQuestionButton active={favorite} onToggle={onToggleFavorite} />
          <ReportQuestionButton onReport={onReport} />
        </div>
      </div>

      <p className="text-lg font-black leading-8 text-slate-950 sm:text-2xl">{question.statement}</p>

      {question.statementLatex ? (
        <div className="mt-5 overflow-x-auto rounded-[1.25rem] border border-violet-100 bg-violet-50 px-4 py-4 font-mono text-sm font-bold text-violet-900">
          {question.statementLatex}
        </div>
      ) : null}

      <QuestionMedia imageUrl={question.imageUrl} />

      {isNumeric ? (
        <NumericAnswerInput disabled={locked} value={selectedAnswer} onChange={onSelect} />
      ) : (
        <div className="mt-6 grid gap-3">
          {(question.choices || []).map((choice) => {
            const isSelected = selectedAnswer === choice.id;
            const isCorrect = locked && choice.id === question.correctChoiceId;
            const isWrong = locked && isSelected && !answer?.correct;

            return (
              <ChoiceButton
                key={choice.id}
                choice={choice}
                disabled={locked}
                isCorrect={isCorrect}
                isSelected={isSelected}
                isWrong={isWrong}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      )}

      <HintPanel hint={question.hint} visible={hintVisible} />
    </article>
  );
}
