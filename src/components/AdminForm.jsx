import { useState } from 'react';
import { categories, modules } from '../data/modules';

const initialForm = {
  module: modules[0],
  category: categories[0],
  title: '',
  fileName: '',
  fileUrl: '',
  correctionTitle: '',
  correctionUrl: '',
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

function inputClasses() {
  return 'w-full rounded-2xl border border-[#eadbca] bg-[#fffdf9] px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-cocoa focus:ring-4 focus:ring-[#b98d681a]';
}

export default function AdminForm({ onAddResource }) {
  const [formData, setFormData] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newResource = {
      id: `${formData.module}-${formData.category}-${Date.now()}`,
      ...formData,
    };

    onAddResource(newResource);
    setFormData(initialForm);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Module">
        <select name="module" value={formData.module} onChange={handleChange} className={inputClasses()}>
          {modules.map((moduleName) => (
            <option key={moduleName} value={moduleName}>
              {moduleName}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Category">
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={inputClasses()}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Resource Title">
        <input
          required
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={inputClasses()}
          placeholder="Example: Chapter 3 Notes"
        />
      </Field>

      <Field label="Displayed File Name">
        <input
          required
          type="text"
          name="fileName"
          value={formData.fileName}
          onChange={handleChange}
          className={inputClasses()}
          placeholder="chapter-3-notes.pdf"
        />
      </Field>

      <div className="sm:col-span-2">
        <Field label="File URL">
          <input
            required
            type="url"
            name="fileUrl"
            value={formData.fileUrl}
            onChange={handleChange}
            className={inputClasses()}
            placeholder="https://example.com/file.pdf"
          />
        </Field>
      </div>

      <Field label="Correction Title (Optional)">
        <input
          type="text"
          name="correctionTitle"
          value={formData.correctionTitle}
          onChange={handleChange}
          className={inputClasses()}
          placeholder="Correction Set 1"
        />
      </Field>

      <Field label="Correction URL (Optional)">
        <input
          type="url"
          name="correctionUrl"
          value={formData.correctionUrl}
          onChange={handleChange}
          className={inputClasses()}
          placeholder="https://example.com/correction.pdf"
        />
      </Field>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="w-full rounded-full bg-cocoa px-5 py-4 text-sm font-bold text-white shadow-float transition hover:-translate-y-0.5 hover:opacity-95"
        >
          Upload Resource
        </button>
      </div>
    </form>
  );
}
