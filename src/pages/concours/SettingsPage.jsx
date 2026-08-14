import { Settings } from 'lucide-react';
import Badge from '../../components/concours/common/Badge.jsx';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <Badge tone="violet">Parametres</Badge>
        <div className="mt-5 flex items-center gap-3 text-slate-950"><Settings size={24} className="text-primary" /><h2 className="text-3xl font-black">Concours settings</h2></div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Les parametres critiques du concours sont maintenant geres par les attempts serveur: timer, sauvegarde des reponses et scoring securise.</p>
      </section>
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-xl font-black text-slate-950">Source de verite</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">Firestore et les APIs serveur remplacent les anciens reglages locaux pour les flux d examen.</p>
      </section>
    </div>
  );
}
