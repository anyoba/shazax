import { useEffect, useMemo, useState } from 'react';
import { Save, X } from 'lucide-react';
import {
  ACADEMIC_STATUSES,
  ACADEMIC_STATUS_VALUES,
  INSTITUTION_TYPES,
} from '../../../constants/academic.js';
import {
  isValidInstitutionType,
  isValidSlug,
  isValidStatus,
  normalizeSlug,
} from '../../../utils/academicValidation.js';

const EMPTY_FORM = {
  name: '',
  shortName: '',
  slug: '',
  city: '',
  type: INSTITUTION_TYPES.FACULTY,
  description: '',
  logoUrl: '',
  websiteUrl: '',
  order: 1,
  status: ACADEMIC_STATUSES.DRAFT,
};

const TYPE_LABELS = {
  [INSTITUTION_TYPES.FACULTY]: 'Faculte',
  [INSTITUTION_TYPES.ENGINEERING_SCHOOL]: 'Ecole d ingenieurs',
  [INSTITUTION_TYPES.BUSINESS_SCHOOL]: 'Ecole de commerce',
  [INSTITUTION_TYPES.MEDICAL_SCHOOL]: 'Faculte de medecine',
  [INSTITUTION_TYPES.UNIVERSITY]: 'Universite',
  [INSTITUTION_TYPES.INSTITUTE]: 'Institut',
  [INSTITUTION_TYPES.OTHER]: 'Autre',
};

const STATUS_LABELS = {
  [ACADEMIC_STATUSES.DRAFT]: 'Brouillon',
  [ACADEMIC_STATUSES.REVIEW]: 'En revue',
  [ACADEMIC_STATUSES.PUBLISHED]: 'Publie',
  [ACADEMIC_STATUSES.ARCHIVED]: 'Archive',
};

function isHttpUrlOrEmpty(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function validateForm(form, canChangeStatus) {
  const errors = {};
  const order = Number(form.order);

  if (form.name.trim().length < 2 || form.name.trim().length > 120) {
    errors.name = 'Le nom doit contenir entre 2 et 120 caracteres.';
  }

  if (form.shortName.trim().length < 2 || form.shortName.trim().length > 50) {
    errors.shortName = 'Le nom court doit contenir entre 2 et 50 caracteres.';
  }

  if (!isValidSlug(form.slug)) {
    errors.slug = 'Slug invalide.';
  }

  if (form.city.trim().length < 2 || form.city.trim().length > 80) {
    errors.city = 'La ville doit contenir entre 2 et 80 caracteres.';
  }

  if (!isValidInstitutionType(form.type)) {
    errors.type = 'Type invalide.';
  }

  if (!Number.isInteger(order) || order < 0 || order > 9999) {
    errors.order = 'Ordre invalide.';
  }

  if (form.description.length > 2000) {
    errors.description = 'Description trop longue.';
  }

  if (!isHttpUrlOrEmpty(form.logoUrl)) {
    errors.logoUrl = 'URL invalide.';
  }

  if (!isHttpUrlOrEmpty(form.websiteUrl)) {
    errors.websiteUrl = 'URL invalide.';
  }

  if (canChangeStatus && !isValidStatus(form.status)) {
    errors.status = 'Statut invalide.';
  }

  return errors;
}

export default function InstitutionForm({
  initialValue = null,
  canChangeStatus = false,
  isSubmitting = false,
  onCancel,
  onSubmit,
}) {
  const isEditing = Boolean(initialValue?.id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!initialValue) {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
      setErrors({});
      return;
    }

    setForm({
      name: initialValue.name || '',
      shortName: initialValue.shortName || '',
      slug: initialValue.slug || '',
      city: initialValue.city || '',
      type: initialValue.type || INSTITUTION_TYPES.FACULTY,
      description: initialValue.description || '',
      logoUrl: initialValue.logoUrl || '',
      websiteUrl: initialValue.websiteUrl || '',
      order: Number.isFinite(initialValue.order) ? initialValue.order : 1,
      status: initialValue.status || ACADEMIC_STATUSES.DRAFT,
    });
    setSlugTouched(true);
    setErrors({});
  }, [initialValue]);

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

  function handleSlugChange(value) {
    setSlugTouched(true);
    setForm((current) => ({
      ...current,
      slug: normalizeSlug(value),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validateForm(form, canChangeStatus);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: form.name,
      shortName: form.shortName,
      slug: form.slug,
      city: form.city,
      type: form.type,
      description: form.description,
      logoUrl: form.logoUrl,
      websiteUrl: form.websiteUrl,
      order: Number(form.order),
    };

    if (canChangeStatus) {
      payload.status = form.status;
    }

    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {isEditing ? 'Modifier un etablissement' : 'Nouvel etablissement'}
          </h3>
          <p className="mt-1 text-sm text-white/40">
            Les dates et auteurs sont definis par le serveur.
          </p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            <X size={15} />
            Annuler
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-white/60">Nom</span>
          <input
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
            placeholder="FST Settat"
          />
          {errors.name ? <span className="text-xs text-red-300">{errors.name}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/60">Nom court</span>
          <input
            value={form.shortName}
            onChange={(event) => updateField('shortName', event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
            placeholder="FST Settat"
          />
          {errors.shortName ? <span className="text-xs text-red-300">{errors.shortName}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/60">Slug</span>
          <input
            value={form.slug}
            onChange={(event) => handleSlugChange(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
            placeholder="fst-settat"
          />
          {errors.slug ? <span className="text-xs text-red-300">{errors.slug}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/60">Ville</span>
          <input
            value={form.city}
            onChange={(event) => updateField('city', event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
            placeholder="Settat"
          />
          {errors.city ? <span className="text-xs text-red-300">{errors.city}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/60">Type</span>
          <select
            value={form.type}
            onChange={(event) => updateField('type', event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-white focus:border-primary/50 focus:outline-none"
          >
            {Object.values(INSTITUTION_TYPES).map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          {errors.type ? <span className="text-xs text-red-300">{errors.type}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/60">Ordre</span>
          <input
            type="number"
            min="0"
            max="9999"
            value={form.order}
            onChange={(event) => updateField('order', event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
          />
          {errors.order ? <span className="text-xs text-red-300">{errors.order}</span> : null}
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm text-white/60">Description</span>
          <textarea
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
            placeholder="Description courte de l'etablissement"
          />
          {errors.description ? <span className="text-xs text-red-300">{errors.description}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/60">URL du logo</span>
          <input
            value={form.logoUrl}
            onChange={(event) => updateField('logoUrl', event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
            placeholder="https://..."
          />
          {errors.logoUrl ? <span className="text-xs text-red-300">{errors.logoUrl}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/60">Site officiel</span>
          <input
            value={form.websiteUrl}
            onChange={(event) => updateField('websiteUrl', event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
            placeholder="https://..."
          />
          {errors.websiteUrl ? <span className="text-xs text-red-300">{errors.websiteUrl}</span> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/60">Statut</span>
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
              {STATUS_LABELS[form.status] || STATUS_LABELS[ACADEMIC_STATUSES.DRAFT]}
            </div>
          )}
          {errors.status ? <span className="text-xs text-red-300">{errors.status}</span> : null}
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={15} />
          {isSubmitting ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Creer'}
        </button>
      </div>
    </form>
  );
}
