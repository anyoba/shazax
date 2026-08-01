import { Archive, Edit3, ExternalLink, Layers, RotateCcw, Send } from 'lucide-react';
import { ACADEMIC_STATUSES } from '../../../constants/academic.js';

const STATUS_LABELS = {
  [ACADEMIC_STATUSES.DRAFT]: 'Brouillon',
  [ACADEMIC_STATUSES.REVIEW]: 'En revue',
  [ACADEMIC_STATUSES.PUBLISHED]: 'Publie',
  [ACADEMIC_STATUSES.ARCHIVED]: 'Archive',
};

const STATUS_CLASSES = {
  [ACADEMIC_STATUSES.DRAFT]: 'bg-white/10 text-white/60',
  [ACADEMIC_STATUSES.REVIEW]: 'bg-amber-400/15 text-amber-200',
  [ACADEMIC_STATUSES.PUBLISHED]: 'bg-green-400/15 text-green-200',
  [ACADEMIC_STATUSES.ARCHIVED]: 'bg-red-400/15 text-red-200',
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUS_CLASSES[status] || STATUS_CLASSES[ACADEMIC_STATUSES.DRAFT]
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function ActionButton({ children, disabled, onClick, title }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function TextActionButton({ children, disabled, onClick, title }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary/30 px-3 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export default function InstitutionsTable({
  institutions,
  canEdit,
  canChangeStatus,
  actionLoadingId,
  onArchive,
  onEdit,
  onManageStructure,
  onPublish,
  onRestore,
}) {
  if (institutions.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/40">
        Aucun etablissement trouve.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="hidden divide-y divide-white/5 md:block">
        <div className="grid grid-cols-[1.2fr_0.7fr_0.65fr_0.55fr_1fr] gap-4 px-4 py-3 text-xs uppercase tracking-wide text-white/35">
          <div>Nom</div>
          <div>Ville</div>
          <div>Type</div>
          <div>Statut</div>
          <div className="text-right">Actions</div>
        </div>
        {institutions.map((institution) => {
          const loading = actionLoadingId === institution.id;
          return (
            <div
              key={institution.id}
              className="grid grid-cols-[1.2fr_0.7fr_0.65fr_0.55fr_1fr] items-center gap-4 px-4 py-4"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{institution.name}</div>
                <div className="truncate text-sm text-white/40">{institution.slug}</div>
              </div>
              <div className="text-sm text-white/70">{institution.city}</div>
              <div className="text-sm text-white/50">{institution.type}</div>
              <div>
                <StatusBadge status={institution.status} />
              </div>
              <div className="flex items-center justify-end gap-2">
                {institution.websiteUrl ? (
                  <a
                    href={institution.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Ouvrir le site officiel"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:bg-white/10 hover:text-white"
                  >
                    <ExternalLink size={15} />
                  </a>
                ) : null}
                {canEdit ? (
                  <ActionButton disabled={loading} onClick={() => onEdit(institution)} title="Modifier">
                    <Edit3 size={15} />
                  </ActionButton>
                ) : null}
                {onManageStructure ? (
                  <TextActionButton
                    disabled={loading}
                    onClick={() => onManageStructure(institution)}
                    title="Manage Resources"
                  >
                    <Layers size={15} />
                    <span>Manage Resources</span>
                  </TextActionButton>
                ) : null}
                {canChangeStatus && institution.status !== ACADEMIC_STATUSES.PUBLISHED ? (
                  <ActionButton disabled={loading} onClick={() => onPublish(institution)} title="Publier">
                    <Send size={15} />
                  </ActionButton>
                ) : null}
                {canChangeStatus && institution.status !== ACADEMIC_STATUSES.ARCHIVED ? (
                  <ActionButton disabled={loading} onClick={() => onArchive(institution)} title="Archiver">
                    <Archive size={15} />
                  </ActionButton>
                ) : null}
                {canChangeStatus && institution.status === ACADEMIC_STATUSES.ARCHIVED ? (
                  <ActionButton disabled={loading} onClick={() => onRestore(institution)} title="Restaurer">
                    <RotateCcw size={15} />
                  </ActionButton>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="divide-y divide-white/5 md:hidden">
        {institutions.map((institution) => {
          const loading = actionLoadingId === institution.id;
          return (
            <div key={institution.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{institution.name}</div>
                  <div className="mt-1 text-sm text-white/40">{institution.city}</div>
                </div>
                <StatusBadge status={institution.status} />
              </div>

              <div className="grid gap-1 text-sm text-white/45">
                <span>{institution.slug}</span>
                <span>{institution.type}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {institution.websiteUrl ? (
                  <a
                    href={institution.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/50"
                    title="Ouvrir le site officiel"
                  >
                    <ExternalLink size={15} />
                  </a>
                ) : null}
                {canEdit ? (
                  <ActionButton disabled={loading} onClick={() => onEdit(institution)} title="Modifier">
                    <Edit3 size={15} />
                  </ActionButton>
                ) : null}
                {onManageStructure ? (
                  <TextActionButton
                    disabled={loading}
                    onClick={() => onManageStructure(institution)}
                    title="Manage Resources"
                  >
                    <Layers size={15} />
                    <span>Manage Resources</span>
                  </TextActionButton>
                ) : null}
                {canChangeStatus && institution.status !== ACADEMIC_STATUSES.PUBLISHED ? (
                  <ActionButton disabled={loading} onClick={() => onPublish(institution)} title="Publier">
                    <Send size={15} />
                  </ActionButton>
                ) : null}
                {canChangeStatus && institution.status !== ACADEMIC_STATUSES.ARCHIVED ? (
                  <ActionButton disabled={loading} onClick={() => onArchive(institution)} title="Archiver">
                    <Archive size={15} />
                  </ActionButton>
                ) : null}
                {canChangeStatus && institution.status === ACADEMIC_STATUSES.ARCHIVED ? (
                  <ActionButton disabled={loading} onClick={() => onRestore(institution)} title="Restaurer">
                    <RotateCcw size={15} />
                  </ActionButton>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
