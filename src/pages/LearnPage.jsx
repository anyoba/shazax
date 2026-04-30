import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Atom,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Circle,
  Download,
  ExternalLink,
  FileText,
  FlaskConical,
  Layers,
  Loader2,
  LogOut,
  Trophy,
} from 'lucide-react';
import { useUser, UserButton } from '@clerk/clerk-react';

const MODULES = [
  {
    id: 'Thermodynamics',
    label: 'Thermodynamics',
    icon: FlaskConical,
    gradient: 'from-orange-100 to-red-50',
    iconBg: 'bg-orange-100',
    accent: 'text-orange-500',
    activeBorder: 'border-orange-300',
    pill: 'bg-orange-50 border-orange-200 text-orange-600',
    checkColor: 'text-orange-400',
  },
  {
    id: 'Mechanics',
    label: 'Mechanics',
    icon: Layers,
    gradient: 'from-blue-100 to-sky-50',
    iconBg: 'bg-blue-100',
    accent: 'text-blue-500',
    activeBorder: 'border-blue-300',
    pill: 'bg-blue-50 border-blue-200 text-blue-600',
    checkColor: 'text-blue-400',
  },
  {
    id: 'Analysis 2',
    label: 'Analysis 2',
    icon: Calculator,
    gradient: 'from-cyan-100 to-teal-50',
    iconBg: 'bg-cyan-100',
    accent: 'text-cyan-600',
    activeBorder: 'border-cyan-300',
    pill: 'bg-cyan-50 border-cyan-200 text-cyan-600',
    checkColor: 'text-cyan-500',
  },
  {
    id: 'Algebra 2',
    label: 'Algebra 2',
    icon: BookOpen,
    gradient: 'from-purple-100 to-violet-50',
    iconBg: 'bg-purple-100',
    accent: 'text-purple-500',
    activeBorder: 'border-purple-300',
    pill: 'bg-purple-50 border-purple-200 text-purple-600',
    checkColor: 'text-purple-400',
  },
  {
    id: 'Structure of Matter',
    label: 'Structure of Matter',
    icon: Atom,
    gradient: 'from-emerald-100 to-green-50',
    iconBg: 'bg-emerald-100',
    accent: 'text-emerald-500',
    activeBorder: 'border-emerald-300',
    pill: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    checkColor: 'text-emerald-500',
  },
  {
    id: 'Concours',
    label: 'Concours',
    icon: Trophy,
    gradient: 'from-yellow-100 to-amber-50',
    iconBg: 'bg-yellow-100',
    accent: 'text-yellow-600',
    activeBorder: 'border-yellow-300',
    pill: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    checkColor: 'text-yellow-500',
  },
];

const CATEGORIES = [
  { id: 'Courses', label: 'Cours' },
  { id: 'TD', label: 'TD' },
  { id: 'Exams', label: 'Examens' },
  { id: 'Resources', label: 'Ressources Live' },
];

const CONCOURS_KEY = 'admin_concours_items';
const COMPLETED_KEY = 'learn_completed_resources';

