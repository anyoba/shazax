import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import Badge from '../../components/concours/common/Badge.jsx';
import Toast from '../../components/concours/common/Toast.jsx';
import { DEMO_ACTIVATION_CODES, activateCode } from '../../services/concoursLocalStorage.js';

export default function ActivationPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);

  function submit(event) {
    event.preventDefault();
    setResult(activateCode(code));
  }

  return (
    <div className="space-y-6">
      <Toast message={result?.message} tone={result?.success ? 'green' : 'red'} />
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-primary">
          <KeyRound size={24} />
        </div>
        <Badge tone="violet">Activation locale</Badge>
        <h2 className="mt-4 text-3xl font-black text-slate-950">Codes d activation</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Cette premiere version ne contient aucun paiement reel. Les codes sont fictifs et toutes les fonctionnalites restent gratuites.
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="activation-code">Code</label>
          <input
            id="activation-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="SHAZAX-START"
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black uppercase outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <button type="submit" className="rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white">
            Activer
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
          Codes demo disponibles : {DEMO_ACTIVATION_CODES.join(', ')}
        </div>
      </section>
    </div>
  );
}
