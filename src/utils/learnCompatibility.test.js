import assert from 'node:assert/strict';
import test from 'node:test';
import { getResourceLinkMode, isResourceLinkedToModule } from './learnCompatibility.js';

const fst = { id: 'fst-analyse-1', name: 'Analyse 1', institutionId: 'fst', programId: 'mip', programYearId: 'year1', semesterId: 's1' };
const ensa = { ...fst, id: 'ensa-analyse-1', institutionId: 'ensa' };

test('same module name does not share resources between institutions', () => {
  const resource = { module: 'Analyse 1', moduleIds: [fst.id], institutionId: 'fst' };
  assert.equal(isResourceLinkedToModule(resource, fst), true);
  assert.equal(isResourceLinkedToModule(resource, ensa), false);
});

test('explicit module links never fall back to names in the same academic scope', () => {
  const resource = { ...fst, module: 'Analyse 1', moduleIds: ['another-module'] };
  assert.equal(isResourceLinkedToModule(resource, fst), false);
  assert.equal(isResourceLinkedToModule({ ...resource, moduleIds: [], moduleId: 'another-module' }, fst), false);
});

test('conflicting academic destinations override matching identifiers', () => {
  const resource = { moduleIds: [fst.id], institutionId: 'ensa' };
  assert.equal(isResourceLinkedToModule(resource, fst), false);
  assert.equal(getResourceLinkMode(resource, fst), 'none');
  assert.equal(isResourceLinkedToModule({ moduleIds: [fst.id] }, fst, { institution: { id: 'ensa' } }), false);
  assert.equal(isResourceLinkedToModule({ moduleIds: [fst.id], institutionId: 'fst' }, fst, { institution: { id: 'ensa' } }), false);
});

test('legacy resources need a complete matching destination', () => {
  assert.equal(isResourceLinkedToModule({ module: 'Analyse 1' }, fst, { institution: { name: 'FST Settat' } }), false);
  assert.equal(isResourceLinkedToModule({ ...fst, module: 'Analyse 1' }, fst), true);
  assert.equal(isResourceLinkedToModule({ ...fst, module: 'Analyse 1' }, ensa), false);
});
