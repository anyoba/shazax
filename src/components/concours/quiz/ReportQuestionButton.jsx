import { useState } from 'react';
import { Flag } from 'lucide-react';
import Modal from '../common/Modal.jsx';

const REASONS = [
  'Reponse incorrecte',
  'Enonce incomplet',
  'Image illisible',
  'Explication insuffisante',
  'Autre',
];

export default function ReportQuestionButton({ onReport }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');

  function submitReport() {
    onReport({ reason, details });
    setOpen(false);
    setDetails('');
    setReason(REASONS[0]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-amber-600"
        aria-label="Signaler la question"
      >
        <Flag size={18} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Signaler la question">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">Motif</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold"
            >
              {REASONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">Details</span>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Ajouter un commentaire facultatif"
            />
          </label>
          <button
            type="button"
            onClick={submitReport}
            className="rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white"
          >
            Envoyer le signalement
          </button>
        </div>
      </Modal>
    </>
  );
}
