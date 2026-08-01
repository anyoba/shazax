import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Play, Target } from 'lucide-react';
import Badge from '../../components/concours/common/Badge.jsx';
import ProgressBar from '../../components/concours/common/ProgressBar.jsx';
import { concoursContests } from '../../data/concours/index.js';
import { createSession } from '../../services/concoursLocalStorage.js';
import {
  DIFFICULTIES,
  QUESTION_COUNT_OPTIONS,
  getChaptersForSubject,
  getQuestionsForConfig,
  getSubjectsForContest,
} from '../../utils/concours/catalog.js';

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function TrainingSetupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialContest = params.get('contest') || 'medicine';
  const initialSubject = params.get('subject') || 'math';
  const initialChapter = params.get('chapter') || 'limits';
  const initialMode = params.get('mode') || 'training';
  const [config, setConfig] = useState({
    contestId: initialContest,
    subjectId: initialSubject,
    chapterId: initialChapter,
    questionCount: 10,
    difficulty: 'mixed',
    timerEnabled: true,
    mode: initialMode,
  });

  const subjects = useMemo(() => getSubjectsForContest(config.contestId), [config.contestId]);
  const chapters = useMemo(
    () => getChaptersForSubject(config.contestId, config.subjectId),
    [config.contestId, config.subjectId],
  );
  const availableQuestions = getQuestionsForConfig(config);

  useEffect(() => {
    if (!subjects.some((subject) => subject.id === config.subjectId)) {
      const nextSubject = subjects[0]?.id || '';
      const nextChapter = getChaptersForSubject(config.contestId, nextSubject)[0]?.id || 'all';
      setConfig((current) => ({ ...current, subjectId: nextSubject, chapterId: nextChapter }));
    }
  }, [config.contestId, config.subjectId, subjects]);

  useEffect(() => {
    if (chapters.length > 0 && !chapters.some((chapter) => chapter.id === config.chapterId)) {
      setConfig((current) => ({ ...current, chapterId: chapters[0].id }));
    }
  }, [chapters, config.chapterId]);

  function updateConfig(field, value) {
    setConfig((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startSession() {
    const session = createSession(config);
    navigate(`/concours/session/${session.id}`);
  }

  const contestOptions = concoursContests.map((contest) => ({ id: contest.id, label: contest.name }));
  const subjectOptions = subjects.map((subject) => ({ id: subject.id, label: subject.name }));
  const chapterOptions = chapters.map((chapter) => ({ id: chapter.id, label: chapter.name }));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <Badge tone="violet">Configuration</Badge>
        <h2 className="mt-4 text-3xl font-black text-slate-950">Construis ta serie QCM</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Choisis concours, matiere, chapitre, difficulte et mode. Les donnees restent locales pour cette version.
        </p>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <SelectField label="Concours" value={config.contestId} onChange={(value) => updateConfig('contestId', value)} options={contestOptions} />
          <SelectField label="Matiere" value={config.subjectId} onChange={(value) => updateConfig('subjectId', value)} options={subjectOptions} />
          <SelectField label="Chapitre" value={config.chapterId} onChange={(value) => updateConfig('chapterId', value)} options={chapterOptions} />
          <SelectField
            label="Difficulte"
            value={config.difficulty}
            onChange={(value) => updateConfig('difficulty', value)}
            options={DIFFICULTIES}
          />
        </div>

        <div className="mt-6">
          <div className="mb-3 text-sm font-black text-slate-700">Nombre de questions</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUESTION_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => updateConfig('questionCount', count)}
                className={`rounded-2xl border px-4 py-3 text-sm font-black ${
                  config.questionCount === count
                    ? 'border-primary bg-violet-50 text-primary'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => updateConfig('mode', 'training')}
            className={`rounded-2xl border p-4 text-left ${
              config.mode === 'training' ? 'border-primary bg-violet-50' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="font-black text-slate-950">Entrainement</div>
            <div className="mt-1 text-xs font-bold text-slate-500">Correction immediate, indice disponible.</div>
          </button>
          <button
            type="button"
            onClick={() => updateConfig('mode', 'exam')}
            className={`rounded-2xl border p-4 text-left ${
              config.mode === 'exam' ? 'border-primary bg-violet-50' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="font-black text-slate-950">Examen</div>
            <div className="mt-1 text-xs font-bold text-slate-500">Resultats a la fin, indice coupe.</div>
          </button>
          <button
            type="button"
            onClick={() => updateConfig('timerEnabled', !config.timerEnabled)}
            className={`rounded-2xl border p-4 text-left ${
              config.timerEnabled ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-slate-950">
              <Clock size={17} />
              Chronometre
            </div>
            <div className="mt-1 text-xs font-bold text-slate-500">{config.timerEnabled ? 'Active' : 'Desactive'}</div>
          </button>
        </div>
      </section>

      <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-primary">
          <Target size={22} />
        </div>
        <h3 className="mt-4 text-xl font-black text-slate-950">Apercu de la serie</h3>
        <div className="mt-5 space-y-4">
          <ProgressBar value={availableQuestions.length} max={config.questionCount} label={`${availableQuestions.length}/${config.questionCount} questions disponibles`} />
          <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
            {config.mode === 'exam'
              ? 'Le mode examen masque les corrections jusqu au resultat final.'
              : 'Le mode entrainement affiche indice, correction et astuce apres validation.'}
          </div>
          <button
            type="button"
            disabled={availableQuestions.length === 0}
            onClick={startSession}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-black text-white shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play size={18} />
            Lancer la serie
          </button>
        </div>
      </aside>
    </div>
  );
}
