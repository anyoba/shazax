import { KeyRound } from 'lucide-react';
import EmptyState from '../../components/concours/common/EmptyState.jsx';

export default function ActivationPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3 text-primary"><KeyRound size={22} /><h2 className="text-3xl font-black text-slate-950">Activation</h2></div>
        <p className="mt-3 text-sm leading-6 text-slate-500">Aucun code demo n est necessaire. L acces concours depend maintenant de ton compte et des concours publies.</p>
      </section>
      <EmptyState title="Activation non requise" description="Les concours publies apparaissent directement dans la page concours." />
    </div>
  );
}
