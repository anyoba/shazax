import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Building2, Filter, Plus, RefreshCw, Search } from 'lucide-react';
import {
  ACADEMIC_ADMIN_READ_ROLES,
  ACADEMIC_CONTENT_WRITE_ROLES,
  ACADEMIC_PUBLISH_ROLES,
  ACADEMIC_STATUSES,
  ACADEMIC_STATUS_VALUES,
} from '../../../constants/academic.js';
import { useUserRole } from '../../../hooks/useUserRole.js';
import {
  archiveInstitution,
  createInstitution,
  listInstitutions,
  restoreInstitution,
  updateInstitution,
} from '../../../services/institutionsApi.js';
import InstitutionForm from './InstitutionForm.jsx';
import InstitutionsTable from './InstitutionsTable.jsx';

const STATUS_LABELS = {
  all: 'Tous les statuts',
  [ACADEMIC_STATUSES.DRAFT]: 'Brouillon',
  [ACADEMIC_STATUSES.REVIEW]: 'En revue',
  [ACADEMIC_STATUSES.PUBLISHED]: 'Publie',
  [ACADEMIC_STATUSES.ARCHIVED]: 'Archive',
};

function formatApiError(error, fallback) {
  const details = [];

  if (error?.status) details.push(`HTTP ${error.status}`);
  if (error?.code) details.push(`code: ${error.code}`);
  if (error?.stage) details.push(`stage: ${error.stage}`);
  if (error?.requestId) details.push(`requestId: ${error.requestId}`);

  const message = error?.message || fallback;
  return details.length > 0 ? `${message} (${details.join(' | ')})` : message;
}

export default function InstitutionsManager({ onManageStructure }) {
  const { getToken } = useAuth();
  const { role } = useUserRole();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');

  const canReadAdmin = ACADEMIC_ADMIN_READ_ROLES.includes(role);
  const canEdit = ACADEMIC_CONTENT_WRITE_ROLES.includes(role);
  const canChangeStatus = ACADEMIC_PUBLISH_ROLES.includes(role);

  const loadInstitutions = useCallback(async () => {
    if (!canReadAdmin) return;

    setLoading(true);
    setError('');

    try {
      const nextInstitutions = await listInstitutions({
        admin: true,
        status: 'all',
        getToken,
      });
      setInstitutions(nextInstitutions);
    } catch (loadError) {
      console.error('Unable to load institutions', loadError);
      setError(formatApiError(loadError, 'Impossible de charger les etablissements.'));
    } finally {
      setLoading(false);
    }
  }, [canReadAdmin, getToken]);

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  const filteredInstitutions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return institutions.filter((institution) => {
      const matchesStatus = statusFilter === 'all' || institution.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        institution.name.toLowerCase().includes(normalizedQuery) ||
        institution.city.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [institutions, query, statusFilter]);

  function clearFeedback() {
    setError('');
    setMessage('');
  }

  function startCreate() {
    clearFeedback();
    setEditingInstitution(null);
    setShowForm(true);
  }

  function startEdit(institution) {
    clearFeedback();
    setEditingInstitution(institution);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingInstitution(null);
  }

  async function handleSubmit(payload) {
    if (isSubmitting) return;

    setIsSubmitting(true);
    clearFeedback();

    try {
      if (editingInstitution) {
        await updateInstitution(editingInstitution.id, payload, getToken);
        setMessage('Etablissement mis a jour.');
      } else {
        const createdInstitution = await createInstitution(payload, getToken);
        if (!createdInstitution?.id) {
          throw new Error('Institution creation was not confirmed by the API.');
        }
        setInstitutions((current) => [
          createdInstitution,
          ...current.filter((institution) => institution.id !== createdInstitution.id),
        ]);
        setMessage(`Etablissement cree en brouillon. ID: ${createdInstitution.id}`);
      }

      closeForm();
      await loadInstitutions();
    } catch (submitError) {
      console.error('Unable to save institution', submitError);
      setError(formatApiError(submitError, 'Impossible d enregistrer cet etablissement.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runInstitutionAction(institution, action, successMessage) {
    setActionLoadingId(institution.id);
    clearFeedback();

    try {
      await action();
      setMessage(successMessage);
      await loadInstitutions();
    } catch (actionError) {
      console.error('Institution action failed', actionError);
      setError(formatApiError(actionError, 'Action impossible pour cet etablissement.'));
    } finally {
      setActionLoadingId('');
    }
  }

  function handlePublish(institution) {
    runInstitutionAction(
      institution,
      () => updateInstitution(institution.id, { status: ACADEMIC_STATUSES.PUBLISHED }, getToken),
      'Etablissement publie.',
    );
  }

  function handleArchive(institution) {
    if (!window.confirm(`Archiver ${institution.name} ?`)) return;

    runInstitutionAction(
      institution,
      () => archiveInstitution(institution.id, getToken),
      'Etablissement archive.',
    );
  }

  function handleRestore(institution) {
    runInstitutionAction(
      institution,
      () => restoreInstitution(institution.id, getToken),
      'Etablissement restaure en brouillon.',
    );
  }

  if (!canReadAdmin) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-red-200">
        Votre role ne permet pas de consulter la gestion des etablissements.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Building2 size={20} />
            Etablissements
          </h2>
          <p className="mt-1 text-sm text-white/40">
            Gestion securisee via API serveur et roles Clerk verifies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadInstitutions}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          {canEdit ? (
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={15} />
              Ajouter
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-white/30" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par nom ou ville"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none"
          />
        </label>

        <label className="relative">
          <Filter size={16} className="pointer-events-none absolute left-3 top-3.5 text-white/30" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full appearance-none rounded-xl border border-white/10 bg-gray-950 py-3 pl-10 pr-4 text-white focus:border-primary/50 focus:outline-none"
          >
            <option value="all">{STATUS_LABELS.all}</option>
            {ACADEMIC_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message ? (
        <div className="rounded-2xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <InstitutionForm
          initialValue={editingInstitution}
          canChangeStatus={canChangeStatus}
          isSubmitting={isSubmitting}
          onCancel={closeForm}
          onSubmit={handleSubmit}
        />
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/40">
          Chargement des etablissements...
        </div>
      ) : (
        <InstitutionsTable
          institutions={filteredInstitutions}
          canEdit={canEdit}
          canChangeStatus={canChangeStatus}
          actionLoadingId={actionLoadingId}
          onArchive={handleArchive}
          onEdit={startEdit}
          onManageStructure={onManageStructure}
          onPublish={handlePublish}
          onRestore={handleRestore}
        />
      )}
    </section>
  );
}
