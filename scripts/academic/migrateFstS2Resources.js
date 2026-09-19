import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ACADEMIC_MIGRATION_VERSION,
  CATEGORY_MAPPINGS,
  TARGET_MODULES,
  TARGET_STRUCTURE,
} from './fstS2MigrationConfig.js';

const COLLECTIONS = {
  institutions: 'institutions',
  programs: 'programs',
  programYears: 'program_years',
  semesters: 'semesters',
  modules: 'modules',
  resources: 'resources',
};

const APPLY_CONFIRM_ENV = 'SHAZAX_CONFIRM_FST_S2_APPLY';
const FIREBASE_ENV_NAMES = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];
let firebaseAdminModules = null;

function normalizePrivateKey(value) {
  return value
    ?.trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');
}

function validateFirebaseEnvironment() {
  const missing = FIREBASE_ENV_NAMES.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing Firebase Admin environment variable(s): ${missing.join(', ')}`);
  }

  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  if (
    !privateKey ||
    !privateKey.includes('-----BEGIN PRIVATE KEY-----') ||
    !privateKey.includes('-----END PRIVATE KEY-----')
  ) {
    throw new Error('FIREBASE_PRIVATE_KEY format is invalid.');
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  };
}

async function importFirebaseAdminModules() {
  if (firebaseAdminModules) return firebaseAdminModules;

  try {
    const [appModule, firestoreModule] = await Promise.all([
      import('firebase-admin/app'),
      import('firebase-admin/firestore'),
    ]);
    firebaseAdminModules = { appModule, firestoreModule };
    return firebaseAdminModules;
  } catch {
    const [appModule, firestoreModule] = await Promise.all([
      import('../../node_modules/firebase-admin/lib/esm/app/index.js'),
      import('../../node_modules/firebase-admin/lib/esm/firestore/index.js'),
    ]);
    firebaseAdminModules = { appModule, firestoreModule };
    return firebaseAdminModules;
  }
}

async function getScriptFirebaseAdmin() {
  const firebaseConfig = validateFirebaseEnvironment();
  const { appModule, firestoreModule } = await importFirebaseAdminModules();
  const app =
    appModule.getApps().length > 0
      ? appModule.getApp()
      : appModule.initializeApp({
          credential: appModule.cert(firebaseConfig),
        });

  return {
    db: firestoreModule.getFirestore(app),
    FieldValue: firestoreModule.FieldValue,
  };
}

function normalizeForMatch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const allowed = new Set(['--dry-run', '--apply']);
  const unknown = args.filter((arg) => !allowed.has(arg));

  if (unknown.length > 0) {
    throw new Error(`Unknown option(s): ${unknown.join(', ')}`);
  }

  if (args.includes('--dry-run') && args.includes('--apply')) {
    throw new Error('Use either --dry-run or --apply, not both.');
  }

  return {
    mode: args.includes('--apply') ? 'apply' : 'dry-run',
  };
}

function createMatcher(items, aliasesKey, valueKey) {
  const matcher = new Map();

  items.forEach((item) => {
    item[aliasesKey].forEach((alias) => {
      matcher.set(normalizeForMatch(alias), item[valueKey]);
    });
  });

  return matcher;
}

const moduleMatcher = createMatcher(TARGET_MODULES, 'aliases', 'slug');
const categoryMatcher = createMatcher(CATEGORY_MAPPINGS, 'aliases', 'category');
const moduleBySlug = new Map(TARGET_MODULES.map((moduleItem) => [moduleItem.slug, moduleItem]));

function serializeDoc(doc) {
  return {
    id: doc.id,
    ...doc.data(),
  };
}

async function readCollection(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map(serializeDoc);
}

function findBySlug(items, slug, parentFilters = {}) {
  return items.find((item) => {
    if (item.slug !== slug) return false;
    if (item.isDeleted === true) return false;

    return Object.entries(parentFilters).every(([key, value]) => item[key] === value);
  });
}

function entityReport(existing, plannedId, plannedData) {
  return {
    exists: Boolean(existing),
    id: existing?.id || plannedId,
    slug: existing?.slug || plannedData.slug,
    wouldCreate: !existing,
    plannedData: existing ? null : plannedData,
  };
}

function mergeIds(existingIds, nextId) {
  const ids = Array.isArray(existingIds) ? existingIds : [];
  return [...new Set([...ids, nextId])];
}

function buildEntityPlan(data) {
  const institution = findBySlug(data.institutions, TARGET_STRUCTURE.institution.slug);
  const institutionId = institution?.id || TARGET_STRUCTURE.institution.plannedId;

  const program = findBySlug(data.programs, TARGET_STRUCTURE.program.slug, { institutionId });
  const programId = program?.id || TARGET_STRUCTURE.program.plannedId;

  const programYear = findBySlug(data.programYears, TARGET_STRUCTURE.programYear.slug, {
    institutionId,
    programId,
  });
  const programYearId = programYear?.id || TARGET_STRUCTURE.programYear.plannedId;

  const semester = findBySlug(data.semesters, TARGET_STRUCTURE.semester.slug, {
    institutionId,
    programId,
    programYearId,
  });
  const semesterId = semester?.id || TARGET_STRUCTURE.semester.plannedId;

  const modules = TARGET_MODULES.map((moduleConfig) => {
    const existing = findBySlug(data.modules, moduleConfig.slug, {
      institutionId,
      programId,
      programYearId,
      semesterId,
    });

    return {
      config: moduleConfig,
      existing,
      id: existing?.id || moduleConfig.plannedId,
      report: entityReport(existing, moduleConfig.plannedId, {
        institutionId,
        programId,
        programYearId,
        semesterId,
        name: moduleConfig.name,
        slug: moduleConfig.slug,
        status: 'published',
        order: moduleConfig.order,
        isDeleted: false,
      }),
    };
  });

  return {
    institution: {
      existing: institution,
      id: institutionId,
      report: entityReport(institution, TARGET_STRUCTURE.institution.plannedId, TARGET_STRUCTURE.institution),
    },
    program: {
      existing: program,
      id: programId,
      report: entityReport(program, TARGET_STRUCTURE.program.plannedId, {
        institutionId,
        ...TARGET_STRUCTURE.program,
      }),
    },
    programYear: {
      existing: programYear,
      id: programYearId,
      report: entityReport(programYear, TARGET_STRUCTURE.programYear.plannedId, {
        institutionId,
        programId,
        ...TARGET_STRUCTURE.programYear,
      }),
    },
    semester: {
      existing: semester,
      id: semesterId,
      report: entityReport(semester, TARGET_STRUCTURE.semester.plannedId, {
        institutionId,
        programId,
        programYearId,
        ...TARGET_STRUCTURE.semester,
      }),
    },
    modules,
  };
}

function analyzeResource(resource, entityPlan) {
  const legacyModule = resource.legacy?.module || resource.module || '';
  const legacyCategory = resource.legacy?.category || resource.category || '';
  const moduleSlug = moduleMatcher.get(normalizeForMatch(legacyModule)) || null;
  const normalizedCategory = categoryMatcher.get(normalizeForMatch(legacyCategory)) || null;
  const targetModule = moduleSlug ? moduleBySlug.get(moduleSlug) : null;
  const modulePlan = targetModule
    ? entityPlan.modules.find((item) => item.config.slug === targetModule.slug)
    : null;
  const futureModuleId = modulePlan?.id || null;
  const alreadyHasModuleId = Boolean(futureModuleId && resource.moduleIds?.includes(futureModuleId));
  const alreadyMigrated =
    resource.migrationVersion >= ACADEMIC_MIGRATION_VERSION &&
    alreadyHasModuleId &&
    (!normalizedCategory || resource.category === normalizedCategory);

  let action = 'skipped';
  let reason = 'Already migrated or no change needed.';
  let proposedUpdate = null;

  if (!moduleSlug) {
    reason = 'Legacy module was not recognized.';
  } else if (!normalizedCategory) {
    reason = 'Legacy category was not recognized.';
  } else if (!futureModuleId) {
    reason = 'Target module id is not available.';
  } else if (!alreadyMigrated) {
    action = 'would-update';
    reason = 'Resource can be linked to the new academic module.';
    proposedUpdate = {
      moduleIds: mergeIds(resource.moduleIds, futureModuleId),
      category: normalizedCategory,
      migrationVersion: ACADEMIC_MIGRATION_VERSION,
      legacy: {
        module: legacyModule,
        category: legacyCategory,
      },
      updatedAt: 'serverTimestamp',
      updatedBy: 'migration-script',
    };
  }

  return {
    resourceId: resource.id,
    title: resource.title || '',
    legacyModule,
    legacyCategory,
    recognizedModule: targetModule?.name || null,
    recognizedCategory: normalizedCategory,
    futureModuleId,
    alreadyMigrated,
    action,
    reason,
    proposedUpdate,
  };
}

function buildReport(mode, startedAt, data, entityPlan) {
  const resourceReports = data.resources.map((resource) => analyzeResource(resource, entityPlan));
  const recognizedResources = resourceReports.filter(
    (item) => item.recognizedModule && item.recognizedCategory,
  );
  const unrecognizedResources = resourceReports.filter(
    (item) => !item.recognizedModule || !item.recognizedCategory,
  );

  return {
    mode,
    migrationVersion: ACADEMIC_MIGRATION_VERSION,
    startedAt,
    completedAt: new Date().toISOString(),
    target: {
      institution: TARGET_STRUCTURE.institution.name,
      program: TARGET_STRUCTURE.program.name,
      programYear: TARGET_STRUCTURE.programYear.name,
      semester: TARGET_STRUCTURE.semester.name,
    },
    entities: {
      institution: entityPlan.institution.report,
      program: entityPlan.program.report,
      programYear: entityPlan.programYear.report,
      semester: entityPlan.semester.report,
      modules: entityPlan.modules.map((modulePlan) => modulePlan.report),
    },
    resources: {
      total: resourceReports.length,
      alreadyMigrated: resourceReports.filter((item) => item.alreadyMigrated).length,
      recognized: recognizedResources.length,
      unrecognizedModule: resourceReports.filter((item) => !item.recognizedModule).length,
      unrecognizedCategory: resourceReports.filter((item) => !item.recognizedCategory).length,
      uncategorized: resourceReports.filter((item) => item.recognizedCategory === 'uncategorized').length,
      wouldUpdate: resourceReports.filter((item) => item.action === 'would-update').length,
      skipped: resourceReports.filter((item) => item.action === 'skipped').length,
      errors: 0,
    },
    recognizedResources,
    unrecognizedResources,
    errors: [],
  };
}

function timestampForFile() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('-');
}

async function writeReport(report) {
  const reportsDir = join(process.cwd(), 'migration-reports');
  await mkdir(reportsDir, { recursive: true });

  const reportPath = join(
    reportsDir,
    `fst-s2-${report.mode}-${timestampForFile()}.json`,
  );
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  return reportPath;
}

function printSummary(report, reportPath) {
  console.log(`Mode: ${report.mode}`);
  console.log(`Migration version: ${report.migrationVersion}`);
  console.log(`Firebase project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log('');
  console.log('Entities:');
  console.log(`- Institution: ${report.entities.institution.exists ? 'exists' : 'would create'} (${report.entities.institution.id})`);
  console.log(`- Program: ${report.entities.program.exists ? 'exists' : 'would create'} (${report.entities.program.id})`);
  console.log(`- Program year: ${report.entities.programYear.exists ? 'exists' : 'would create'} (${report.entities.programYear.id})`);
  console.log(`- Semester: ${report.entities.semester.exists ? 'exists' : 'would create'} (${report.entities.semester.id})`);
  report.entities.modules.forEach((moduleItem) => {
    console.log(`- Module ${moduleItem.slug}: ${moduleItem.exists ? 'exists' : 'would create'} (${moduleItem.id})`);
  });
  console.log('');
  console.log('Resources:');
  console.log(`- Total: ${report.resources.total}`);
  console.log(`- Already migrated: ${report.resources.alreadyMigrated}`);
  console.log(`- Recognized: ${report.resources.recognized}`);
  console.log(`- Would update: ${report.resources.wouldUpdate}`);
  console.log(`- Uncategorized: ${report.resources.uncategorized}`);
  console.log(`- Unrecognized module: ${report.resources.unrecognizedModule}`);
  console.log(`- Unrecognized category: ${report.resources.unrecognizedCategory}`);
  console.log(`- Skipped: ${report.resources.skipped}`);
  console.log('');
  console.log(`Report written to: ${reportPath}`);
}

