# Academic Architecture

This document describes the target academic structure for Shazax. It is a technical reference only; no Firestore migration is executed by this document.

## Hierarchy

The public learning hierarchy is:

```text
institution -> program -> program_year -> semester -> module -> resource
```

Example:

```text
FST Settat
-> Mathematiques et Science des Donnees - MSD
   -> 1ere annee
      -> S2
         -> Analyse 2
         -> Algebre 2
         -> Mecanique
         -> Thermodynamique
         -> Structure de la matiere
```

## Collections

The planned Firestore collections are top-level collections:

```text
institutions
programs
program_years
semesters
modules
resources
```

Top-level collections keep the admin UI simpler, make server APIs easier to secure, and allow a resource to be linked to multiple modules.

## Relationships

Relationships must use stable Firestore document IDs, not names.

```js
program.institutionId -> institutions/{institutionId}
programYear.programId -> programs/{programId}
semester.programYearId -> program_years/{programYearId}
module.semesterId -> semesters/{semesterId}
resource.moduleIds[] -> modules/{moduleId}
```

Names can change. IDs must remain stable.

## Slugs

Slugs are for public URLs and should not be used as relationship keys.

Rules:

- lowercase ASCII letters and digits;
- single hyphens between words;
- no leading, trailing, or repeated hyphens;
- unique inside their scope.

Suggested scopes:

- institution slug: globally unique;
- program slug: unique per institution;
- program year slug: unique per program;
- semester slug: unique per program year;
- module slug: unique per semester.

If a public slug changes later, a redirect or alias table should preserve old URLs.

## Statuses

Allowed statuses:

```text
draft
review
published
archived
```

Public read flows should generally show only `published` documents with `isDeleted !== true`.

## Resource Categories

Allowed resource categories:

```js
[
  { id: 'course', label: 'Cours', disabled: false },
  { id: 'td', label: 'TD', disabled: false },
  { id: 'tp', label: 'TP', disabled: false },
  { id: 'exam', label: 'Examens', disabled: false },
  { id: 'qcm', label: 'QCM', disabled: true, badge: 'Coming soon' },
  { id: 'uncategorized', label: 'Non classé', disabled: false, adminOnly: true },
]
```

`qcm` is visible in Learn but disabled until the QCM product is implemented.

`uncategorized` is for migrated resources that need manual correction in the admin.

## Required Fields

### institutions

```js
{
  name: 'FST Settat',
  shortName: 'FST Settat',
  slug: 'fst-settat',
  city: 'Settat',
  type: 'faculty',
  status: 'published',
  order: 1,
  isDeleted: false,
  createdAt: 'server timestamp',
  updatedAt: 'server timestamp',
  createdBy: 'clerk_user_id',
  updatedBy: 'clerk_user_id',
}
```

### programs

```js
{
  institutionId: 'institution_id',
  name: 'Mathematiques et Science des Donnees',
  shortName: 'MSD',
  slug: 'mathematiques-science-donnees',
  status: 'published',
  order: 1,
  isDeleted: false,
  createdAt: 'server timestamp',
  updatedAt: 'server timestamp',
  createdBy: 'clerk_user_id',
  updatedBy: 'clerk_user_id',
}
```

### program_years

`program_years` means the curriculum year inside a program: 1ere annee, 2eme annee, 3eme annee. It does not mean an academic calendar year such as 2026-2027.

```js
{
  institutionId: 'institution_id',
  programId: 'program_id',
  name: '1ere annee',
  slug: '1ere-annee',
  yearNumber: 1,
  status: 'published',
  order: 1,
  isDeleted: false,
  createdAt: 'server timestamp',
  updatedAt: 'server timestamp',
  createdBy: 'clerk_user_id',
  updatedBy: 'clerk_user_id',
}
```

A future academic calendar collection can be added later, for example `academic_terms` or `calendar_years`, to represent 2026-2027 independently from the curriculum year.

### semesters

```js
{
  institutionId: 'institution_id',
  programId: 'program_id',
  programYearId: 'program_year_id',
  name: 'S2',
  slug: 's2',
  semesterNumber: 2,
  status: 'published',
  order: 2,
  isDeleted: false,
  createdAt: 'server timestamp',
  updatedAt: 'server timestamp',
  createdBy: 'clerk_user_id',
  updatedBy: 'clerk_user_id',
}
```

### modules

```js
{
  institutionId: 'institution_id',
  programId: 'program_id',
  programYearId: 'program_year_id',
  semesterId: 'semester_id',
  name: 'Analyse 2',
  slug: 'analyse-2',
  status: 'published',
  order: 1,
  isDeleted: false,
  createdAt: 'server timestamp',
  updatedAt: 'server timestamp',
  createdBy: 'clerk_user_id',
  updatedBy: 'clerk_user_id',
}
```

### resources

Resources can be shared by multiple modules.

```js
{
  title: 'Cours de Python',
  category: 'course',
  moduleIds: ['module_1', 'module_2'],
  fileName: 'python.pdf',
  fileUrl: 'https://example.com/python.pdf',
  correctionTitle: '',
  correctionUrl: '',
  status: 'published',
  isDeleted: false,
  migrationVersion: 1,
  legacy: {
    module: 'Analysis 2',
    category: 'Courses',
  },
  createdAt: 'server timestamp',
  updatedAt: 'server timestamp',
  createdBy: 'clerk_user_id',
  updatedBy: 'clerk_user_id',
}
```

## Soft Delete

No academic document should be destructively deleted by default.

Use:

```js
{
  isDeleted: true,
  deletedAt: 'server timestamp',
  deletedBy: 'clerk_user_id'
}
```

Public queries must ignore `isDeleted: true`.

## Future Migration Strategy

The first migration should:

- run in dry-run mode by default;
- create or reuse FST Settat;
- create or reuse MSD;
- create or reuse 1ere annee;
- create or reuse S2;
- create or reuse the five existing S2 modules;
- read existing `resources`;
- map legacy module names to new `moduleIds`;
- map legacy categories:
  - `Courses` -> `course`;
  - `TD` -> `td`;
  - `Exams` -> `exam`;
  - `TP` -> `tp`;
  - `Resources` -> `uncategorized`;
- preserve legacy `module` and `category`;
- add `migrationVersion`;
- generate a report for unrecognized modules and `uncategorized` resources;
- never delete existing fields automatically;
- be idempotent if run more than once.

Manual correction should be available later in the admin for resources that could not be attached confidently.

## Expected Firestore Indexes

The read service may require composite indexes for:

```text
programs: institutionId ASC, status ASC, order ASC
program_years: programId ASC, status ASC, order ASC
semesters: programYearId ASC, status ASC, order ASC
modules: semesterId ASC, status ASC, order ASC
```

If the public resources query later filters by `moduleIds` and `category`, it may require:

```text
resources: moduleIds ARRAY_CONTAINS, category ASC, status ASC, order ASC
```

The exact indexes should be finalized when the new Learn page and server APIs are implemented.
