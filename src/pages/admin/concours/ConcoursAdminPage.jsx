import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Copy, FileQuestion, ImagePlus, RotateCcw, Save, Search, Trash2, X } from 'lucide-react';
import Badge from '../../../components/concours/common/Badge.jsx';
import EmptyState from '../../../components/concours/common/EmptyState.jsx';
import LoadingState from '../../../components/concours/common/LoadingState.jsx';
import Tabs from '../../../components/concours/common/Tabs.jsx';
import {
  archiveAdminConcours,
  createAdminConcours,
  createAdminQuestion,
  deleteAdminQuestion,
  getAdminConcours,
  getAdminDashboard,
  getAdminQuestions,
  restoreAdminConcours,
  restoreAdminQuestion,
  updateAdminConcours,
  updateAdminQuestion,
  uploadAdminQuestionImage,
} from '../../../services/concoursApi.js';

const EMPTY_CONCOURS = { name: '', slug: '', school: '', description: '', year: String(new Date().getFullYear()), category: '', durationMinutes: 60, status: 'draft', coverImageUrl: '' };
const EMPTY_QUESTION = { questionText: '', imageUrl: '', subject: '', points: 1, order: 1, status: 'draft', explanation: '', options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }], correctOptionId: 'A' };
const TABS = [{ id: 'dashboard', label: 'Dashboard' }, { id: 'contests', label: 'Concours' }, { id: 'questions', label: 'Questions' }];

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">{label}</span>{children}</label>;
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none';
const selectClass = 'w-full rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-sm font-bold text-white focus:border-primary/50 focus:outline-none';

function Stat({ label, value }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="text-3xl font-black text-white">{value}</div><div className="mt-1 text-sm text-white/45">{label}</div></div>;
}

function ConcoursForm({ initialValue, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialValue || EMPTY_CONCOURS);
  useEffect(() => setForm(initialValue || EMPTY_CONCOURS), [initialValue]);
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function submit(event) {
    event.preventDefault();
    const { difficulty, ...payload } = form;
    onSubmit(payload);
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Name"><input required value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} placeholder="ENSA 2026" /></Field>
        <Field label="Slug"><input value={form.slug} onChange={(e) => update('slug', e.target.value)} className={inputClass} placeholder="ensa-2026" /></Field>
        <Field label="School"><input value={form.school} onChange={(e) => update('school', e.target.value)} className={inputClass} placeholder="ENSA" /></Field>
        <Field label="Year"><input value={form.year} onChange={(e) => update('year', e.target.value)} className={inputClass} /></Field>
        <Field label="Category"><input value={form.category} onChange={(e) => update('category', e.target.value)} className={inputClass} placeholder="Engineering" /></Field>
        <Field label="Duration"><input type="number" min="1" value={form.durationMinutes} onChange={(e) => update('durationMinutes', e.target.value)} className={inputClass} /></Field>
        <Field label="Status"><select value={form.status} onChange={(e) => update('status', e.target.value)} className={selectClass}>{['draft', 'published', 'archived'].map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
        <Field label="Cover"><input value={form.coverImageUrl} onChange={(e) => update('coverImageUrl', e.target.value)} className={inputClass} placeholder="https://..." /></Field>
      </div>
      <Field label="Description"><textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} className={`${inputClass} mt-4`} /></Field>
      <div className="mt-4 flex flex-wrap gap-3"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white disabled:opacity-50"><Save size={16} />{saving ? 'Saving...' : 'Save concours'}</button>{onCancel ? <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/60">Cancel</button> : null}</div>
    </form>
  );
}

function normalizeQuestionForm(value) {
  const source = value || EMPTY_QUESTION;
  const sourceOptions = Array.isArray(source.options) && source.options.length
    ? source.options
    : Array.isArray(source.choices) && source.choices.length
      ? source.choices
      : EMPTY_QUESTION.options;

  return {
    ...EMPTY_QUESTION,
    ...source,
    questionText: source.questionText || source.statement || '',
    options: sourceOptions.map((item, index) => ({
      id: String(item.id || String.fromCharCode(65 + index)),
      text: item.text || '',
    })),
    correctOptionId: source.correctOptionId || source.correctChoiceId || 'A',
  };
}

