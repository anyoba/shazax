import { useState } from 'react';
import { RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import Badge from '../../components/concours/common/Badge.jsx';
import ConfirmDialog from '../../components/concours/common/ConfirmDialog.jsx';
import Toast from '../../components/concours/common/Toast.jsx';
import { getSettings, resetConcoursLocalData, saveSettings } from '../../services/concoursLocalStorage.js';

function Toggle({ checked, label, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-violet-600"
      />
    </label>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => getSettings());
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  function update(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    saveSettings(settings);
    setMessage('Parametres enregistres localement.');
    window.setTimeout(() => setMessage(''), 1800);
  }

  function resetAll() {
    resetConcoursLocalData();
    setSettings(getSettings());
    setConfirmReset(false);
    setMessage('Donnees locales Concours reinitialisees.');
  }

  return (
    <div className="space-y-6">
      <Toast message={message} />
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-primary">
            <SlidersHorizontal size={24} />
          </div>
          <div>
            <Badge tone="slate">Francais uniquement</Badge>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Parametres</h2>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="grid gap-3 md:grid-cols-2">
          <Toggle checked={settings.soundEnabled} label="Sons actives" onChange={(value) => update('soundEnabled', value)} />
          <Toggle checked={settings.reducedMotion} label="Animations reduites" onChange={(value) => update('reducedMotion', value)} />
          <Toggle checked={settings.timerVisible} label="Chronometre affiche" onChange={(value) => update('timerVisible', value)} />
          <Toggle checked={settings.confirmBeforeQuit} label="Confirmation avant quitter" onChange={(value) => update('confirmBeforeQuit', value)} />
        </div>
        <label className="mt-5 block max-w-xs">
          <span className="mb-2 block text-sm font-black text-slate-700">Objectif quotidien</span>
          <input
            type="number"
            min="5"
            max="100"
            value={settings.dailyGoal}
            onChange={(event) => update('dailyGoal', Number(event.target.value))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black"
          />
        </label>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white">
            <Save size={17} />
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-black text-red-700"
          >
            <RotateCcw size={17} />
            Reinitialiser les donnees locales
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmReset}
        title="Reinitialiser Shazax Concours ?"
        message="Cette action supprime sessions, XP, favoris, erreurs, profil local et parametres Concours de ce navigateur."
        confirmLabel="Reinitialiser"
        onCancel={() => setConfirmReset(false)}
        onConfirm={resetAll}
      />
    </div>
  );
}