async function applyMigration(db, report) {
  if (process.env[APPLY_CONFIRM_ENV] !== 'yes') {
    throw new Error(`Refusing --apply. Set ${APPLY_CONFIRM_ENV}=yes after reviewing the dry-run report.`);
  }

  const { FieldValue } = await getScriptFirebaseAdmin();
  const now = FieldValue.serverTimestamp();
  const migrationUser = 'migration-script';
  const entities = report.entities;

  const createIfMissing = async (collectionName, entity, extraData = {}) => {
    if (entity.exists) return;

    await db.collection(collectionName).doc(entity.id).set({
      ...entity.plannedData,
      ...extraData,
      createdAt: now,
      updatedAt: now,
      createdBy: migrationUser,
      updatedBy: migrationUser,
    });
  };

  await createIfMissing(COLLECTIONS.institutions, entities.institution);
  await createIfMissing(COLLECTIONS.programs, entities.program);
  await createIfMissing(COLLECTIONS.programYears, entities.programYear);
  await createIfMissing(COLLECTIONS.semesters, entities.semester);

  for (const moduleEntity of entities.modules) {
    await createIfMissing(COLLECTIONS.modules, moduleEntity);
  }

  for (const resource of report.recognizedResources) {
    if (resource.action !== 'would-update' || !resource.proposedUpdate) continue;

    await db.collection(COLLECTIONS.resources).doc(resource.resourceId).update({
      ...resource.proposedUpdate,
      updatedAt: now,
    });
  }
}

