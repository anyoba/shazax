import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const privacySections = [
  {
    title: 'Données collectées',
    items: [
      'Adresse email quand un utilisateur rejoint la waitlist ou crée un compte.',
      'Informations de profil fournies par Clerk, comme le nom affiché ou la photo de profil.',
      'Données de progression liées aux ressources consultées ou terminées.',
      'Données techniques minimales pour comprendre l’usage du site et améliorer l’expérience.',
    ],
  },
  {
    title: 'Utilisation des données',
    items: [
      'Permettre la connexion et la sécurisation des comptes.',
      'Afficher les ressources, modules et contenus adaptés à l’étudiant.',
      'Améliorer Shazaxx grâce à des statistiques d’utilisation globales.',
      'Contacter les utilisateurs inscrits à la waitlist uniquement pour les informations importantes.',
    ],
  },
  {
    title: 'Services utilisés',
    items: [
      'Clerk pour l’authentification des utilisateurs.',
      'Firebase/Firestore pour certaines données applicatives.',
      'Vercel pour l’hébergement et les fonctions serveur.',
      'Formspree pour certains formulaires de contact.',
    ],
  },
  {
    title: 'À finaliser avant lancement',
    items: [
      'Ajouter les coordonnées légales du responsable du projet.',
      'Préciser la durée de conservation des données.',
      'Décrire la procédure de suppression de compte et des données personnelles.',
      'Faire relire cette page par une personne compétente avant lancement public.',
    ],
  },
];

export default function PrivacyPage() {
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
            <ShieldCheck size={28} />
          </div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-primary">Confidentialité</p>
          <h1 className="font-heading text-4xl font-black tracking-tight md:text-5xl">
            Politique de confidentialité
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-600">
            Cette page explique comment Shazaxx doit traiter les données des utilisateurs. Elle sert de base claire avant une version juridique finale.
          </p>

          <div className="mt-10 grid gap-5">
            {privacySections.map((section) => (
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
