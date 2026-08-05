import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const termsSections = [
  {
    title: 'Objet de la plateforme',
    items: [
      'Shazaxx aide les étudiants à accéder à des ressources académiques organisées.',
      'Les contenus peuvent inclure cours, TD, examens, corrections et ressources pédagogiques.',
      'Les informations affichées doivent être vérifiées avant toute décision importante.',
    ],
  },
  {
    title: 'Compte utilisateur',
    items: [
      'L’utilisateur doit fournir des informations correctes lors de la création du compte.',
      'Le compte reste personnel et ne doit pas être partagé de manière abusive.',
      'Shazaxx peut limiter l’accès en cas d’usage frauduleux ou non conforme.',
    ],
  },
  {
    title: 'Contenus et ressources',
    items: [
      'Les ressources sont proposées pour aider à l’apprentissage, sans garantie de réussite.',
      'Les contenus signalés comme incorrects doivent être vérifiés et corrigés par l’administration.',
      'Les droits d’auteur des documents externes doivent être respectés.',
    ],
  },
  {
    title: 'À finaliser avant lancement',
    items: [
      'Ajouter l’identité juridique du projet ou de la société.',
      'Définir les règles de contribution et de modération des ressources.',
      'Préciser les règles futures de paiement si une offre premium est lancée.',
      'Faire valider ces conditions avant publication officielle.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f4f6fb] px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:text-primary"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText size={28} />
          </div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-primary">Conditions</p>
          <h1 className="font-heading text-4xl font-black tracking-tight md:text-5xl">
            Conditions d’utilisation
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-600">
            Cette page pose les règles de base pour utiliser Shazaxx. Elle doit être complétée et validée avant un lancement public complet.
          </p>

          <div className="mt-10 grid gap-5">
            {termsSections.map((section) => (
              <article key={section.title} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                <h2 className="font-heading text-xl font-black">{section.title}</h2>
                <ul className="mt-4 space-y-3 text-sm font-medium leading-6 text-slate-600">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
