import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Archive, Copy, Eye, FileQuestion, Plus, Save, Search } from 'lucide-react';
import Badge from '../../../components/concours/common/Badge.jsx';
import Modal from '../../../components/concours/common/Modal.jsx';
import Tabs from '../../../components/concours/common/Tabs.jsx';
import QuestionRenderer from '../../../components/concours/quiz/QuestionRenderer.jsx';
import {
  concoursChapters,
  concoursContests,
  concoursSubjects,
  QUESTION_TYPES,
} from '../../../data/concours/index.js';
import {
  getAdminQuestions,
  getReports,
  saveAdminQuestions,
} from '../../../services/concoursLocalStorage.js';
import { getQuestionMeta } from '../../../utils/concours/catalog.js';

const ADMIN_ITEMS = [
  ['dashboard', '/admin/concours', 'Dashboard'],
  ['contests', '/admin/concours/contests', 'Concours'],
  ['subjects', '/admin/concours/subjects', 'Matieres'],
  ['chapters', '/admin/concours/chapters', 'Chapitres'],
  ['questions', '/admin/concours/questions', 'Questions'],
  ['series', '/admin/concours/series', 'Series'],
  ['exams', '/admin/concours/exams', 'Examens blancs'],
  ['activation-codes', '/admin/concours/activation-codes', 'Codes'],
  ['reports', '/admin/concours/reports', 'Signalements'],
  ['stats', '/admin/concours/statistics', 'Statistiques'],
];

const EMPTY_QUESTION = {
  contestId: 'medicine',
  year: '2026',
  subjectId: 'math',
  chapterId: 'limits',
  type: 'single_choice',
  difficulty: 'easy',
  statement: '',
  statementLatex: '',
  imageUrl: '',
  choices: [
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ],
  correctChoiceId: 'A',
  correctNumericValue: '',
  tolerance: 0,
  hint: '',
  explanation: '',
  quickTip: '',
  source: 'Question creee par Shazax',
  status: 'draft',
};

function getSection(pathname) {
  const found = ADMIN_ITEMS.find((item) => pathname === item[1]);
  return found?.[0] || 'dashboard';
}

