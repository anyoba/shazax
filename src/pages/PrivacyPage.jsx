import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const lastUpdated = '14 aout 2026';
const contactUrl = 'https://www.instagram.com/med_shazaxx/';

const privacySections = [
  {
    title: 'Responsable et contact',
    items: [
      "Shazaxx est responsable du traitement des donnees utilisees pour fournir la plateforme et ameliorer l'experience utilisateur.",
      "Pour toute question, demande d'acces, correction ou suppression de donnees, vous pouvez contacter Shazaxx via le compte Instagram med_shazaxx.",
      'Les demandes liees aux donnees personnelles sont traitees dans un delai raisonnable selon la complexite de la demande et les obligations applicables.',
    ],
  },
  {
    title: 'Donnees collectees',
    items: [
      'Donnees de compte: adresse email, nom affiche, photo de profil et identifiant utilisateur fournis via Clerk lorsque vous creez ou utilisez un compte.',
      "Donnees de waitlist: adresse email, date d'inscription et message technique envoye au formulaire lorsque vous demandez a etre informe du lancement ou des mises a jour.",
      "Donnees d'apprentissage: ressources consultees, modules, progression, elements termines et preferences necessaires au fonctionnement des fonctionnalites educatives.",
      "Donnees techniques et analytics: page visitee, session technique, referrer, navigateur, langue, taille d'ecran, horodatage et donnees agregees de trafic.",
      'Donnees stockees localement: certaines preferences, caches de ressources, progression locale ou parametres peuvent etre gardes dans le navigateur pour ameliorer la rapidite du site.',
    ],
  },
  {
    title: 'Utilisation des donnees',
    items: [
      'Creer, securiser et gerer les comptes utilisateurs.',
      'Donner acces aux cours, TD, examens, corrections, modules et outils interactifs.',
      "Memoriser la progression et rendre l'experience plus fluide entre les sessions.",
      'Gerer la waitlist et envoyer uniquement des informations importantes liees a Shazaxx.',
      "Comprendre l'usage global de la plateforme, corriger les problemes, ameliorer les performances et renforcer la securite.",
    ],
  },
  {
    title: 'Services tiers utilises',
    items: [
      "Clerk est utilise pour l'authentification, les sessions et la gestion des profils utilisateurs.",
      'Firebase/Firestore est utilise pour stocker certaines donnees applicatives comme la waitlist, les donnees academiques, les roles, la progression ou les statistiques internes.',
      "Vercel est utilise pour l'hebergement, les fonctions serveur et les statistiques web agregees.",
      'Formspree est utilise pour transmettre certains formulaires, notamment les inscriptions a la waitlist ou les messages associes.',
    ],
  },
  {
    title: 'Partage des donnees',
    items: [
      'Shazaxx ne vend pas les donnees personnelles des utilisateurs.',
      'Les donnees peuvent etre traitees par les prestataires techniques listes ci-dessus uniquement pour faire fonctionner, securiser, heberger ou ameliorer la plateforme.',
      "Certaines donnees peuvent etre communiquees si cela est necessaire pour respecter une obligation legale, proteger Shazaxx, prevenir une fraude ou repondre a une demande valide d'autorite competente.",
    ],
  },
  {
    title: 'Conservation',
    items: [
      'Les donnees de compte sont conservees tant que le compte est actif ou aussi longtemps que necessaire pour fournir le service.',
      "Les emails de waitlist sont conserves jusqu'au lancement, desinscription, demande de suppression ou tant qu'ils restent utiles pour informer l'utilisateur des mises a jour importantes.",
      'Les donnees analytics sont utilisees pour des statistiques et peuvent etre conservees sous forme agregee ou technique aussi longtemps que necessaire pour mesurer et ameliorer le service.',
      "Les donnees conservees dans votre navigateur restent sur votre appareil jusqu'a suppression du cache, des donnees du site ou desinstallation du navigateur.",
    ],
  },
  {
    title: 'Vos droits',
    items: [
      "Vous pouvez demander l'acces aux donnees personnelles associees a votre compte.",
      "Vous pouvez demander la correction d'informations inexactes.",
      'Vous pouvez demander la suppression de votre compte ou de certaines donnees, sous reserve des obligations legales ou de securite applicables.',
      'Vous pouvez supprimer les donnees locales depuis les parametres de votre navigateur.',
      "Vous pouvez cesser d'utiliser Shazaxx a tout moment si vous n'acceptez pas cette politique.",
    ],
  },
  {
    title: 'Securite et mineurs',
    items: [
      "Shazaxx utilise des services reconnus pour l'authentification, l'hebergement, le stockage et les formulaires afin de limiter les risques d'acces non autorise.",
      "Aucun systeme n'est parfaitement securise; les utilisateurs doivent proteger leurs identifiants et eviter de partager leur compte.",
      "Si un utilisateur est mineur, l'utilisation de Shazaxx doit se faire avec l'accord d'un parent, tuteur legal ou responsable educatif lorsque la loi l'exige.",
    ],
  },
  {
    title: 'Modifications',
    items: [
      'Cette politique peut etre mise a jour lorsque Shazaxx ajoute des fonctionnalites, change de prestataire ou doit repondre a de nouvelles obligations.',
      'La date de mise a jour affichee en haut de cette page indique la version actuellement publiee.',
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
          <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-primary">Confidentialite</p>
          <h1 className="font-heading text-4xl font-black tracking-tight md:text-5xl">Politique de confidentialite</h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-600">
            Cette politique explique comment Shazaxx collecte, utilise, conserve et protege les donnees necessaires au fonctionnement de la plateforme.
          </p>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
            Derniere mise a jour: {lastUpdated}
          </div>

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

          <div className="mt-8 rounded-3xl border border-primary/15 bg-primary/5 p-5 text-sm font-medium leading-6 text-slate-600">
            Contact confidentialite:{' '}
            <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="font-black text-primary hover:text-primary/80">
              med_shazaxx
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
