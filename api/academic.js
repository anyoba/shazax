import { randomUUID } from 'node:crypto';
import {
  HttpError,
  sendError,
} from '../server/_lib/auth.js';
import { setMethodHeader } from '../server/_lib/request.js';
import {
  archiveInstitution,
  createInstitution,
  getInstitution,
  listInstitutions,
  updateInstitution,
} from '../server/_lib/academicInstitutionsHandlers.js';
import {
  handleAcademicEntityArchive,
  handleAcademicEntityCreate,
  handleAcademicEntityGetOne,
  handleAcademicEntityList,
  handleAcademicEntityPatch,
} from '../server/_lib/academicEntityHandlers.js';
import { getAcademicLearnTree } from '../server/_lib/academicLearnHandler.js';

const ENTITY_MAP = {
  institutions: 'institutions',
  programs: 'programs',
  'program-years': 'program_years',
  program_years: 'program_years',
  semesters: 'semesters',
  modules: 'modules',
};

function getRequestId(req) {
  const headerRequestId = req.headers['x-request-id'] || req.headers['x-vercel-id'];
  const requestId = Array.isArray(headerRequestId) ? headerRequestId[0] : headerRequestId;

  return requestId || randomUUID();
}

function getQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getEntity(req) {
  const entity = getQueryValue(req.query?.entity);
  if (!entity || !ENTITY_MAP[entity]) {
    throw new HttpError(400, 'Academic entity is invalid.', 'ACADEMIC_ENTITY_INVALID');
  }

  return ENTITY_MAP[entity];
}

async function handleInstitutionRequest(req, res, id, setStage) {
  if (req.method === 'GET' && id) return getInstitution(req, res, id);
  if (req.method === 'GET') return listInstitutions(req, res, setStage);
  if (req.method === 'POST') return createInstitution(req, res, setStage);
  if (!id) throw new HttpError(400, 'id is required.', 'ACADEMIC_ID_REQUIRED');
  if (req.method === 'PATCH') return updateInstitution(req, res, id);
  if (req.method === 'DELETE') return archiveInstitution(req, res, id);

  throw new HttpError(405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
}

async function handleGenericAcademicRequest(req, res, entityType, id) {
  if (req.method === 'GET' && id) return handleAcademicEntityGetOne(req, res, entityType, id);
  if (req.method === 'GET') return handleAcademicEntityList(req, res, entityType);
  if (req.method === 'POST') return handleAcademicEntityCreate(req, res, entityType);
  if (!id) throw new HttpError(400, 'id is required.', 'ACADEMIC_ID_REQUIRED');
  if (req.method === 'PATCH') return handleAcademicEntityPatch(req, res, entityType, id);
  if (req.method === 'DELETE') return handleAcademicEntityArchive(req, res, entityType, id);

  throw new HttpError(405, 'Method not allowed.', 'METHOD_NOT_ALLOWED');
}

export default async function handler(req, res) {
  setMethodHeader(res, ['GET', 'POST', 'PATCH', 'DELETE']);
  const requestId = getRequestId(req);
  let stage = 'ROUTE';
  const setStage = (nextStage) => {
    stage = nextStage;
  };

  try {
    if (req.method === 'GET' && getQueryValue(req.query?.view) === 'learn') {
      return await getAcademicLearnTree(req, res);
    }

    const entityType = getEntity(req);
    const id = getQueryValue(req.query?.id);

    if (entityType === 'institutions') {
      return await handleInstitutionRequest(req, res, id, setStage);
    }

    return await handleGenericAcademicRequest(req, res, entityType, id);
  } catch (error) {
    console.error('[ACADEMIC_API_FAILED]', {
      requestId,
      stage,
      method: req.method,
      entity: getQueryValue(req.query?.entity) || '',
      id: getQueryValue(req.query?.id) || '',
      name: error?.name,
      code: error?.code,
      message: error?.message,
    });
    return sendError(res, error, { requestId, stage: `ACADEMIC_${stage}` });
  }
}