function AdminNav() {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1">
      {ADMIN_ITEMS.map(([id, to, label]) => (
        <NavLink
          key={id}
          to={to}
          end={to === '/admin/concours'}
          className={({ isActive }) =>
            `whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${
              isActive ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  );
}

function LocalSummary({ questions }) {
  const reports = getReports();
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[
        ['Questions', questions.length],
        ['Publiees', questions.filter((question) => question.status === 'published').length],
        ['Brouillons', questions.filter((question) => question.status === 'draft').length],
        ['Signalements', reports.length],
      ].map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-3xl font-black text-white">{value}</div>
          <div className="mt-1 text-sm text-white/45">{label}</div>
        </div>
      ))}
    </div>
  );
}

function QuestionForm({ initialValue, onSubmit }) {
  const [form, setForm] = useState(initialValue || EMPTY_QUESTION);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateChoice(id, value) {
    setForm((current) => ({
      ...current,
      choices: current.choices.map((choice) => (choice.id === id ? { ...choice, text: value } : choice)),
    }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit(form);
    setForm(EMPTY_QUESTION);
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <select value={form.contestId} onChange={(event) => update('contestId', event.target.value)} className="rounded-xl bg-gray-950 px-4 py-3 text-white">
          {concoursContests.map((contest) => <option key={contest.id} value={contest.id}>{contest.name}</option>)}
        </select>
        <select value={form.subjectId} onChange={(event) => update('subjectId', event.target.value)} className="rounded-xl bg-gray-950 px-4 py-3 text-white">
          {concoursSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>
        <select value={form.chapterId} onChange={(event) => update('chapterId', event.target.value)} className="rounded-xl bg-gray-950 px-4 py-3 text-white">
          {concoursChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.name}</option>)}
        </select>
        <select value={form.type} onChange={(event) => update('type', event.target.value)} className="rounded-xl bg-gray-950 px-4 py-3 text-white">
          {QUESTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select value={form.difficulty} onChange={(event) => update('difficulty', event.target.value)} className="rounded-xl bg-gray-950 px-4 py-3 text-white">
          {['easy', 'medium', 'hard'].map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
        </select>
        <select value={form.status} onChange={(event) => update('status', event.target.value)} className="rounded-xl bg-gray-950 px-4 py-3 text-white">
          {['draft', 'review', 'published', 'archived'].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      <textarea value={form.statement} onChange={(event) => update('statement', event.target.value)} required rows={3} placeholder="Enonce" className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25" />
      <input value={form.statementLatex} onChange={(event) => update('statementLatex', event.target.value)} placeholder="LaTeX facultatif" className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25" />
      <input value={form.imageUrl} onChange={(event) => update('imageUrl', event.target.value)} placeholder="Image URL facultative" className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25" />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {form.choices.map((choice) => (
          <input key={choice.id} value={choice.text} onChange={(event) => updateChoice(choice.id, event.target.value)} placeholder={`Choix ${choice.id}`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25" />
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select value={form.correctChoiceId} onChange={(event) => update('correctChoiceId', event.target.value)} className="rounded-xl bg-gray-950 px-4 py-3 text-white">
          {['A', 'B', 'C', 'D'].map((choice) => <option key={choice} value={choice}>Bonne reponse {choice}</option>)}
        </select>
        <input value={form.correctNumericValue} onChange={(event) => update('correctNumericValue', event.target.value)} placeholder="Reponse numerique" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25" />
      </div>

      <textarea value={form.hint} onChange={(event) => update('hint', event.target.value)} rows={2} placeholder="Hint" className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25" />
      <textarea value={form.explanation} onChange={(event) => update('explanation', event.target.value)} rows={3} placeholder="Explication detaillee" className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25" />
      <input value={form.quickTip} onChange={(event) => update('quickTip', event.target.value)} placeholder="Astuce rapide" className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25" />
      <input value={form.source} onChange={(event) => update('source', event.target.value)} placeholder="Source" className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25" />

      <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white">
        <Save size={16} />
        Enregistrer localement
      </button>
    </form>
  );
}

function QuestionsPanel({ questions, setQuestions }) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const filtered = questions.filter((question) => question.statement.toLowerCase().includes(query.toLowerCase()));

  function upsertQuestion(payload) {
    const nextStatus = editing && editing.status === 'published' ? 'review' : payload.status;
    const question = {
      ...payload,
      id: editing?.id || `local-question-${Date.now()}`,
      status: nextStatus,
    };
    const nextQuestions = editing
      ? questions.map((item) => (item.id === editing.id ? question : item))
      : [question, ...questions];
    setQuestions(saveAdminQuestions(nextQuestions));
    setEditing(null);
  }

  function duplicateQuestion(question) {
    const copy = {
      ...question,
      id: `local-question-${Date.now()}`,
      statement: `${question.statement} (Copie)`,
      status: 'draft',
    };
    setQuestions(saveAdminQuestions([copy, ...questions]));
  }

  function archiveQuestion(question) {
    setQuestions(saveAdminQuestions(questions.map((item) => item.id === question.id ? { ...item, status: 'archived' } : item)));
  }

  return (
    <div className="space-y-6">
      <QuestionForm initialValue={editing} onSubmit={upsertQuestion} />
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <label className="relative block">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une question" className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-white/25" />
        </label>
      </div>
      <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {filtered.map((question) => {
          const meta = getQuestionMeta(question);
          return (
            <div key={question.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">{meta.contestName}</span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">{question.status}</span>
                </div>
                <p className="mt-2 font-medium text-white">{question.statement}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setPreview(question)} className="rounded-xl border border-white/10 p-2 text-white/60 hover:text-white"><Eye size={16} /></button>
                <button onClick={() => setEditing(question)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70">Modifier</button>
                <button onClick={() => duplicateQuestion(question)} className="rounded-xl border border-white/10 p-2 text-white/60 hover:text-white"><Copy size={16} /></button>
                <button onClick={() => archiveQuestion(question)} className="rounded-xl border border-red-400/20 p-2 text-red-300"><Archive size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title="Apercu etudiant">
        {preview ? (
          <QuestionRenderer
            question={preview}
            meta={getQuestionMeta(preview)}
            selectedAnswer=""
            answer={null}
            locked={false}
            favorite={false}
            hintVisible
            onSelect={() => {}}
            onToggleFavorite={() => {}}
            onReport={() => {}}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function ComingSoonPanel({ title }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
      <FileQuestion className="text-primary" size={28} />
      <h2 className="mt-4 text-2xl font-black text-white">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
        Section locale preparee pour la suite. Aucun appel Firestore, aucune API et aucun paiement reel dans cette version.
      </p>
      {title === 'Import' ? (
        <pre className="mt-5 overflow-x-auto rounded-xl bg-black/20 p-4 text-xs text-white/50">
{`[
  {
    "contestId": "medicine",
    "subjectId": "math",
    "chapterId": "limits",
    "type": "single_choice",
    "statement": "...",
    "choices": [{"id":"A","text":"..."}],
    "correctChoiceId": "A"
  }
]`}
        </pre>
      ) : null}
    </div>
  );
}

function ReportsPanel() {
  const reports = getReports();
  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <ComingSoonPanel title="Signalements" />
      ) : (
        reports.map((report) => (
          <div key={report.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-black text-white">{report.reason}</div>
            <div className="mt-1 text-sm text-white/45">{report.questionId}</div>
            {report.details ? <p className="mt-2 text-sm text-white/70">{report.details}</p> : null}
          </div>
        ))
      )}
    </div>
  );
}

export default function ConcoursAdminPage() {
  const location = useLocation();
  const section = getSection(location.pathname);
  const [questions, setQuestions] = useState(() => getAdminQuestions());
  const tabs = useMemo(() => ADMIN_ITEMS.map(([id, , label]) => ({ id, label })), []);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="violet">Admin local</Badge>
            <h1 className="mt-3 text-3xl font-black">Administration Shazax Concours</h1>
            <p className="mt-2 text-sm text-white/45">CRUD simule en localStorage. Aucune ecriture Firestore.</p>
          </div>
          <AdminNav />
        </header>

        {section === 'dashboard' ? (
          <div className="space-y-6">
            <LocalSummary questions={questions} />
            <ComingSoonPanel title="Import" />
          </div>
        ) : null}
        {section === 'questions' ? <QuestionsPanel questions={questions} setQuestions={setQuestions} /> : null}
        {section === 'reports' ? <ReportsPanel /> : null}
        {!['dashboard', 'questions', 'reports'].includes(section) ? (
          <ComingSoonPanel title={ADMIN_ITEMS.find(([id]) => id === section)?.[2] || 'Section'} />
        ) : null}
      </div>
    </div>
  );
}
