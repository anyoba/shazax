import { useAuth } from '@clerk/clerk-react';
import { BookOpen, ChevronDown, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RESOURCE_CATEGORIES } from '../../../constants/academic.js';
import { USER_ROLES } from '../../../constants/roles.js';
import { useUserRole } from '../../../hooks/useUserRole.js';
import { listAcademicItems } from '../../../services/academicAdminApi.js';
import { listInstitutions } from '../../../services/institutionsApi.js';

const RESOURCE_CATEGORY_OPTIONS = RESOURCE_CATEGORIES.filter((category) => !category.disabled);

const initialForm = {
  institutionId: '',
  programId: '',
  programYearId: '',
  semesterId: '',
  moduleId: '',
  category: 'course',
  title: '',
  fileName: '',
  fileUrl: '',
  correctionTitle: '',
  correctionUrl: '',
};

function SelectField({ label, value, options, placeholder, disabled, onChange }) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-white/60">{label}</span>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-primary/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" className="bg-gray-900">
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id} className="bg-gray-900">
              {option.label || option.name}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-4 text-white/30" />
      </div>
    </label>
  );
}

function TextInput({ label, value, placeholder, required, onChange }) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-white/60">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
      />
    </label>
  );
}

function getApiErrorMessage(error, fallback) {
  const details = [];
  if (error?.status) details.push(`HTTP ${error.status}`);
  if (error?.code) details.push(`code: ${error.code}`);
  if (error?.stage) details.push(`stage: ${error.stage}`);
  if (error?.requestId) details.push(`requestId: ${error.requestId}`);

  const message = error?.message || fallback;
  return details.length > 0 ? `${message} (${details.join(' | ')})` : message;
}

