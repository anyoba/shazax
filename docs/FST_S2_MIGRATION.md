# FST S2 Migration

## Objectif

Preparer la structure academique initiale pour FST Settat, filiere Mathématiques et Science des Données, 1ère année, semestre S2, puis rattacher les ressources legacy existantes aux nouveaux modules avec `moduleIds`.

Cette migration ne doit jamais supprimer de donnees et ne doit jamais changer les IDs des ressources existantes.

## Hierarchie Cible

FST Settat
-> Mathématiques et Science des Données
-> 1ère année
-> S2
-> Analyse 2, Algèbre 2, Mécanique, Thermodynamique, Structure de la matière

Collections Firestore ciblees :

- `institutions`
- `programs`
- `program_years`
- `semesters`
- `modules`
- `resources`

## Mappings Modules

- `Analysis 2`, `Analyse 2`, `Analyse II` -> `Analyse 2`
- `Algebra 2`, `Algèbre 2`, `Algebra II` -> `Algèbre 2`
- `Mechanics`, `Mécanique`, `Mecanique` -> `Mécanique`
- `Thermodynamics`, `Thermodynamique` -> `Thermodynamique`
- `Structure of Matter`, `Structure de la matière`, `Structure de matière` -> `Structure de la matière`

Les titres visibles des ressources ne sont pas modifies automatiquement.

## Mappings Categories

- `Courses`, `Course`, `Cours`, `course` -> `course`
- `TD`, `td` -> `td`
- `TP`, `tp` -> `tp`
- `Exams`, `Exam`, `Examens`, `examen`, `exam` -> `exam`
- `Resources`, `Resource`, `Ressources` -> `uncategorized`
- `QCM`, `qcm` -> `qcm`

Les categories inconnues restent non reconnues dans le rapport.

## Commande Dry-Run

Commande par defaut :

```bash
node scripts/academic/migrateFstS2Resources.js --dry-run
```

`--dry-run` ne fait aucune ecriture Firestore. Il lit les collections, prepare les entites manquantes, analyse les ressources et ecrit un rapport local dans `migration-reports/`.

## Commande Apply

Ne jamais executer `--apply` sans examiner le rapport dry-run.

Le script refuse `--apply` sans variable explicite :

```bash
SHAZAX_CONFIRM_FST_S2_APPLY=yes node scripts/academic/migrateFstS2Resources.js --apply
```

Sur PowerShell :

```powershell
$env:SHAZAX_CONFIRM_FST_S2_APPLY='yes'; node scripts/academic/migrateFstS2Resources.js --apply
```

## Variables Serveur

Le script utilise Firebase Admin SDK et exige :

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Ne jamais utiliser les variables frontend `VITE_` comme credentials serveur.

## Rapport

Le rapport JSON contient :

- le mode (`dry-run` ou `apply`);
- la version de migration;
- les entites existantes ou a creer;
- les ressources reconnues;
- les ressources non reconnues;
- les mises a jour prevues;
- les erreurs eventuelles.

Points a verifier avant apply :

- `entities.institution.id` correspond au bon etablissement;
- les cinq modules sont presents ou `wouldCreate: true`;
- `resources.unrecognizedModule` est faible ou nul;
- `resources.unrecognizedCategory` est compris et acceptable;
- les ressources `uncategorized` doivent etre corrigees manuellement ensuite;
- aucun ID de ressource n est remplace.

## Sauvegarde Recommandee

Avant `--apply`, exporter ou sauvegarder les collections :

- `institutions`
- `programs`
- `program_years`
- `semesters`
- `modules`
- `resources`

## Rollback

La migration ne supprime rien. En cas de rollback :

- retirer `moduleIds` ajoutes aux ressources concernees;
- retirer ou archiver les entites academiques creees par le script;
- conserver les champs legacy `module` et `category`, qui restent disponibles pour compatibilite.

## Validation Apres Migration

Apres un futur apply :

- verifier que FST Settat existe et est `published`;
- verifier que MSD existe sous FST Settat;
- verifier que `1ère année` et `S2` existent;
- verifier les cinq modules;
- verifier quelques ressources legacy et leurs `moduleIds`;
- verifier que les ressources avec `Resources` sont marquees `uncategorized`;
- verifier que `/learn` legacy fonctionne toujours tant que la nouvelle page n est pas activee.
