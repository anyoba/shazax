import { categories } from '../data/modules';

function CategoryButton({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
        isActive
          ? 'bg-cocoa text-white shadow-float'
          : 'bg-[#f8f2eb] text-ink hover:bg-[#efe4d7]'
      }`}
    >
      {label}
    </button>
  );
}

function ResourceItem({ resource }) {
  return (
    <article className="rounded-[1.5rem] border border-[#efe3d4] bg-[#fffcf8] p-4 shadow-sm transition hover:shadow-float">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-base font-bold text-ink">{resource.title}</h4>
          <p className="mt-1 text-sm text-ink/55">{resource.fileName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={resource.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-cocoa px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            View / Download
          </a>
          {resource.correctionUrl ? (
            <a
              href={resource.correctionUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#e8d6c3] bg-white px-4 py-2 text-sm font-semibold text-cocoa transition hover:bg-[#f8efe6]"
            >
              {resource.correctionTitle || 'Correction'}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function ModuleModal({
  moduleName,
  activeCategory,
  onCategoryChange,
  resources,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#a67b5b]/20 p-4 backdrop-blur-md">
      <div className="animate-rise relative w-full max-w-4xl rounded-[2.25rem] border border-white/80 bg-white/90 p-6 shadow-soft backdrop-blur-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full bg-[#f8f2eb] px-3 py-2 text-sm font-bold text-cocoa transition hover:bg-[#efe3d4]"
        >
          Close
        </button>

        <div className="pr-16">
          <span className="rounded-full bg-[#f9f2ea] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cocoa">
            {moduleName}
          </span>
          <h2 className="mt-5 text-2xl font-extrabold text-ink sm:text-3xl">
            Choose a section and browse available resources
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/65">
            Courses, tutorials, and exams are grouped here with direct access to documents and
            optional corrections.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((category) => (
            <CategoryButton
              key={category}
              label={category}
              isActive={activeCategory === category}
              onClick={() => onCategoryChange(category)}
            />
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {resources.length > 0 ? (
            resources.map((resource) => <ResourceItem key={resource.id} resource={resource} />)
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-[#e6d5c4] bg-[#fcf7f1] px-6 py-10 text-center">
              <p className="text-base font-semibold text-ink">No files uploaded yet</p>
              <p className="mt-2 text-sm text-ink/60">
                Add resources from the admin page and they will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