async function main() {
  const { mode } = parseArgs(process.argv);
  const startedAt = new Date().toISOString();

  console.log(`Starting FST S2 academic migration in ${mode} mode.`);
  console.log('Checking Firebase Admin environment without printing secrets...');

  const { db } = await getScriptFirebaseAdmin();

  if (mode === 'apply') {
    console.log(`Apply guard required: ${APPLY_CONFIRM_ENV}=yes`);
  }

  const data = {
    institutions: await readCollection(db, COLLECTIONS.institutions),
    programs: await readCollection(db, COLLECTIONS.programs),
    programYears: await readCollection(db, COLLECTIONS.programYears),
    semesters: await readCollection(db, COLLECTIONS.semesters),
    modules: await readCollection(db, COLLECTIONS.modules),
    resources: await readCollection(db, COLLECTIONS.resources),
  };
  const entityPlan = buildEntityPlan(data);
  const report = buildReport(mode, startedAt, data, entityPlan);

  if (mode === 'apply') {
    await applyMigration(db, report);
  }

  const reportPath = await writeReport(report);
  printSummary(report, reportPath);

  if (mode === 'dry-run') {
    console.log('');
    console.log('Dry-run completed. No Firestore writes were performed.');
  }
}

main().catch((error) => {
  console.error('[FST_S2_MIGRATION_FAILED]', {
    name: error?.name,
    code: error?.code,
    message: error?.message,
  });
  process.exitCode = 1;
});
