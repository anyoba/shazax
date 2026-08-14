import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const lastUpdated = '14 aout 2026';
const contactUrl = 'https://www.instagram.com/med_shazaxx/';

const termsSections = [
  {
    title: 'Objet de Shazaxx',
    items: [
      'Shazaxx est une plateforme educative qui aide les etudiants a acceder a des ressources academiques organisees, notamment cours, TD, examens, corrections, modules et outils interactifs.',
      'La plateforme vise a faciliter apprentissage et revision; elle ne remplace pas les cours officiels, les enseignants, les etablissements ou les decisions administratives.',
      "L'utilisation de Shazaxx implique l'acceptation des presentes conditions d'utilisation.",
    ],
  },
  {
    title: 'Compte utilisateur et acces',
    items: [
      "Certaines fonctionnalites peuvent necessiter la creation d'un compte via Clerk.",
      "L'utilisateur doit fournir des informations exactes et garder ses identifiants confidentiels.",
      'Le compte est personnel. Il ne doit pas etre revendu, partage massivement, utilise pour contourner les regles ou acceder a des espaces non autorises.',
      "Shazaxx peut limiter, suspendre ou supprimer un acces en cas d'abus, fraude, tentative d'intrusion, non-respect des regles ou risque pour la plateforme.",
    ],
  },
  {
    title: 'Utilisation autorisee',
    items: [
      'Vous pouvez utiliser Shazaxx pour apprendre, reviser, suivre votre progression et consulter les ressources disponibles.',
      "Vous ne devez pas utiliser la plateforme pour publier, envoyer ou stocker du contenu illegal, violent, haineux, frauduleux, diffamatoire ou portant atteinte aux droits d'autrui.",
      "Vous ne devez pas tenter d'extraire massivement les donnees, perturber le service, contourner l'authentification, automatiser des actions abusives ou compromettre la securite du site.",
    ],
  },
  {
    title: 'Contenus educatifs',
    items: [
      'Les contenus sont fournis a titre pedagogique et peuvent evoluer, etre corriges, completes ou retires.',
      "Shazaxx fait des efforts pour organiser des ressources utiles, mais ne garantit pas l'absence totale d'erreurs, l'exhaustivite des contenus ou la reussite a un examen.",
      "L'utilisateur doit verifier les informations importantes aupres de sources officielles, enseignants ou etablissements concernes.",
      "Si vous reperez une erreur ou un contenu problematique, vous pouvez le signaler afin qu'il soit verifie.",
    ],
  },
  {
    title: 'Propriete intellectuelle',
    items: [
      "Le nom Shazaxx, l'interface, l'organisation de la plateforme, les textes crees pour le site, les composants et les elements visuels appartiennent a Shazaxx ou a leurs titulaires respectifs.",
      'Les documents externes, cours, examens ou ressources provenant de tiers restent la propriete de leurs auteurs, etablissements ou ayants droit.',
      "Aucune ressource ne doit etre copiee, revendue, redistribuee ou utilisee hors du cadre autorise si cela viole les droits d'auteur ou les regles de l'etablissement concerne.",
    ],
  },
  {
    title: 'Donnees personnelles',
    items: [
      "L'utilisation de Shazaxx peut impliquer le traitement de donnees personnelles necessaires au compte, a la waitlist, a la progression, a l'analytics et a la securite.",
      'La collecte et utilisation de ces donnees sont detaillees dans la Politique de confidentialite.',
      'En utilisant Shazaxx, vous acceptez que les prestataires techniques necessaires, notamment Clerk, Firebase/Firestore, Vercel et Formspree, puissent traiter certaines donnees pour fournir le service.',
    ],
  },
  {
    title: 'Disponibilite et modifications',
    items: [
      'Shazaxx peut etre modifie, ameliore, interrompu temporairement ou rendu indisponible pour maintenance, correction, securite ou evolution technique.',
      'Certaines fonctionnalites peuvent etre ajoutees, supprimees ou reservees a certains utilisateurs selon les besoins du projet.',
      'Shazaxx peut mettre a jour ces conditions. La date de mise a jour indique la version applicable.',
    ],
  },
  {
    title: 'Offres payantes',
    items: [
      'A la date de cette version, Shazaxx peut proposer une waitlist ou un acces gratuit selon les fonctionnalites disponibles.',
      'Si une offre premium, un abonnement ou un paiement est lance, les prix, conditions de paiement, renouvellement, remboursement et resiliation seront presentes clairement avant achat.',
      'Aucun paiement ne doit etre considere comme du sans information explicite affichee au moment de la souscription.',
    ],
  },
  {
    title: 'Limitation de responsabilite',
    items: [
      "Shazaxx est fourni avec un objectif pedagogique et d'organisation; l'utilisateur reste responsable de ses decisions academiques, administratives et personnelles.",
      'Shazaxx ne peut pas garantir une note, une admission, une reussite a un concours, une exactitude permanente des ressources ou une disponibilite continue du service.',
      'Dans la limite permise par la loi, Shazaxx ne pourra pas etre tenu responsable des pertes indirectes, erreurs de contenu, interruptions temporaires ou mauvaise utilisation de la plateforme.',
    ],
  },
  {
    title: 'Contact',
    items: [
      'Pour une question, un signalement, une demande liee au compte, aux contenus ou aux presentes conditions, contactez Shazaxx via med_shazaxx.',
      'Les demandes serieuses seront traitees dans un delai raisonnable selon leur urgence, leur complexite et les informations disponibles.',
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
          <h1 className="font-heading text-4xl font-black tracking-tight md:text-5xl">Conditions d'utilisation</h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-600">
            Ces conditions definissent les regles applicables a l'acces et a l'utilisation de Shazaxx.
          </p>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
            Derniere mise a jour: {lastUpdated}
          </div>

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

          <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-primary/15 bg-primary/5 p-5 text-sm font-medium leading-6 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/privacy" className="font-black text-primary hover:text-primary/80">
              Voir la Politique de confidentialite
            </Link>
            <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="font-black text-primary hover:text-primary/80">
              Contacter med_shazaxx
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
