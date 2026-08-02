import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Atom,
  BookOpen,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Circle,
  Download,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { RESOURCE_CATEGORIES } from '../constants/academic';
import { useAcademicTree } from '../hooks/useAcademicTree';
import {
  getNormalizedResourceCategory,
  getResourceLinkMode,
  isResourceLinkedToModule,
} from '../utils/learnCompatibility';
import { sortByOrder } from '../utils/academicValidation';

const COMPLETED_KEY = 'learn_completed_resources';

function readCompleted() {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(COMPLETED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function getCategoryLabel(categoryId) {
  return RESOURCE_CATEGORIES.find((category) => category.id === categoryId)?.label || 'Non classé';
}

function getInstitutionTypeLabel(type) {
  const labels = {
    faculty: 'Faculté',
    engineering_school: 'Ecole d\'ingénieurs',
    business_school: 'Ecole de commerce',
    medical_school: 'Faculté de médecine',
    university: 'Université',
    institute: 'Institut',
    other: 'Autre',
  };

  return labels[type] || 'Etablissement';
}

function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <FileText size={42} className="mx-auto mb-4 text-slate-300" />
      <h2 className="font-heading text-xl font-black text-slate-900">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
        <Loader2 size={28} className="mx-auto mb-3 animate-spin text-primary" />
        <p className="text-sm font-bold text-slate-600">Chargement des contenus...</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
      <h2 className="font-heading text-xl font-black">Impossible de charger Learn</h2>
      <p className="mt-2 text-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
      >
        <RefreshCw size={16} />
        Réessayer
      </button>
    </div>
  );
}

