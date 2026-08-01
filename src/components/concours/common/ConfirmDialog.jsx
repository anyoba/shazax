import Modal from './Modal.jsx';

export default function ConfirmDialog({ cancelLabel = 'Annuler', confirmLabel = 'Confirmer', message, onCancel, onConfirm, open, title }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm leading-6 text-slate-600">{message}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