export default function AcademicResourcesManager({
  resources,
  onAddResource,
  onDeleteResource,
  onRestoreResource,
}) {
  const { getToken } = useAuth();
  const { role } = useUserRole();
  const canManageResourceStatus = [
    USER_ROLES.EDITOR,
    USER_ROLES.ADMIN,
    USER_ROLES.OWNER,
  ].includes(role);
  const [form, setForm] = useState(initialForm);
  const [resourceView, setResourceView] = useState('active');
  const [statusOverrides, setStatusOverrides] = useState({});
  const [institutions, setInstitutions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [programYears, setProgramYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState({
    institutions: false,
    programs: false,
    programYears: false,
    semesters: false,
    modules: false,
    submit: false,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedInstitution = institutions.find((item) => item.id === form.institutionId);
  const selectedProgram = programs.find((item) => item.id === form.programId);
  const selectedProgramYear = programYears.find((item) => item.id === form.programYearId);
  const selectedSemester = semesters.find((item) => item.id === form.semesterId);
  const selectedModule = modules.find((item) => item.id === form.moduleId);

  const resourcesWithStatus = useMemo(
    () =>
      resources.map((resource) => ({
        ...resource,
        status: statusOverrides[resource.id] || resource.status || 'published',
      })),
    [resources, statusOverrides],
  );

  const filteredResources = useMemo(() => {
    if (!form.moduleId) return resourcesWithStatus;
    return resourcesWithStatus.filter((resource) => Array.isArray(resource.moduleIds) && resource.moduleIds.includes(form.moduleId));
  }, [form.moduleId, resourcesWithStatus]);

  const activeResources = useMemo(
    () => filteredResources.filter((resource) => resource.status !== 'archived' && resource.isDeleted !== true),
    [filteredResources],
  );

  const trashedResources = useMemo(
    () => filteredResources.filter((resource) => resource.status === 'archived' || resource.isDeleted === true),
    [filteredResources],
  );

  const visibleResources = resourceView === 'trash' ? trashedResources : activeResources;

  function updateForm(updates) {
    setForm((current) => ({ ...current, ...updates }));
    setMessage('');
    setError('');
  }

  const loadInstitutions = useCallback(async () => {
    setLoading((current) => ({ ...current, institutions: true }));
    setError('');

    try {
      const items = await listInstitutions({ admin: true, status: 'all', getToken });
      setInstitutions(items);
      if (items[0]?.id) {
        setForm((current) => (current.institutionId ? current : { ...current, institutionId: items[0].id }));
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Impossible de charger les etablissements.'));
    } finally {
      setLoading((current) => ({ ...current, institutions: false }));
    }
  }, [getToken]);

  const loadAcademicItems = useCallback(
    async (entityType, filters, loadingKey, setter) => {
      setLoading((current) => ({ ...current, [loadingKey]: true }));
      setError('');

      try {
        const items = await listAcademicItems(entityType, {
          getToken,
          status: 'all',
          filters,
        });
        setter(items);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, `Impossible de charger ${entityType}.`));
        setter([]);
      } finally {
        setLoading((current) => ({ ...current, [loadingKey]: false }));
      }
    },
    [getToken],
  );

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  useEffect(() => {
    setPrograms([]);
    setProgramYears([]);
    setSemesters([]);
    setModules([]);
    setForm((current) => ({
      ...current,
      programId: '',
      programYearId: '',
      semesterId: '',
      moduleId: '',
    }));

    if (form.institutionId) {
      loadAcademicItems('programs', { institutionId: form.institutionId }, 'programs', setPrograms);
    }
  }, [form.institutionId, loadAcademicItems]);

  useEffect(() => {
    setProgramYears([]);
    setSemesters([]);
    setModules([]);
    setForm((current) => ({
      ...current,
      programYearId: '',
      semesterId: '',
      moduleId: '',
    }));

    if (form.programId) {
      loadAcademicItems(
        'program_years',
        { institutionId: form.institutionId, programId: form.programId },
        'programYears',
        setProgramYears,
      );
    }
  }, [form.institutionId, form.programId, loadAcademicItems]);

  useEffect(() => {
    setSemesters([]);
    setModules([]);
    setForm((current) => ({
      ...current,
      semesterId: '',
      moduleId: '',
    }));

    if (form.programYearId) {
      loadAcademicItems(
        'semesters',
        {
          institutionId: form.institutionId,
          programId: form.programId,
          programYearId: form.programYearId,
        },
        'semesters',
        setSemesters,
      );
    }
  }, [form.institutionId, form.programId, form.programYearId, loadAcademicItems]);

  useEffect(() => {
    setModules([]);
    setForm((current) => ({ ...current, moduleId: '' }));

    if (form.semesterId) {
      loadAcademicItems(
        'modules',
        {
          institutionId: form.institutionId,
          programId: form.programId,
          programYearId: form.programYearId,
          semesterId: form.semesterId,
        },
        'modules',
        setModules,
      );
    }
  }, [form.institutionId, form.programId, form.programYearId, form.semesterId, loadAcademicItems]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading.submit) return;

    if (!selectedModule) {
      setError('Choisis un module avant d ajouter la ressource.');
      return;
    }

    setLoading((current) => ({ ...current, submit: true }));
    setError('');
    setMessage('');

    try {
      await onAddResource({
        module: selectedModule.name,
        moduleIds: [selectedModule.id],
        category: form.category,
        title: form.title,
        fileName: form.fileName,
        fileUrl: form.fileUrl,
        correctionTitle: form.correctionTitle,
        correctionUrl: form.correctionUrl,
        status: 'published',
      });

      setForm((current) => ({
        ...current,
        category: 'course',
        title: '',
        fileName: '',
        fileUrl: '',
        correctionTitle: '',
        correctionUrl: '',
      }));
      setMessage(`Ressource ajoutee dans ${selectedModule.name}.`);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Impossible d ajouter la ressource.'));
    } finally {
      setLoading((current) => ({ ...current, submit: false }));
    }
  }

  async function handleDelete(resourceId) {
    if (!window.confirm('Supprimer cette ressource ? Elle sera envoyee dans la corbeille.')) return;

    try {
      await onDeleteResource(resourceId);
      setStatusOverrides((current) => ({ ...current, [resourceId]: 'archived' }));
      setResourceView('trash');
      setMessage('Ressource envoyee dans la corbeille.');
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, 'Impossible de supprimer la ressource.'));
    }
  }

  async function handleRestore(resource) {
    if (!onRestoreResource) {
      setError('La restauration de ressource n est pas disponible.');
      return;
    }

    try {
      await onRestoreResource(resource);
      const restoredStatus =
        resource.previousStatus && resource.previousStatus !== 'archived'
          ? resource.previousStatus
          : 'published';
      setStatusOverrides((current) => ({ ...current, [resource.id]: restoredStatus }));
      setResourceView('active');
      setMessage('Ressource restauree.');
    } catch (restoreError) {
      setError(getApiErrorMessage(restoreError, 'Impossible de restaurer la ressource.'));
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <BookOpen size={20} />
          Resources
        </h2>
        <p className="mt-1 text-sm text-white/40">
          Ajoute une ressource en choisissant son etablissement, semestre et module academique.
        </p>
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

      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Etablissement"
            value={form.institutionId}
            options={institutions}
            placeholder={loading.institutions ? 'Chargement...' : 'Choisir un etablissement'}
            disabled={loading.institutions}
            onChange={(institutionId) => updateForm({ institutionId })}
          />
          <SelectField
            label="Filiere"
            value={form.programId}
            options={programs}
            placeholder={form.institutionId ? 'Choisir une filiere' : 'Choisis d abord un etablissement'}
            disabled={!form.institutionId || loading.programs}
            onChange={(programId) => updateForm({ programId })}
          />
          <SelectField
            label="Annee"
            value={form.programYearId}
            options={programYears}
            placeholder={form.programId ? 'Choisir une annee' : 'Choisis d abord une filiere'}
            disabled={!form.programId || loading.programYears}
            onChange={(programYearId) => updateForm({ programYearId })}
          />
          <SelectField
            label="Semestre"
            value={form.semesterId}
            options={semesters}
            placeholder={form.programYearId ? 'Choisir un semestre' : 'Choisis d abord une annee'}
            disabled={!form.programYearId || loading.semesters}
            onChange={(semesterId) => updateForm({ semesterId })}
          />
          <SelectField
            label="Module"
            value={form.moduleId}
            options={modules}
            placeholder={form.semesterId ? 'Choisir un module' : 'Choisis d abord un semestre'}
            disabled={!form.semesterId || loading.modules}
            onChange={(moduleId) => updateForm({ moduleId })}
          />
          <SelectField
            label="Type de ressource"
            value={form.category}
            options={RESOURCE_CATEGORY_OPTIONS}
            placeholder="Choisir une categorie"
            disabled={false}
            onChange={(category) => updateForm({ category })}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-gray-950/40 p-4 text-sm text-white/45">
          {selectedInstitution && selectedProgram && selectedProgramYear && selectedSemester && selectedModule ? (
            <span>
              Destination: <strong className="text-white">{selectedInstitution.name}</strong> / {selectedProgram.shortName || selectedProgram.name} / {selectedProgramYear.name} / {selectedSemester.name} / {selectedModule.name}
            </span>
          ) : (
            <span>Choisis la destination academique avant d ajouter le fichier.</span>
          )}
        </div>

        <div className="mt-5 grid gap-4">
          <TextInput
            label="Titre"
            value={form.title}
            placeholder="Titre de la ressource"
            required
            onChange={(title) => updateForm({ title })}
          />
          <TextInput
            label="Nom du fichier"
            value={form.fileName}
            placeholder="ex: analyse-2-cours-01.pdf"
            required
            onChange={(fileName) => updateForm({ fileName })}
          />
          <TextInput
            label="URL du fichier"
            value={form.fileUrl}
            placeholder="https://..."
            required
            onChange={(fileUrl) => updateForm({ fileUrl })}
          />
          <TextInput
            label="Titre correction"
            value={form.correctionTitle}
            placeholder="Correction facultative"
            onChange={(correctionTitle) => updateForm({ correctionTitle })}
          />
          <TextInput
            label="URL correction"
            value={form.correctionUrl}
            placeholder="https://..."
            onChange={(correctionUrl) => updateForm({ correctionUrl })}
          />
        </div>

        <button
          type="submit"
          disabled={loading.submit || !selectedModule}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={14} />
          {loading.submit ? 'Enregistrement...' : 'Add Resource'}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <h3 className="font-semibold text-white">Ressources</h3>
            <p className="mt-1 text-sm text-white/40">
              Les suppressions vont dans la corbeille et peuvent etre restaurees.
            </p>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-gray-950 p-1">
            <button
              type="button"
              onClick={() => setResourceView('active')}
              className={`rounded-lg px-3 py-2 text-sm font-bold ${
                resourceView === 'active' ? 'bg-white text-gray-950' : 'text-white/55 hover:text-white'
              }`}
            >
              Actives ({activeResources.length})
            </button>
            <button
              type="button"
              onClick={() => setResourceView('trash')}
              className={`rounded-lg px-3 py-2 text-sm font-bold ${
                resourceView === 'trash' ? 'bg-white text-gray-950' : 'text-white/55 hover:text-white'
              }`}
            >
              Corbeille ({trashedResources.length})
            </button>
          </div>
        </div>
        {visibleResources.length === 0 ? (
          <div className="p-6 text-white/40">
            {resourceView === 'trash'
              ? 'Aucune ressource dans la corbeille pour cette selection.'
              : 'Aucune ressource trouvee pour cette selection.'}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {visibleResources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-medium">{resource.title}</div>
                  <div className="text-sm text-white/40">
                    {resource.module || 'Module non renseigne'} - {resource.category}
                    {Array.isArray(resource.moduleIds) && resource.moduleIds.length > 0 ? ' - moduleIds' : ' - legacy'}
                  </div>
                </div>
                {canManageResourceStatus && resourceView === 'active' ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(resource.id)}
                    className="text-white/40 hover:text-red-400"
                    aria-label="Supprimer la ressource"
                    title="Envoyer dans la corbeille"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
                {canManageResourceStatus && resourceView === 'trash' ? (
                  <button
                    type="button"
                    onClick={() => handleRestore(resource)}
                    className="text-white/40 hover:text-green-300"
                    aria-label="Restaurer la ressource"
                    title="Restaurer la ressource"
                  >
                    <RotateCcw size={16} />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