function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <Link to="/learn" className="font-semibold text-primary hover:underline">
        Learn
      </Link>
      {items.map((item) => (
        <span key={item.href || item.label} className="flex items-center gap-2">
          <ChevronRight size={14} />
          {item.href ? (
            <Link to={item.href} className="font-semibold text-slate-700 hover:text-primary hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function Header({ canGoBack }) {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-3">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Retour"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
            >
              <ArrowLeft size={16} />
            </button>
          ) : null}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
              S
            </div>
            <span className="font-heading text-lg font-black tracking-tight">Shazax Learn</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-semibold text-slate-600 sm:block">
            {user?.firstName ? `Bonjour ${user.firstName}` : 'Espace étudiant'}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}

function InstitutionCard({ institution, programsCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
          {institution.logoUrl ? (
            <img src={institution.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Building2 size={28} />
          )}
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">
          {getInstitutionTypeLabel(institution.type)}
        </span>
      </div>
      <h2 className="font-heading text-2xl font-black text-slate-900">{institution.name}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span className="font-semibold">{institution.shortName}</span>
        <span className="inline-flex items-center gap-1">
          <MapPin size={14} />
          {institution.city}
        </span>
      </div>
      <p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-6 text-slate-500">
        {institution.description || 'Contenus académiques en préparation pour cet établissement.'}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm font-bold text-slate-600">
          {programsCount} filière{programsCount > 1 ? 's' : ''}
        </span>
        <Link
          to={`/learn/${institution.slug}`}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-primary"
        >
          Explorer
          <ChevronRight size={16} />
        </Link>
      </div>
    </motion.div>
  );
}

function ProgramCard({ institution, program }) {
  return (
    <Link
      to={`/learn/${institution.slug}/${program.slug}`}
      className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <GraduationCap size={24} />
      </div>
      <h2 className="font-heading text-xl font-black text-slate-900">{program.name}</h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">{program.shortName}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
        Voir les semestres
        <ChevronRight size={16} className="transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function SemesterCard({ institution, program, semester, modulesCount }) {
  return (
    <Link
      to={`/learn/${institution.slug}/${program.slug}/${semester.slug}`}
      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div>
        <h3 className="font-heading text-lg font-black text-slate-900">{semester.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {modulesCount} module{modulesCount > 1 ? 's' : ''} disponible{modulesCount > 1 ? 's' : ''}
        </p>
      </div>
      <div className="rounded-full bg-primary/10 p-2 text-primary">
        <ChevronRight size={18} />
      </div>
    </Link>
  );
}

const MODULE_CARD_THEMES = [
  {
    match: ['thermodynamics', 'thermodynamique'],
    icon: FlaskConical,
    card: 'border-orange-100 bg-[linear-gradient(135deg,#fff4df_0%,#fff7ec_55%,#fff2f2_100%)]',
    iconColor: 'text-orange-500',
    linkColor: 'text-orange-400',
  },
  {
    match: ['mechanics', 'mecanique', 'mécanique'],
    icon: Layers,
    card: 'border-sky-100 bg-[linear-gradient(135deg,#eaf5ff_0%,#f2fbff_55%,#eef9ff_100%)]',
    iconColor: 'text-sky-500',
    linkColor: 'text-sky-400',
  },
  {
    match: ['analysis', 'analyse'],
    icon: Calculator,
    card: 'border-cyan-100 bg-[linear-gradient(135deg,#dffbfb_0%,#ecfffd_55%,#f1fff8_100%)]',
    iconColor: 'text-cyan-600',
    linkColor: 'text-cyan-600',
  },
  {
    match: ['algebra', 'algebre', 'algèbre'],
    icon: BookOpen,
    card: 'border-violet-100 bg-[linear-gradient(135deg,#f3eaff_0%,#faf3ff_55%,#f8f3ff_100%)]',
    iconColor: 'text-violet-500',
    linkColor: 'text-violet-400',
  },
  {
    match: ['structure of matter', 'structure de la matiere', 'structure de la matière'],
    icon: Atom,
    card: 'border-emerald-100 bg-[linear-gradient(135deg,#dcfce7_0%,#ecfff5_55%,#effef6_100%)]',
    iconColor: 'text-emerald-500',
    linkColor: 'text-emerald-500',
  },
];

function normalizeModuleName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getModuleCardTheme(moduleName) {
  const normalizedName = normalizeModuleName(moduleName);
  return (
    MODULE_CARD_THEMES.find((theme) =>
      theme.match.some((keyword) => normalizedName.includes(normalizeModuleName(keyword))),
    ) || {
      icon: Layers,
      card: 'border-slate-100 bg-white',
      iconColor: 'text-primary',
      linkColor: 'text-primary',
    }
  );
}

function ModuleCard({ institution, program, semester, moduleItem, resources }) {
  const linkedResources = resources.filter((resource) => isResourceLinkedToModule(resource, moduleItem));
  const theme = getModuleCardTheme(moduleItem.name);
  const Icon = theme.icon;

  return (
    <Link
      to={`/learn/${institution.slug}/${program.slug}/${semester.slug}/${moduleItem.slug}`}
      className={`group min-h-[180px] rounded-[2rem] border p-7 shadow-[0_18px_45px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.09)] ${theme.card}`}
    >
      <div className={`mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/45 shadow-sm ${theme.iconColor}`}>
        <Icon size={25} strokeWidth={2.4} />
      </div>
      <h2 className="font-heading text-xl font-black tracking-tight text-slate-900">{moduleItem.name}</h2>
      <div className={`mt-3 inline-flex items-center gap-1 text-sm font-bold ${theme.linkColor}`}>
        Open module
        <ChevronRight size={15} className="transition group-hover:translate-x-1" />
      </div>
      <span className="sr-only">{linkedResources.length} resources available</span>
    </Link>
  );
}

function ResourceRow({ resource, moduleItem, completed, onToggle }) {
  const linkMode = getResourceLinkMode(resource, moduleItem);
  const normalizedCategory = getNormalizedResourceCategory(resource.category);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => onToggle(resource.id)}
          className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-300 hover:text-primary"
          aria-label={completed ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
        >
          {completed ? <CheckCircle2 size={24} className="text-primary" /> : <Circle size={24} />}
        </button>
        <div className="min-w-0">
          <h3 className={`font-heading text-lg font-black ${completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {resource.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              {getCategoryLabel(normalizedCategory)}
            </span>
            {linkMode === 'legacy' ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                Legacy
              </span>
            ) : null}
            {resource.fileName ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-600">
                {resource.fileName}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
        {resource.correctionUrl ? (
          <a
            href={resource.correctionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
          >
            Correction
          </a>
        ) : null}
        <a
          href={resource.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-primary"
        >
          <Download size={15} />
          Ouvrir
        </a>
      </div>
    </div>
  );
}

function InstitutionsView({ institutions, programs }) {
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLowerCase();
  const visibleInstitutions = institutions.filter((institution) => {
    if (!normalizedSearch) return true;
    return `${institution.name} ${institution.shortName} ${institution.city}`
      .toLowerCase()
      .includes(normalizedSearch);
  });

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="font-heading text-4xl font-black text-slate-950">Choisir un établissement</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-500">
          Explore les filières, semestres, modules et ressources publiées par Shazax.
        </p>
      </div>

      <div className="mb-7 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Search size={18} className="text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par établissement ou ville"
          className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      {visibleInstitutions.length === 0 ? (
        <EmptyState
          title="Aucun établissement publié"
          description="Publie d'abord un établissement depuis l'administration pour l'afficher ici."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {visibleInstitutions.map((institution) => (
            <InstitutionCard
              key={institution.id}
              institution={institution}
              programsCount={programs.filter((program) => program.institutionId === institution.id).length}
            />
          ))}
        </div>
      )}
    </>
  );
}

function InstitutionView({ institution, programs, programYears, semesters, modules }) {
  return (
    <>
      <Breadcrumbs items={[{ label: institution.name }]} />
      <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <MapPin size={13} />
              {institution.city}
            </div>
            <h1 className="font-heading text-4xl font-black text-slate-950">{institution.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              {institution.description || 'Les contenus de cet établissement sont en cours de structuration.'}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm font-bold text-slate-600">
            {programs.length} filière{programs.length > 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {programs.length === 0 ? (
        <EmptyState title="Les contenus de cet établissement seront bientôt disponibles." />
      ) : programs.length === 1 ? (
        <ProgramOverview
          institution={institution}
          program={programs[0]}
          programYears={programYears}
          semesters={semesters}
          modules={modules}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {programs.map((program) => (
            <ProgramCard key={program.id} institution={institution} program={program} />
          ))}
        </div>
      )}
    </>
  );
}

function ProgramOverview({ institution, program, programYears, semesters, modules }) {
  const allProgramYears = sortByOrder(programYears || []);
  const allSemesters = semesters || [];
  const allModules = modules || [];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: institution.name, href: `/learn/${institution.slug}` },
          { label: program.name },
        ]}
      />
      <div className="mb-7">
        <h1 className="font-heading text-3xl font-black text-slate-950">{program.name}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">{program.shortName}</p>
      </div>

      {allProgramYears.length === 0 ? (
        <EmptyState title="Les semestres de cette filière seront bientôt disponibles." />
      ) : (
        <div className="space-y-6">
          {allProgramYears.map((programYear) => {
            const yearSemesters = sortByOrder(
              allSemesters.filter((semester) => semester.programYearId === programYear.id),
            );

            return (
              <section key={programYear.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                <h2 className="mb-4 font-heading text-xl font-black text-slate-900">{programYear.name}</h2>
                {yearSemesters.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun semestre publié pour le moment.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {yearSemesters.map((semester) => (
                      <SemesterCard
                        key={semester.id}
                        institution={institution}
                        program={program}
                        semester={semester}
                        modulesCount={allModules.filter((moduleItem) => moduleItem.semesterId === semester.id).length}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function SemesterView({ institution, program, semester, modules, resources }) {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: institution.name, href: `/learn/${institution.slug}` },
          { label: program.name, href: `/learn/${institution.slug}/${program.slug}` },
          { label: semester.name },
        ]}
      />
      <div className="mb-10 text-center">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-primary">{semester.name}</p>
        <h1 className="font-heading text-4xl font-black tracking-tight text-slate-950">Your Modules</h1>
        <p className="mx-auto mt-3 max-w-xl text-base font-medium text-slate-500">
          Select a module to access courses, TDs, TPs, and exams
        </p>
      </div>

      {modules.length === 0 ? (
        <EmptyState title="Les modules de ce semestre seront bientôt disponibles." />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {modules.map((moduleItem) => (
            <ModuleCard
              key={moduleItem.id}
              institution={institution}
              program={program}
              semester={semester}
              moduleItem={moduleItem}
              resources={resources}
            />
          ))}
        </div>
      )}
    </>
  );
}

function ModuleView({ institution, program, semester, moduleItem, resources }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [completedIds, setCompletedIds] = useState(() => readCompleted());

  const moduleResources = useMemo(() => {
    const linkedResources = resources.filter((resource) => isResourceLinkedToModule(resource, moduleItem));
    if (!selectedCategory) return linkedResources;

    return linkedResources.filter(
      (resource) => getNormalizedResourceCategory(resource.category) === selectedCategory,
    );
  }, [moduleItem, resources, selectedCategory]);

  const completedCount = moduleResources.filter((resource) => completedIds.has(resource.id)).length;
  const progressWidth = moduleResources.length > 0 ? (completedCount / moduleResources.length) * 100 : 0;

  useEffect(() => {
    window.localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completedIds]));
  }, [completedIds]);

  function toggleDone(resourceId) {
    setCompletedIds((previousIds) => {
      const nextIds = new Set(previousIds);
      if (nextIds.has(resourceId)) nextIds.delete(resourceId);
      else nextIds.add(resourceId);
      return nextIds;
    });
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: institution.name, href: `/learn/${institution.slug}` },
          { label: program.name, href: `/learn/${institution.slug}/${program.slug}` },
          { label: semester.name, href: `/learn/${institution.slug}/${program.slug}/${semester.slug}` },
          { label: moduleItem.name },
        ]}
      />
      <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <BookOpen size={13} />
              {semester.name}
            </div>
            <h1 className="font-heading text-4xl font-black text-slate-950">{moduleItem.name}</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ressources liées par moduleIds, avec compatibilité temporaire pour les anciennes ressources.
            </p>
          </div>
          <div className="min-w-[180px]">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Progression</span>
              <span>
                {completedCount}/{moduleResources.length}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap gap-3">
        {RESOURCE_CATEGORIES.filter((category) => !category.adminOnly).map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              if (!category.disabled) {
                setSelectedCategory((current) => (current === category.id ? null : category.id));
              }
            }}
            disabled={category.disabled}
            className={`rounded-full px-5 py-2.5 text-sm font-black transition ${
              selectedCategory === category.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-primary/40'
            } ${category.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            {category.label}
            {category.badge ? (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                {category.badge}
              </span>
            ) : null}
          </button>
        ))}
        {selectedCategory ? (
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-black text-slate-500 hover:text-primary"
          >
            Toutes
          </button>
        ) : null}
      </div>

      {moduleResources.length === 0 ? (
        <EmptyState
          title="Aucune ressource disponible"
          description="Les ressources publiées apparaîtront ici après rattachement au module."
        />
      ) : (
        <div className="space-y-3">
          {moduleResources.map((resource) => (
            <ResourceRow
              key={resource.id}
              resource={resource}
              moduleItem={moduleItem}
              completed={completedIds.has(resource.id)}
              onToggle={toggleDone}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function LearnPage({ resources }) {
  const { institutionSlug, programSlug, semesterSlug, moduleSlug } = useParams();
  const { data, loading, error, refetch } = useAcademicTree();
  const institution = data.institutions.find((item) => item.slug === institutionSlug);
  const programs = sortByOrder(data.programs.filter((program) => program.institutionId === institution?.id));
  const selectedProgram =
    programs.find((program) => program.slug === programSlug) ||
    (!programSlug && programs.length === 1 ? programs[0] : null);
  const programYears = sortByOrder(
    data.programYears.filter((programYear) => programYear.programId === selectedProgram?.id),
  );
  const programYearIds = new Set(programYears.map((programYear) => programYear.id));
  const semesters = sortByOrder(
    data.semesters.filter((semester) => programYearIds.has(semester.programYearId)),
  );
  const semester = semesters.find((item) => item.slug === semesterSlug);
  const modules = sortByOrder(data.modules.filter((moduleItem) => moduleItem.semesterId === semester?.id));
  const moduleItem = modules.find((item) => item.slug === moduleSlug);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6fb]">
        <Header canGoBack={Boolean(institutionSlug)} />
        <main className="mx-auto max-w-6xl px-5 py-12">
          <LoadingState />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f6fb]">
        <Header canGoBack={Boolean(institutionSlug)} />
        <main className="mx-auto max-w-6xl px-5 py-12">
          <ErrorState message={error} onRetry={refetch} />
        </main>
      </div>
    );
  }

  let content = null;

  if (!institutionSlug) {
    content = <InstitutionsView institutions={data.institutions} programs={data.programs} />;
  } else if (!institution) {
    content = (
      <EmptyState
        title="Etablissement introuvable"
        description="Cet établissement n'est pas publié ou n'existe pas."
        action={
          <Link to="/learn" className="rounded-full bg-primary px-5 py-2 text-sm font-black text-white">
            Retour aux établissements
          </Link>
        }
      />
    );
  } else if (moduleSlug) {
    content =
      selectedProgram && semester && moduleItem ? (
        <ModuleView
          institution={institution}
          program={selectedProgram}
          semester={semester}
          moduleItem={moduleItem}
          resources={resources}
        />
      ) : (
        <EmptyState title="Module introuvable" description="Le module demandé n'est pas publié." />
      );
  } else if (semesterSlug) {
    content =
      selectedProgram && semester ? (
        <SemesterView
          institution={institution}
          program={selectedProgram}
          semester={semester}
          modules={modules}
          resources={resources}
        />
      ) : (
        <EmptyState title="Semestre introuvable" description="Le semestre demandé n'est pas publié." />
      );
  } else if (programSlug) {
    content = selectedProgram ? (
      <ProgramOverview
        institution={institution}
        program={selectedProgram}
        programYears={programYears}
        semesters={semesters}
        modules={data.modules}
      />
    ) : (
      <EmptyState title="Filière introuvable" description="La filière demandée n'est pas publiée." />
    );
  } else {
    const singleProgram = programs.length === 1 ? programs[0] : null;
    const singleProgramYears = sortByOrder(
      data.programYears.filter((programYear) => programYear.programId === singleProgram?.id),
    );
    const singleProgramYearIds = new Set(singleProgramYears.map((programYear) => programYear.id));
    const singleProgramSemesters = sortByOrder(
      data.semesters.filter((semesterItem) => singleProgramYearIds.has(semesterItem.programYearId)),
    );

    content = (
      <InstitutionView
        institution={institution}
        programs={programs}
        programYears={singleProgramYears}
        semesters={singleProgramSemesters}
        modules={data.modules}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Header canGoBack={Boolean(institutionSlug)} />
      <main className="mx-auto max-w-6xl px-5 py-12">{content}</main>
    </div>
  );
}