function QuestionForm({ concoursId, initialValue, saving, onSubmit, onCancel, onUploadImage }) {
  const [form, setForm] = useState(() => normalizeQuestionForm(initialValue));
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  useEffect(() => {
    setForm(normalizeQuestionForm(initialValue));
    setUploadError('');
  }, [initialValue]);
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function choice(id, text) { setForm((current) => ({ ...current, options: current.options.map((item) => item.id === id ? { ...item, text } : item) })); }
  function submit(event) {
    event.preventDefault();
    const { difficulty, ...payload } = form;
    onSubmit({ ...payload, concoursId });
  }
  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image trop grande. Maximum 2 MB.');
      event.target.value = '';
      return;
    }

    setUploadingImage(true);
    setUploadError('');
    try {
      const imageUrl = await onUploadImage(file);
      update('imageUrl', imageUrl);
    } catch (error) {
      setUploadError(error?.message || 'Impossible d uploader cette image.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Subject"><input value={form.subject} onChange={(e) => update('subject', e.target.value)} className={inputClass} /></Field>
        <Field label="Points"><input type="number" min="1" value={form.points} onChange={(e) => update('points', e.target.value)} className={inputClass} /></Field>
        <Field label="Order"><input type="number" min="1" value={form.order} onChange={(e) => update('order', e.target.value)} className={inputClass} /></Field>
      </div>
      <Field label="Question"><textarea required value={form.questionText || form.statement || ''} onChange={(e) => update('questionText', e.target.value)} rows={3} className={`${inputClass} mt-4`} /></Field>
      <div className="mt-4 rounded-2xl border border-white/10 bg-gray-950/35 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Image</div>
            <p className="mt-1 text-sm text-white/45">Uploader une image de support pour cette question.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/70 hover:bg-white/10">
            <ImagePlus size={16} />
            {uploadingImage ? 'Upload...' : 'Upload image'}
            <input type="file" accept="image/*" onChange={uploadImage} disabled={uploadingImage} className="sr-only" />
          </label>
        </div>
        {uploadError ? <div className="mt-3 text-sm font-bold text-red-300">{uploadError}</div> : null}
        {form.imageUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <img src={form.imageUrl} alt="Question preview" className="max-h-72 w-full object-contain" />
            <button type="button" onClick={() => update('imageUrl', '')} className="flex w-full items-center justify-center gap-2 border-t border-white/10 px-4 py-2 text-sm font-bold text-white/60 hover:bg-white/10">
              <X size={15} />
              Remove image
            </button>
          </div>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{(form.options || EMPTY_QUESTION.options).map((item) => <input key={item.id} value={item.text} onChange={(e) => choice(item.id, e.target.value)} className={inputClass} placeholder={`Choice ${item.id}`} />)}</div>
      <div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Correct"><select value={form.correctOptionId || form.correctChoiceId || 'A'} onChange={(e) => update('correctOptionId', e.target.value)} className={selectClass}>{(form.options || EMPTY_QUESTION.options).map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</select></Field><Field label="Status"><select value={form.status} onChange={(e) => update('status', e.target.value)} className={selectClass}>{['draft', 'published', 'archived'].map((item) => <option key={item} value={item}>{item}</option>)}</select></Field></div>
      <Field label="Explanation"><textarea value={form.explanation || ''} onChange={(e) => update('explanation', e.target.value)} rows={3} className={`${inputClass} mt-4`} /></Field>
      <div className="mt-4 flex flex-wrap gap-3"><button disabled={saving || uploadingImage || !concoursId} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white disabled:opacity-50"><Save size={16} />{saving ? 'Saving...' : 'Save question'}</button>{onCancel ? <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/60">Cancel</button> : null}</div>
    </form>
  );
}

