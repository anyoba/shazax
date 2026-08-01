import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Archive,
  BookOpen,
  Edit3,
  Layers,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  X,
} from 'lucide-react';
import {
  ACADEMIC_ADMIN_READ_ROLES,
  ACADEMIC_CONTENT_WRITE_ROLES,
  ACADEMIC_PUBLISH_ROLES,
  ACADEMIC_STATUSES,
  ACADEMIC_STATUS_VALUES,
} from '../../../constants/academic.js';
import { useUserRole } from '../../../hooks/useUserRole.js';
import { listInstitutions } from '../../../services/institutionsApi.js';
import {
  archiveAcademicItem,
  createAcademicItem,
  formatAcademicApiError,
  listAcademicItems,
  restoreAcademicItem,
  updateAcademicItem,
} from '../../../services/academicAdminApi.js';
import { normalizeSlug } from '../../../utils/academicValidation.js';

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

const ENTITY_CONFIGS = {
  programs: {
    title: 'Filieres',
    singular: 'filiere',
    empty: 'Aucune filiere pour cet etablissement.',
    icon: BookOpen,
    fields: [
      { name: 'name', label: 'Nom', placeholder: 'Mathematiques et Science des Donnees', required: true },
      { name: 'shortName', label: 'Nom court', placeholder: 'MSD', required: true },
      { name: 'slug', label: 'Slug', placeholder: 'mathematiques-science-donnees', required: true },
      { name: 'description', label: 'Description', placeholder: 'Description courte', textarea: true },
      { name: 'order', label: 'Ordre', type: 'number', required: true },
      { name: 'status', label: 'Statut', type: 'status' },
    ],
    initial: { name: '', shortName: '', slug: '', description: '', order: 1, status: ACADEMIC_STATUSES.DRAFT },
  },
  program_years: {
    title: 'Annees',
    singular: 'annee',
    empty: 'Aucune annee pour cette filiere.',
    icon: Layers,
    fields: [
      { name: 'name', label: 'Nom', placeholder: '1ere annee', required: true },
      { name: 'slug', label: 'Slug', placeholder: '1ere-annee', required: true },
      { name: 'yearNumber', label: 'Numero annee', type: 'number', required: true },
      { name: 'order', label: 'Ordre', type: 'number', required: true },
      { name: 'status', label: 'Statut', type: 'status' },
    ],
    initial: { name: '', slug: '', yearNumber: 1, order: 1, status: ACADEMIC_STATUSES.DRAFT },
  },
  semesters: {
    title: 'Semestres',
    singular: 'semestre',
    empty: 'Aucun semestre pour cette annee.',
    icon: Layers,
    fields: [
      { name: 'name', label: 'Nom', placeholder: 'S2', required: true },
      { name: 'slug', label: 'Slug', placeholder: 's2', required: true },
      { name: 'semesterNumber', label: 'Numero semestre', type: 'number', required: true },
      { name: 'order', label: 'Ordre', type: 'number', required: true },
      { name: 'status', label: 'Statut', type: 'status' },
    ],
    initial: { name: '', slug: '', semesterNumber: 1, order: 1, status: ACADEMIC_STATUSES.DRAFT },
  },
  modules: {
    title: 'Modules',
    singular: 'module',
    empty: 'Aucun module pour ce semestre.',
    icon: BookOpen,
    fields: [
      { name: 'name', label: 'Nom', placeholder: 'Analyse 2', required: true },
      { name: 'shortName', label: 'Nom court', placeholder: 'Analyse 2' },
      { name: 'slug', label: 'Slug', placeholder: 'analyse-2', required: true },
      { name: 'description', label: 'Description', placeholder: 'Description courte', textarea: true },
      { name: 'order', label: 'Ordre', type: 'number', required: true },
      { name: 'status', label: 'Statut', type: 'status' },
    ],
    initial: { name: '', shortName: '', slug: '', description: '', order: 1, status: ACADEMIC_STATUSES.DRAFT },
  },
};