function readCompleted() {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(COMPLETED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function readConcours() {
  try {
    return JSON.parse(window.localStorage.getItem(CONCOURS_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function LearnPage({ resources }) {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completedIds, setCompletedIds] = useState(() => readCompleted());
  const [toggling, setToggling] = useState(null);
  const [concoursList, setConcoursList] = useState(() => readConcours());
  const [concoursLoading, setConcoursLoading] = useState(false);

  const activeModule = MODULES.find((moduleItem) => moduleItem.id === selectedModule);

  const filteredResources = useMemo(() => {
    if (!selectedModule || !selectedCategory) return [];
    return resources.filter(
      (resource) => resource.module === selectedModule && resource.category === selectedCategory,
    );
  }, [resources, selectedCategory, selectedModule]);

  useEffect(() => {
    window.localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completedIds]));
  }, [completedIds]);

  useEffect(() => {
    if (selectedModule === 'Concours') {
      setConcoursLoading(true);
      window.setTimeout(() => {
        setConcoursList(readConcours());
        setConcoursLoading(false);
      }, 250);
    }
  }, [selectedModule]);

  useEffect(() => {
    if (!selectedModule || !selectedCategory) return;
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 250);
    return () => window.clearTimeout(timer);
  }, [selectedCategory, selectedModule]);

  function toggleDone(resourceId) {
    if (toggling === resourceId) return;
    setToggling(resourceId);
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(resourceId)) next.delete(resourceId);
      else next.add(resourceId);
      return next;
    });
    window.setTimeout(() => setToggling(null), 180);
  }

  function goBack() {
    setSelectedModule(null);
    setSelectedCategory(null);
  }

  const completedCount = filteredResources.filter((resource) => completedIds.has(resource.id)).length;
  const progressWidth = filteredResources.length > 0 ? (completedCount / filteredResources.length) * 100 : 0;

  const { user } = useUser();

  return (
    <div className="min-h-screen bg-[#f0f2f8]">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            {selectedModule ? (
              <button
                onClick={goBack}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
              >
                <ArrowLeft size={15} />
              </button>
            ) : null}
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
                S
              </div>
              <span className="font-heading text-lg font-bold tracking-tight">Shazaxx</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                {user?.firstName?.[0] ?? 'S'}
              </div>
              <span className="hidden text-sm font-medium text-gray-700 sm:block">
                {user?.firstName ? `Bonjour ${user.firstName}` : 'Guest Student'}
              </span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12">
        <AnimatePresence mode="wait">
          {!selectedModule ? (
            <motion.div
              key="modules"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-10 text-center">
                <h1 className="mb-2 font-heading text-4xl font-black">Your Modules</h1>
                <p className="text-base text-gray-500">
                  Select a module to access courses, TDs, exams, and concours links
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {MODULES.map((moduleItem, index) => {
                  const Icon = moduleItem.icon;
                  return (
                    <motion.button
                      key={moduleItem.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      whileHover={{ y: -3, scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedModule(moduleItem.id)}
                      className={`group cursor-pointer rounded-3xl border border-white bg-gradient-to-br ${moduleItem.gradient} p-7 text-left shadow-sm transition-all duration-200 hover:shadow-md`}
                    >
                      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${moduleItem.iconBg}`}>
                        <Icon size={28} className={moduleItem.accent} />
                      </div>
                      <h3 className="mb-2 font-heading text-xl font-bold text-gray-800">{moduleItem.label}</h3>
                      <div className={`flex items-center gap-1 text-sm font-medium ${moduleItem.accent} opacity-70 transition-opacity group-hover:opacity-100`}>
                        Open module <ChevronRight size={14} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={selectedModule}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-8">
                <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${activeModule?.pill}`}>
                  {activeModule ? <activeModule.icon size={12} /> : null}
                  {activeModule?.label}
                </div>
                <h1 className="font-heading text-3xl font-black text-gray-800">{activeModule?.label}</h1>
                <p className="mt-1 text-sm text-gray-400">
                  {selectedModule === 'Concours'
                    ? 'Browse competition links and entrance exam resources'
                    : 'Choose a category to browse resources'}
                </p>
              </div>

              {selectedModule === 'Concours' ? (
                <div>
                  {concoursLoading ? (
                    <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center text-gray-400 shadow-sm">
                      <Loader2 size={32} className="mx-auto mb-3 animate-spin text-gray-300" />
                      Loading...
                    </div>
                  ) : concoursList.length === 0 ? (
                    <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center shadow-sm">
                      <Trophy size={48} className="mx-auto mb-4 text-gray-200" />
                      <p className="font-semibold text-gray-500">No concours yet</p>
                      <p className="mt-1 text-sm text-gray-400">Links will appear here once added by the admin</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {concoursList.map((entry, index) => (
                        <motion.a
                          key={entry.id}
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm transition-all hover:border-yellow-200 hover:shadow-md"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-100">
                              <Trophy size={17} className="text-yellow-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800 transition-colors group-hover:text-yellow-700">
                                {entry.name}
                              </div>
                              <div className="mt-0.5 max-w-[200px] truncate text-xs text-gray-400">
                                {entry.url.replace(/^https?:\/\//, '')}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex flex-shrink-0 items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-yellow-600">
                            <ExternalLink size={13} /> Open
                          </div>
                        </motion.a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-8 flex flex-wrap gap-3">
                    {CATEGORIES.map((categoryItem) => (
                      <button
                        key={categoryItem.id}
                        onClick={() =>
                          setSelectedCategory(categoryItem.id === selectedCategory ? null : categoryItem.id)
                        }
                        className={`rounded-full px-7 py-3 text-sm font-semibold transition-all duration-200 ${
                          selectedCategory === categoryItem.id
                            ? 'scale-105 bg-gray-900 text-white shadow-md'
                            : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:scale-105 hover:border-gray-400'
                        }`}
                      >
                        {categoryItem.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {selectedCategory ? (
                      <motion.div
                        key={selectedCategory}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {loading ? (
                          <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center text-gray-400 shadow-sm">
                            <Loader2 size={32} className="mx-auto mb-3 animate-spin text-gray-300" />
                            Loading resources...
                          </div>
                        ) : filteredResources.length === 0 ? (
                          <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center shadow-sm">
                            <FileText size={48} className="mx-auto mb-4 text-gray-200" />
                            <p className="font-semibold text-gray-500">No resources yet</p>
                            <p className="mt-1 text-sm text-gray-400">
                              Content will appear here once uploaded by the admin
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="mb-3 flex items-center justify-between px-1">
                              <span className="text-xs font-medium text-gray-400">
                                {completedCount} / {filteredResources.length} completed
                              </span>
                              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200">
                                <motion.div
                                  className={`h-full rounded-full ${activeModule?.accent.replace('text-', 'bg-')}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressWidth}%` }}
                                  transition={{ duration: 0.4, ease: 'easeOut' }}
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              {filteredResources.map((resource, index) => {
                                const isDone = completedIds.has(resource.id);
                                return (
                                  <motion.div
                                    key={resource.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`flex items-center justify-between rounded-2xl border bg-white px-6 py-4 shadow-sm transition-all ${
                                      isDone
                                        ? 'border-gray-100 opacity-70'
                                        : `border-gray-100 hover:${activeModule?.activeBorder} hover:shadow-sm`
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <button
                                        onClick={() => toggleDone(resource.id)}
                                        disabled={toggling === resource.id}
                                        className="flex-shrink-0 transition-all duration-200 hover:scale-110 active:scale-95"
                                        title={isDone ? 'Mark as not done' : 'Mark as done'}
                                      >
                                        {isDone ? (
                                          <CheckCircle2 size={22} className={`${activeModule?.checkColor} transition-colors`} />
                                        ) : (
                                          <Circle size={22} className="text-gray-300 transition-colors hover:text-gray-400" />
                                        )}
                                      </button>
                                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${activeModule?.iconBg}`}>
                                        <FileText size={17} className={activeModule?.accent} />
                                      </div>
                                      <div>
                                        <div className={`font-semibold ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                          {resource.title}
                                        </div>
                                        <div className="mt-0.5 text-xs text-gray-400">
                                          {resource.category} • {activeModule?.label}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                                      {resource.correctionUrl ? (
                                        <a
                                          href={resource.correctionUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                                        >
                                          Correction
                                        </a>
                                      ) : null}
                                      <a
                                        href={resource.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
                                      >
                                        <Download size={13} /> View
                                      </a>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-gray-200 bg-white/70 px-5 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 text-sm text-gray-500 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
              S
            </div>
            <span className="font-heading font-bold text-gray-800">Shazaxx Learn</span>
          </div>
          <div>Study smarter with your saved resources and progress.</div>
        </div>
      </footer>
    </div>
  );
}