export default function ConcoursAdminPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [concours, setConcours] = useState([]);
  const [selectedConcoursId, setSelectedConcoursId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [editingConcours, setEditingConcours] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function loadAll() {
    setLoading(true);
    setMessage('');
    try {
      const [statsBody, concoursBody] = await Promise.all([getAdminDashboard(getToken), getAdminConcours(getToken)]);
      setStats(statsBody.stats);
      setConcours(concoursBody.concours || []);
      setSelectedConcoursId((current) => current || concoursBody.concours?.[0]?.id || '');
    } catch (err) {
      setMessage(err?.message || 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions(concoursId = selectedConcoursId) {
    if (!concoursId) { setQuestions([]); return; }
    setQuestionsLoading(true);
    try {
      const body = await getAdminQuestions(concoursId, getToken);
      setQuestions(body.questions || []);
    } catch (err) {
      setMessage(err?.message || 'Unable to load questions.');
    } finally {
      setQuestionsLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadQuestions(selectedConcoursId); }, [selectedConcoursId]);

  async function saveConcours(payload) {
    setSaving(true);
    setMessage('');
    try {
      if (editingConcours) await updateAdminConcours(editingConcours.id, payload, getToken);
      else await createAdminConcours(payload, getToken);
      setEditingConcours(null);
      setMessage('Concours saved.');
      await loadAll();
    } catch (err) {
      setMessage(err?.message || 'Unable to save concours.');
    } finally {
      setSaving(false);
    }
  }

  async function archiveConcours(item) {
    if (!window.confirm('Supprimer ce concours ? Il sera envoye dans la corbeille.')) return;
    setSaving(true);
    try { await archiveAdminConcours(item.id, getToken); await loadAll(); setMessage('Concours envoye dans la corbeille.'); } catch (err) { setMessage(err?.message || 'Unable to delete concours.'); } finally { setSaving(false); }
  }

  async function restoreConcours(item) {
    setSaving(true);
    try { await restoreAdminConcours(item, getToken); await loadAll(); setMessage('Concours restaure.'); } catch (err) { setMessage(err?.message || 'Unable to restore concours.'); } finally { setSaving(false); }
  }

  async function saveQuestion(payload) {
    setSaving(true);
    setMessage('');
    try {
      if (editingQuestion) await updateAdminQuestion(editingQuestion.id, payload, getToken);
      else await createAdminQuestion(payload, getToken);
      setEditingQuestion(null);
      setMessage('Question saved.');
      await loadQuestions(payload.concoursId);
      await loadAll();
    } catch (err) {
      setMessage(err?.message || 'Unable to save question.');
    } finally {
      setSaving(false);
    }
  }

  async function duplicateQuestion(question) {
    const copy = { ...question, questionText: `${question.questionText || question.statement} (Copie)`, status: 'draft', order: Number(question.order || 0) + 1 };
    delete copy.id;
    delete copy.deletedAt;
    delete copy.deletedBy;
    delete copy.previousStatus;
    await saveQuestion(copy);
  }

  async function removeQuestion(question) {
    if (!window.confirm('Supprimer cette question ? Elle sera envoyee dans la corbeille.')) return;
    setSaving(true);
    try { await deleteAdminQuestion(question.id, getToken); await loadQuestions(question.concoursId); await loadAll(); setMessage('Question envoyee dans la corbeille.'); } catch (err) { setMessage(err?.message || 'Unable to delete question.'); } finally { setSaving(false); }
  }

  async function restoreQuestion(question) {
    setSaving(true);
    try { await restoreAdminQuestion(question, getToken); await loadQuestions(question.concoursId); await loadAll(); setMessage('Question restauree.'); } catch (err) { setMessage(err?.message || 'Unable to restore question.'); } finally { setSaving(false); }
  }

  async function uploadQuestionImage(file) {
    return uploadAdminQuestionImage(file, getToken);
  }

  const filteredQuestions = questions.filter((question) => String(question.questionText || question.statement || '').toLowerCase().includes(query.trim().toLowerCase()));
  const selectedConcours = concours.find((item) => item.id === selectedConcoursId);

  if (loading) return <div className="min-h-screen bg-gray-950 p-6 text-white"><LoadingState label="Loading concours admin..." /></div>;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><Badge tone="violet">Admin Firestore</Badge><h1 className="mt-3 text-3xl font-black">Administration Shazaxx Concours</h1><p className="mt-2 text-sm text-white/45">CRUD reel, role-based API, scoring serveur.</p></div><Tabs tabs={TABS} activeTab={tab} onChange={setTab} /></header>
        {message ? <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70">{message}</div> : null}

        {tab === 'dashboard' ? <div className="grid gap-4 md:grid-cols-4"><Stat label="Users" value={stats?.totalUsers || 0} /><Stat label="Concours" value={stats?.totalConcours || 0} /><Stat label="Questions" value={stats?.totalQuestions || 0} /><Stat label="Attempts" value={stats?.totalAttempts || 0} /><Stat label="Active users" value={stats?.activeUsers || 0} /><Stat label="Average score" value={`${stats?.averageScore || 0}%`} /><Stat label="New users/week" value={stats?.newUsersThisWeek || 0} /><Stat label="Published" value={concours.filter((item) => item.status === 'published').length} /></div> : null}

        {tab === 'contests' ? <div className="space-y-6"><ConcoursForm initialValue={editingConcours} saving={saving} onSubmit={saveConcours} onCancel={editingConcours ? () => setEditingConcours(null) : null} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{concours.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex items-start justify-between gap-3"><div><Badge tone={item.status === 'published' ? 'green' : item.status === 'archived' ? 'slate' : 'amber'}>{item.status}</Badge><h3 className="mt-3 text-xl font-black">{item.name}</h3><p className="mt-1 text-sm text-white/45">{item.school} - {item.year}</p></div><div className="text-right text-sm font-black text-white/45">{item.questionCount || 0} Q</div></div><p className="mt-3 line-clamp-2 text-sm text-white/55">{item.description}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => { setEditingConcours(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-gray-950">Edit</button><button onClick={() => { setSelectedConcoursId(item.id); setTab('questions'); }} className="rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-white/70">Questions</button>{item.status === 'archived' ? <button onClick={() => restoreConcours(item)} className="rounded-xl border border-green-400/20 p-2 text-green-300" title="Restaurer"><RotateCcw size={16} /></button> : <button onClick={() => archiveConcours(item)} className="rounded-xl border border-red-400/20 p-2 text-red-300" title="Supprimer"><Trash2 size={16} /></button>}</div></article>)}</div></div> : null}

        {tab === 'questions' ? <div className="space-y-6"><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="grid gap-4 md:grid-cols-[1fr_2fr]"><Field label="Concours"><select value={selectedConcoursId} onChange={(e) => setSelectedConcoursId(e.target.value)} className={selectClass}>{concours.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Search"><div className="relative"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" /><input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} pl-10`} placeholder="Search questions" /></div></Field></div></div>{selectedConcours ? <QuestionForm concoursId={selectedConcours.id} initialValue={editingQuestion} saving={saving} onSubmit={saveQuestion} onCancel={editingQuestion ? () => setEditingQuestion(null) : null} onUploadImage={uploadQuestionImage} /> : <EmptyState title="No concours" description="Create a concours first." />}{questionsLoading ? <LoadingState label="Loading questions..." /> : <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">{filteredQuestions.length === 0 ? <div className="p-6 text-white/40"><FileQuestion className="mb-3 text-primary" />No questions yet.</div> : filteredQuestions.map((question) => <div key={question.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap gap-2"><Badge tone={question.status === 'published' ? 'green' : question.status === 'archived' ? 'slate' : 'amber'}>{question.status}</Badge><span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">Order {question.order}</span><span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">{question.subject || 'General'}</span></div><p className="mt-2 font-medium text-white">{question.questionText || question.statement}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setEditingQuestion(question)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70">Edit</button><button onClick={() => duplicateQuestion(question)} className="rounded-xl border border-white/10 p-2 text-white/60"><Copy size={16} /></button>{question.status === 'archived' ? <button onClick={() => restoreQuestion(question)} className="rounded-xl border border-green-400/20 p-2 text-green-300" title="Restaurer"><RotateCcw size={16} /></button> : <button onClick={() => removeQuestion(question)} className="rounded-xl border border-red-400/20 p-2 text-red-300" title="Supprimer"><Trash2 size={16} /></button>}</div></div>)}</div>}</div> : null}
      </div>
    </div>
  );
}