const FST_S2_MODULES = [
  { name: 'Analyse 2', shortName: 'Analyse 2', slug: 'analyse-2', order: 1 },
  { name: 'Algebre 2', shortName: 'Algebre 2', slug: 'algebre-2', order: 2 },
  { name: 'Mecanique', shortName: 'Mecanique', slug: 'mecanique', order: 3 },
  { name: 'Thermodynamique', shortName: 'Thermodynamique', slug: 'thermodynamique', order: 4 },
  {
    name: 'Structure de la matiere',
    shortName: 'Structure matiere',
    slug: 'structure-de-la-matiere',
    order: 5,
  },
];

const FST_MSD_PROGRAM = {
  name: 'Mathematiques et Science des Donnees',
  shortName: 'MSD',
  slug: 'mathematiques-science-donnees',
  description: '',
  order: 1,
};

const FST_MSD_YEARS = [
  {
    name: '1ere annee',
    slug: '1ere-annee',
    yearNumber: 1,
    order: 1,
    semesters: [
      { name: 'S1', slug: 's1', semesterNumber: 1, order: 1 },
      { name: 'S2', slug: 's2', semesterNumber: 2, order: 2 },
    ],
  },
  {
    name: '2eme annee',
    slug: '2eme-annee',
    yearNumber: 2,
    order: 2,
    semesters: [
      { name: 'S3', slug: 's3', semesterNumber: 3, order: 3 },
      { name: 'S4', slug: 's4', semesterNumber: 4, order: 4 },
    ],
  },
];

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[status] || STATUS_CLASSES.draft}`}>
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

function SelectBox({ label, value, items, placeholder, disabled, onChange }) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-white/60">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-white focus:border-primary/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function EntityForm({
  entityType,
  initialValue,
  parentData,
  canChangeStatus,
  isSubmitting,
  onCancel,
  onSubmit,
}) {
  const config = ENTITY_CONFIGS[entityType];
  const isEditing = Boolean(initialValue?.id);
  const [form, setForm] = useState(config.initial);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!initialValue) {
      setForm({
        ...config.initial,
        order: parentData.defaultOrder,
        yearNumber: parentData.defaultYearNumber ?? config.initial.yearNumber,
        semesterNumber: parentData.defaultSemesterNumber ?? config.initial.semesterNumber,
      });
      setSlugTouched(false);
      setErrors({});
      return;
    }

    setForm(
      Object.keys(config.initial).reduce((nextForm, field) => {
        nextForm[field] = initialValue[field] ?? config.initial[field];
        return nextForm;
      }, {}),
    );
    setSlugTouched(true);
    setErrors({});
  }, [config, initialValue, parentData]);

  const statusOptions = useMemo(
    () =>
      ACADEMIC_STATUS_VALUES.filter((status) => {
        if (canChangeStatus) return true;
        return [ACADEMIC_STATUSES.DRAFT, ACADEMIC_STATUSES.REVIEW].includes(status);
      }),
    [canChangeStatus],
  );

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === 'name' && !isEditing && !slugTouched) {
        next.slug = normalizeSlug(value);
      }

      return next;
    });
  }

  function handleSlug(value) {
    setSlugTouched(true);
    setForm((current) => ({ ...current, slug: normalizeSlug(value) }));
  }

  function validate() {
    const nextErrors = {};
    config.fields.forEach((field) => {
      const value = form[field.name];
      if (field.required && String(value ?? '').trim().length === 0) {
        nextErrors[field.name] = 'Champ obligatoire.';
      }

      if (field.name === 'slug' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value || ''))) {
        nextErrors.slug = 'Slug invalide.';
      }

      if (field.type === 'number') {
        const numberValue = Number(value);
        if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 9999) {
          nextErrors[field.name] = 'Nombre invalide.';
        }
      }
    });

    return nextErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = { ...form };
    for (const field of ['order', 'yearNumber', 'semesterNumber']) {
      if (payload[field] !== undefined) payload[field] = Number(payload[field]);
    }

    if (!canChangeStatus) {
      payload.status = [ACADEMIC_STATUSES.DRAFT, ACADEMIC_STATUSES.REVIEW].includes(payload.status)
        ? payload.status
        : ACADEMIC_STATUSES.DRAFT;
    }

    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">
            {isEditing ? `Modifier ${config.singular}` : `Ajouter ${config.singular}`}
          </h3>
          <p className="mt-1 text-sm text-white/40">Les relations, dates et auteurs sont verifies par le serveur.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          <X size={15} />
          Annuler
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {config.fields.map((field) => {
          if (field.type === 'status') {
            return (
              <label key={field.name} className="space-y-2">
                <span className="text-sm text-white/60">{field.label}</span>
                {canChangeStatus ? (
                  <select
                    value={form.status}
                    onChange={(event) => updateField('status', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-white focus:border-primary/50 focus:outline-none"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/50">
                    {STATUS_LABELS[form.status] || STATUS_LABELS.draft}
                  </div>
                )}
              </label>
            );
          }

          if (field.textarea) {
            return (
              <label key={field.name} className="space-y-2 md:col-span-2">
                <span className="text-sm text-white/60">{field.label}</span>
                <textarea
                  value={form[field.name] || ''}
                  onChange={(event) => updateField(field.name, event.target.value)}
                  rows={3}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
                />
                {errors[field.name] ? <span className="text-xs text-red-300">{errors[field.name]}</span> : null}
              </label>
            );
          }

          return (
            <label key={field.name} className="space-y-2">
              <span className="text-sm text-white/60">{field.label}</span>
              <input
                type={field.type || 'text'}
                min={field.type === 'number' ? 0 : undefined}
                value={form[field.name] ?? ''}
                onChange={(event) =>
                  field.name === 'slug'
                    ? handleSlug(event.target.value)
                    : updateField(field.name, event.target.value)
                }
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
              />
              {errors[field.name] ? <span className="text-xs text-red-300">{errors[field.name]}</span> : null}
            </label>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save size={15} />
        {isSubmitting ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Creer'}
      </button>
    </form>
  );
}

function EntityList({
  entityType,
  items,
  selectedId,
  canEdit,
  canChangeStatus,
  actionLoadingId,
  onArchive,
  onEdit,
  onPublish,
  onRestore,
  onSelect,
}) {
  const config = ENTITY_CONFIGS[entityType];

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/40">
        {config.empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="divide-y divide-white/5">
        {items.map((item) => {
          const loading = actionLoadingId === `${entityType}:${item.id}`;
          const selected = selectedId === item.id;

          return (
            <div
              key={item.id}
              className={`flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                selected ? 'bg-primary/10' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="min-w-0 text-left"
              >
                <div className="truncate font-medium text-white">{item.name}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/40">
                  <span>{item.slug}</span>
                  {item.shortName ? <span>{item.shortName}</span> : null}
                  {item.yearNumber ? <span>Annee {item.yearNumber}</span> : null}
                  {item.semesterNumber ? <span>Semestre {item.semesterNumber}</span> : null}
                </div>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.status} />
                {canEdit ? (
                  <ActionButton disabled={loading} onClick={() => onEdit(item)} title="Modifier">
                    <Edit3 size={15} />
                  </ActionButton>
                ) : null}
                {canChangeStatus && item.status !== ACADEMIC_STATUSES.PUBLISHED ? (
                  <ActionButton disabled={loading} onClick={() => onPublish(item)} title="Publier">
                    <Send size={15} />
                  </ActionButton>
                ) : null}
                {canChangeStatus && item.status !== ACADEMIC_STATUSES.ARCHIVED ? (
                  <ActionButton disabled={loading} onClick={() => onArchive(item)} title="Archiver">
                    <Archive size={15} />
                  </ActionButton>
                ) : null}
                {canChangeStatus && item.status === ACADEMIC_STATUSES.ARCHIVED ? (
                  <ActionButton disabled={loading} onClick={() => onRestore(item)} title="Restaurer">
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

function EntityPanel({
  entityType,
  items,
  selectedId,
  parentReady,
  parentData,
  loading,
  canEdit,
  canChangeStatus,
  actionLoadingId,
  onCreate,
  onEdit,
  onArchive,
  onPublish,
  onRestore,
  onSelect,
  extraAction,
}) {
  const config = ENTITY_CONFIGS[entityType];
  const Icon = config.icon;
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    setShowForm(false);
    setEditingItem(null);
  }, [parentReady, entityType, parentData.parentKey]);

  function startCreate() {
    setEditingItem(null);
    setShowForm(true);
  }

  function startEdit(item) {
    setEditingItem(item);
    setShowForm(true);
  }

  async function submit(payload) {
    if (editingItem) {
      await onEdit(entityType, editingItem.id, payload);
    } else {
      await onCreate(entityType, payload);
    }

    setShowForm(false);
    setEditingItem(null);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Icon size={18} />
            {config.title}
          </h3>
          <p className="mt-1 text-sm text-white/40">{items.length} element(s)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {extraAction}
          {canEdit && parentReady ? (
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

      {!parentReady ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/40">
          Selectionne le parent pour continuer.
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/40">
          Chargement...
        </div>
      ) : (
        <EntityList
          entityType={entityType}
          items={items}
          selectedId={selectedId}
          canEdit={canEdit}
          canChangeStatus={canChangeStatus}
          actionLoadingId={actionLoadingId}
          onArchive={(item) => onArchive(entityType, item)}
          onEdit={startEdit}
          onPublish={(item) => onPublish(entityType, item)}
          onRestore={(item) => onRestore(entityType, item)}
          onSelect={onSelect}
        />
      )}

      {showForm ? (
        <EntityForm
          entityType={entityType}
          initialValue={editingItem}
          parentData={parentData}
          canChangeStatus={canChangeStatus}
          isSubmitting={Boolean(actionLoadingId)}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSubmit={submit}
        />
      ) : null}
    </section>
  );
}

export default function AcademicStructureManager({ initialInstitutionId = '' }) {
  const { getToken } = useAuth();
  const { role } = useUserRole();
  const [institutions, setInstitutions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [programYears, setProgramYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedProgramYearId, setSelectedProgramYearId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [loading, setLoading] = useState({
    institutions: false,
    programs: false,
    program_years: false,
    semesters: false,
    modules: false,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');

  const canReadAdmin = ACADEMIC_ADMIN_READ_ROLES.includes(role);
  const canEdit = ACADEMIC_CONTENT_WRITE_ROLES.includes(role);
  const canChangeStatus = ACADEMIC_PUBLISH_ROLES.includes(role);

  const selectedInstitution = institutions.find((institution) => institution.id === selectedInstitutionId);
  const selectedProgram = programs.find((program) => program.id === selectedProgramId);
  const selectedProgramYear = programYears.find((programYear) => programYear.id === selectedProgramYearId);
  const selectedSemester = semesters.find((semester) => semester.id === selectedSemesterId);
  const isFstSettat = selectedInstitution?.slug === 'fst-settat';
  const hasNoStructureYet = Boolean(selectedInstitutionId && !loading.programs && programs.length === 0);

  function clearFeedback() {
    setError('');
    setMessage('');
  }

  const loadInstitutions = useCallback(async () => {
    if (!canReadAdmin) return;
    setLoading((current) => ({ ...current, institutions: true }));
    setError('');

    try {
      const nextInstitutions = await listInstitutions({
        admin: true,
        status: 'all',
        getToken,
      });
      setInstitutions(nextInstitutions);
      if (initialInstitutionId && nextInstitutions.some((institution) => institution.id === initialInstitutionId)) {
        setSelectedInstitutionId(initialInstitutionId);
      } else if (!selectedInstitutionId && nextInstitutions.length > 0) {
        setSelectedInstitutionId(nextInstitutions[0].id);
      }
    } catch (loadError) {
      console.error('Unable to load academic institutions', loadError);
      setError(formatAcademicApiError(loadError, 'Impossible de charger les etablissements.'));
    } finally {
      setLoading((current) => ({ ...current, institutions: false }));
    }
  }, [canReadAdmin, getToken, initialInstitutionId, selectedInstitutionId]);

  useEffect(() => {
    if (initialInstitutionId && initialInstitutionId !== selectedInstitutionId) {
      setSelectedInstitutionId(initialInstitutionId);
    }
  }, [initialInstitutionId, selectedInstitutionId]);

  const loadEntity = useCallback(
    async (entityType, filters = {}) => {
      if (!canReadAdmin) return;
      setLoading((current) => ({ ...current, [entityType]: true }));
      setError('');

      try {
        const items = await listAcademicItems(entityType, {
          getToken,
          status: 'all',
          filters,
        });

        if (entityType === 'programs') setPrograms(items);
        if (entityType === 'program_years') setProgramYears(items);
        if (entityType === 'semesters') setSemesters(items);
        if (entityType === 'modules') setModules(items);
      } catch (loadError) {
        console.error(`Unable to load ${entityType}`, loadError);
        setError(formatAcademicApiError(loadError, `Impossible de charger ${entityType}.`));
      } finally {
        setLoading((current) => ({ ...current, [entityType]: false }));
      }
    },
    [canReadAdmin, getToken],
  );

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  useEffect(() => {
    setSelectedProgramId('');
    setSelectedProgramYearId('');
    setSelectedSemesterId('');
    setPrograms([]);
    setProgramYears([]);
    setSemesters([]);
    setModules([]);
    if (selectedInstitutionId) {
      loadEntity('programs', { institutionId: selectedInstitutionId });
    }
  }, [loadEntity, selectedInstitutionId]);

  useEffect(() => {
    setSelectedProgramYearId('');
    setSelectedSemesterId('');
    setProgramYears([]);
    setSemesters([]);
    setModules([]);
    if (selectedProgramId) {
      loadEntity('program_years', { institutionId: selectedInstitutionId, programId: selectedProgramId });
    }
  }, [loadEntity, selectedInstitutionId, selectedProgramId]);

  useEffect(() => {
    setSelectedSemesterId('');
    setSemesters([]);
    setModules([]);
    if (selectedProgramYearId) {
      loadEntity('semesters', {
        institutionId: selectedInstitutionId,
        programId: selectedProgramId,
        programYearId: selectedProgramYearId,
      });
    }
  }, [loadEntity, selectedInstitutionId, selectedProgramId, selectedProgramYearId]);

  useEffect(() => {
    setModules([]);
    if (selectedSemesterId) {
      loadEntity('modules', {
        institutionId: selectedInstitutionId,
        programId: selectedProgramId,
        programYearId: selectedProgramYearId,
        semesterId: selectedSemesterId,
      });
    }
  }, [loadEntity, selectedInstitutionId, selectedProgramId, selectedProgramYearId, selectedSemesterId]);

  async function refreshCurrent() {
    await loadInstitutions();
    if (selectedInstitutionId) await loadEntity('programs', { institutionId: selectedInstitutionId });
    if (selectedProgramId) {
      await loadEntity('program_years', { institutionId: selectedInstitutionId, programId: selectedProgramId });
    }
    if (selectedProgramYearId) {
      await loadEntity('semesters', {
        institutionId: selectedInstitutionId,
        programId: selectedProgramId,
        programYearId: selectedProgramYearId,
      });
    }
    if (selectedSemesterId) {
      await loadEntity('modules', {
        institutionId: selectedInstitutionId,
        programId: selectedProgramId,
        programYearId: selectedProgramYearId,
        semesterId: selectedSemesterId,
      });
    }
  }

  function parentPayload(entityType) {
    if (entityType === 'programs') return { institutionId: selectedInstitutionId };
    if (entityType === 'program_years') {
      return { institutionId: selectedInstitutionId, programId: selectedProgramId };
    }
    if (entityType === 'semesters') {
      return {
        institutionId: selectedInstitutionId,
        programId: selectedProgramId,
        programYearId: selectedProgramYearId,
      };
    }
    return {
      institutionId: selectedInstitutionId,
      programId: selectedProgramId,
      programYearId: selectedProgramYearId,
      semesterId: selectedSemesterId,
    };
  }

  async function createItem(entityType, payload) {
    setActionLoadingId(`${entityType}:create`);
    clearFeedback();

    try {
      const created = await createAcademicItem(entityType, { ...parentPayload(entityType), ...payload }, getToken);
      setMessage(`${ENTITY_CONFIGS[entityType].singular} cree.`);
      await loadEntity(entityType, parentPayload(entityType));
      if (entityType === 'programs') setSelectedProgramId(created.id);
      if (entityType === 'program_years') setSelectedProgramYearId(created.id);
      if (entityType === 'semesters') setSelectedSemesterId(created.id);
    } catch (submitError) {
      console.error(`Unable to create ${entityType}`, submitError);
      setError(formatAcademicApiError(submitError, 'Creation impossible.'));
      throw submitError;
    } finally {
      setActionLoadingId('');
    }
  }

  async function updateItem(entityType, id, payload) {
    setActionLoadingId(`${entityType}:${id}`);
    clearFeedback();

    try {
      await updateAcademicItem(entityType, id, payload, getToken);
      setMessage(`${ENTITY_CONFIGS[entityType].singular} mis a jour.`);
      await loadEntity(entityType, parentPayload(entityType));
    } catch (submitError) {
      console.error(`Unable to update ${entityType}`, submitError);
      setError(formatAcademicApiError(submitError, 'Modification impossible.'));
      throw submitError;
    } finally {
      setActionLoadingId('');
    }
  }

  async function statusAction(entityType, item, action, successMessage) {
    setActionLoadingId(`${entityType}:${item.id}`);
    clearFeedback();

    try {
      await action();
      setMessage(successMessage);
      await loadEntity(entityType, parentPayload(entityType));
    } catch (actionError) {
      console.error(`Academic status action failed for ${entityType}`, actionError);
      setError(formatAcademicApiError(actionError, 'Action impossible.'));
    } finally {
      setActionLoadingId('');
    }
  }

  function publishItem(entityType, item) {
    statusAction(
      entityType,
      item,
      () => updateAcademicItem(entityType, item.id, { status: ACADEMIC_STATUSES.PUBLISHED }, getToken),
      `${ENTITY_CONFIGS[entityType].singular} publie.`,
    );
  }

  function archiveItem(entityType, item) {
    if (!window.confirm(`Archiver ${item.name} ?`)) return;

    statusAction(
      entityType,
      item,
      () => archiveAcademicItem(entityType, item.id, getToken),
      `${ENTITY_CONFIGS[entityType].singular} archive.`,
    );
  }

  function restoreItem(entityType, item) {
    statusAction(
      entityType,
      item,
      () => restoreAcademicItem(entityType, item.id, getToken),
      `${ENTITY_CONFIGS[entityType].singular} restaure en brouillon.`,
    );
  }

  async function createFstS2Modules() {
    if (!selectedInstitutionId || !selectedProgramId || !selectedProgramYearId || !selectedSemesterId) {
      setError('Selectionne FST Settat, MSD, 1ere annee et S2 avant de placer les modules.');
      return;
    }

    const existingSlugs = new Set(modules.map((moduleItem) => moduleItem.slug));
    const missingModules = FST_S2_MODULES.filter((moduleItem) => !existingSlugs.has(moduleItem.slug));

    if (missingModules.length === 0) {
      setMessage('Les 5 modules FST S2 existent deja dans ce semestre.');
      return;
    }

    setActionLoadingId('modules:fst-s2');
    clearFeedback();

    try {
      const parent = parentPayload('modules');
      const status = canChangeStatus ? ACADEMIC_STATUSES.PUBLISHED : ACADEMIC_STATUSES.DRAFT;

      for (const moduleItem of missingModules) {
        await createAcademicItem(
          'modules',
          {
            ...parent,
            ...moduleItem,
            description: '',
            status,
          },
          getToken,
        );
      }

      setMessage(
        `${missingModules.length} module(s) FST S2 ajoute(s) directement dans ${selectedSemester?.name || 'ce semestre'}.`,
      );
      await loadEntity('modules', parent);
    } catch (createError) {
      console.error('Unable to create FST S2 modules', createError);
      setError(formatAcademicApiError(createError, 'Impossible de placer les modules FST S2.'));
    } finally {
      setActionLoadingId('');
    }
  }

  async function findOrCreateAcademicItem(entityType, items, slug, payload, filters, status) {
    const existingItem = items.find((item) => item.slug === slug);
    if (existingItem) return existingItem;

    return createAcademicItem(
      entityType,
      {
        ...filters,
        ...payload,
        status,
      },
      getToken,
    );
  }

  async function prepareFstMsdStructure() {
    if (!selectedInstitutionId) {
      setError('Selectionne FST Settat avant de preparer MSD/S1-S4.');
      return;
    }

    setActionLoadingId('structure:fst-msd');
    clearFeedback();

    try {
      const status = canChangeStatus ? ACADEMIC_STATUSES.PUBLISHED : ACADEMIC_STATUSES.DRAFT;
      const programFilters = { institutionId: selectedInstitutionId };
      const currentPrograms = await listAcademicItems('programs', {
        getToken,
        status: 'all',
        filters: programFilters,
      });
      const program = await findOrCreateAcademicItem(
        'programs',
        currentPrograms,
        FST_MSD_PROGRAM.slug,
        FST_MSD_PROGRAM,
        programFilters,
        status,
      );

      let s2Semester = null;
      let firstYear = null;

      for (const yearConfig of FST_MSD_YEARS) {
        const yearFilters = {
          institutionId: selectedInstitutionId,
          programId: program.id,
        };
        const currentYears = await listAcademicItems('program_years', {
          getToken,
          status: 'all',
          filters: yearFilters,
        });
        const programYear = await findOrCreateAcademicItem(
          'program_years',
          currentYears,
          yearConfig.slug,
          {
            name: yearConfig.name,
            slug: yearConfig.slug,
            yearNumber: yearConfig.yearNumber,
            order: yearConfig.order,
          },
          yearFilters,
          status,
        );

        if (yearConfig.slug === '1ere-annee') {
          firstYear = programYear;
        }

        const semesterFilters = {
          institutionId: selectedInstitutionId,
          programId: program.id,
          programYearId: programYear.id,
        };
        const currentSemesters = await listAcademicItems('semesters', {
          getToken,
          status: 'all',
          filters: semesterFilters,
        });

        for (const semesterConfig of yearConfig.semesters) {
          const semester = await findOrCreateAcademicItem(
            'semesters',
            currentSemesters,
            semesterConfig.slug,
            semesterConfig,
            semesterFilters,
            status,
          );

          if (semesterConfig.slug === 's2') {
            s2Semester = semester;
          }
        }
      }

      if (!firstYear?.id || !s2Semester?.id) {
        throw new Error('S2 could not be prepared.');
      }

      const moduleFilters = {
        institutionId: selectedInstitutionId,
        programId: program.id,
        programYearId: firstYear.id,
        semesterId: s2Semester.id,
      };
      const currentModules = await listAcademicItems('modules', {
        getToken,
        status: 'all',
        filters: moduleFilters,
      });
      const existingModuleSlugs = new Set(currentModules.map((moduleItem) => moduleItem.slug));

      for (const moduleItem of FST_S2_MODULES) {
        if (existingModuleSlugs.has(moduleItem.slug)) continue;

        await createAcademicItem(
          'modules',
          {
            ...moduleFilters,
            ...moduleItem,
            description: '',
            status,
          },
          getToken,
        );
      }

      setSelectedProgramId(program.id);
      setSelectedProgramYearId(firstYear.id);
      setSelectedSemesterId(s2Semester.id);
      setMessage('FST MSD prepare: S1, S2, S3, S4 crees et les 5 modules places dans S2.');

      await loadEntity('programs', { institutionId: selectedInstitutionId });
      await loadEntity('program_years', { institutionId: selectedInstitutionId, programId: program.id });
      await loadEntity('semesters', {
        institutionId: selectedInstitutionId,
        programId: program.id,
        programYearId: firstYear.id,
      });
      await loadEntity('modules', moduleFilters);
    } catch (prepareError) {
      console.error('Unable to prepare FST MSD structure', prepareError);
      setError(formatAcademicApiError(prepareError, 'Impossible de preparer FST MSD.'));
    } finally {
      setActionLoadingId('');
    }
  }

  if (!canReadAdmin) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-red-200">
        Votre role ne permet pas de gerer la structure academique.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Layers size={20} />
            Gestion des ressources
          </h2>
          <p className="mt-1 text-sm text-white/40">
            Meme espace pour chaque etablissement: filiere, annee, semestre, module et ressources.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshCurrent}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          <RefreshCw size={15} />
          Actualiser
        </button>
        {canEdit && isFstSettat ? (
          <button
            type="button"
            disabled={actionLoadingId === 'structure:fst-msd'}
            onClick={prepareFstMsdStructure}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={15} />
            {actionLoadingId === 'structure:fst-msd' ? 'Preparation...' : 'Preparer FST MSD S1-S4'}
          </button>
        ) : null}
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

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <SelectBox
          label="Etablissement"
          value={selectedInstitutionId}
          items={institutions}
          placeholder={loading.institutions ? 'Chargement...' : 'Choisir un etablissement'}
          disabled={loading.institutions}
          onChange={setSelectedInstitutionId}
        />
        {selectedInstitution ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-lg font-bold text-white">{selectedInstitution.name}</div>
            <p className="mt-1 text-sm text-white/45">
              Gestion des ressources pour {selectedInstitution.shortName || selectedInstitution.name}. L'etablissement
              vient de la selection, donc il ne sera pas redemande dans les formulaires enfants.
            </p>
            {isFstSettat ? (
              <p className="mt-3 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary">
                Objectif FST: afficher S1, S2, S3, S4 et placer les 5 modules historiques directement dans S2.
              </p>
            ) : null}
            {hasNoStructureYet ? (
              <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50">
                Les contenus de cet etablissement seront bientot disponibles. Ajoute d'abord une filiere, puis les
                annees, semestres et modules.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <EntityPanel
          entityType="programs"
          items={programs}
          selectedId={selectedProgramId}
          parentReady={Boolean(selectedInstitutionId)}
          parentData={{ parentKey: selectedInstitutionId, defaultOrder: programs.length + 1 }}
          loading={loading.programs}
          canEdit={canEdit}
          canChangeStatus={canChangeStatus}
          actionLoadingId={actionLoadingId}
          onArchive={archiveItem}
          onCreate={createItem}
          onEdit={updateItem}
          onPublish={publishItem}
          onRestore={restoreItem}
          onSelect={setSelectedProgramId}
        />

        <EntityPanel
          entityType="program_years"
          items={programYears}
          selectedId={selectedProgramYearId}
          parentReady={Boolean(selectedInstitutionId && selectedProgramId)}
          parentData={{
            parentKey: `${selectedInstitutionId}:${selectedProgramId}`,
            defaultOrder: programYears.length + 1,
            defaultYearNumber: programYears.length + 1,
          }}
          loading={loading.program_years}
          canEdit={canEdit}
          canChangeStatus={canChangeStatus}
          actionLoadingId={actionLoadingId}
          onArchive={archiveItem}
          onCreate={createItem}
          onEdit={updateItem}
          onPublish={publishItem}
          onRestore={restoreItem}
          onSelect={setSelectedProgramYearId}
        />

        <EntityPanel
          entityType="semesters"
          items={semesters}
          selectedId={selectedSemesterId}
          parentReady={Boolean(selectedInstitutionId && selectedProgramId && selectedProgramYearId)}
          parentData={{
            parentKey: `${selectedInstitutionId}:${selectedProgramId}:${selectedProgramYearId}`,
            defaultOrder: semesters.length + 1,
            defaultSemesterNumber: semesters.length + 1,
          }}
          loading={loading.semesters}
          canEdit={canEdit}
          canChangeStatus={canChangeStatus}
          actionLoadingId={actionLoadingId}
          onArchive={archiveItem}
          onCreate={createItem}
          onEdit={updateItem}
          onPublish={publishItem}
          onRestore={restoreItem}
          onSelect={setSelectedSemesterId}
        />

        <EntityPanel
          entityType="modules"
          items={modules}
          selectedId=""
          parentReady={Boolean(selectedInstitutionId && selectedProgramId && selectedProgramYearId && selectedSemesterId)}
          parentData={{
            parentKey: `${selectedInstitutionId}:${selectedProgramId}:${selectedProgramYearId}:${selectedSemesterId}`,
            defaultOrder: modules.length + 1,
          }}
          loading={loading.modules}
          canEdit={canEdit}
          canChangeStatus={canChangeStatus}
          actionLoadingId={actionLoadingId}
          onArchive={archiveItem}
          onCreate={createItem}
          onEdit={updateItem}
          onPublish={publishItem}
          onRestore={restoreItem}
          onSelect={() => {}}
          extraAction={
            canEdit && selectedSemesterId ? (
              <button
                type="button"
                disabled={actionLoadingId === 'modules:fst-s2'}
                onClick={createFstS2Modules}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/40 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} />
                {actionLoadingId === 'modules:fst-s2' ? 'Placement...' : 'Placer les 5 modules FST S2'}
              </button>
            ) : null
          }
        />
      </div>
    </section>
  );
}
