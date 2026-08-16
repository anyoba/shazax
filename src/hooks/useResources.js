import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { sampleResources } from '../data/modules';
import { getFirestoreErrorMessage } from '../utils/firebaseErrors';

const RESOURCES_STORAGE_KEY = 'shazax_resources_cache';
const DEFAULT_RESOURCE_LIMIT = 200;
const RESOURCE_CACHE_TTL_MS = 2 * 60 * 1000;
let resourcesCache = null;
let resourcesCacheExpiresAt = 0;
let resourcesRequest = null;

function isVisibleResource(resource) {
  return (
    resource?.status !== 'draft' &&
    resource?.status !== 'archived' &&
    resource?.visibility !== 'private' &&
    resource?.isDeleted !== true
  );
}

function filterResources(resources, includeArchived) {
  if (includeArchived) return resources;
  return resources.filter(isVisibleResource);
}

function readLocalResources() {
  try {
    const saved = window.localStorage.getItem(RESOURCES_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveLocalResources(resources) {
  try {
    window.localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(resources));
  } catch {
    // Ignore localStorage failures.
  }
}

async function fetchResources(maxResults) {
  if (resourcesCache && resourcesCacheExpiresAt > Date.now()) {
    return resourcesCache;
  }

  if (resourcesRequest) return resourcesRequest;

  resourcesRequest = (async () => {
    const resourcesQuery = query(
      collection(db, 'resources'),
      orderBy('createdAt', 'desc'),
      limit(maxResults),
    );
    const snapshot = await getDocs(resourcesQuery);

    const nextResources = snapshot.empty
      ? readLocalResources() || sampleResources
      : snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));

    resourcesCache = nextResources;
    resourcesCacheExpiresAt = Date.now() + RESOURCE_CACHE_TTL_MS;
    saveLocalResources(nextResources);

    return nextResources;
  })().finally(() => {
    resourcesRequest = null;
  });

  return resourcesRequest;
}

export function useResources({
  enabled = true,
  includeArchived = false,
  maxResults = DEFAULT_RESOURCE_LIMIT,
} = {}) {
  const [resources, setResources] = useState(() =>
    filterResources(readLocalResources() || sampleResources, includeArchived),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadResources({ ignoreCache = false } = {}) {
    if (ignoreCache) {
      resourcesCache = null;
      resourcesCacheExpiresAt = 0;
      resourcesRequest = null;
    }

    setLoading(true);
    setError('');

    try {
      const nextResources = await fetchResources(maxResults);
      setResources(filterResources(nextResources, includeArchived));
    } catch (loadError) {
      const message = getFirestoreErrorMessage(loadError);
      console.error('Failed to load resources', message);
      setError(message);
      const cached = readLocalResources();
      setResources(filterResources(cached || sampleResources, includeArchived));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    async function guardedLoadResources() {
      setLoading(true);
      setError('');

      try {
        const nextResources = await fetchResources(maxResults);
        if (cancelled) return;
        setResources(filterResources(nextResources, includeArchived));
      } catch (loadError) {
        if (cancelled) return;
        const message = getFirestoreErrorMessage(loadError);
        console.error('Failed to load resources', message);
        setError(message);
        const cached = readLocalResources();
        setResources(filterResources(cached || sampleResources, includeArchived));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    guardedLoadResources();

    return () => {
      cancelled = true;
    };
  }, [enabled, includeArchived, maxResults]);

  const addResource = async (resource) => {
    const id = resource.id || `resource-${Date.now()}`;
    const nextResource = {
      ...resource,
      id,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'resources', id), nextResource);

    const cached = readLocalResources() || resources;
    const nextResources = [...cached, { ...resource, id, createdAt: new Date().toISOString() }];
    resourcesCache = nextResources;
    resourcesCacheExpiresAt = Date.now() + RESOURCE_CACHE_TTL_MS;
    saveLocalResources(nextResources);
    setResources(filterResources(nextResources, includeArchived));
  };

  const removeResource = async (resourceId) => {
    await setDoc(
      doc(db, 'resources', resourceId),
      {
        status: 'archived',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    const cached = readLocalResources() || resources;
    const nextResources = cached.map((resource) =>
      resource.id === resourceId ? { ...resource, status: 'archived' } : resource,
    );
    resourcesCache = nextResources;
    resourcesCacheExpiresAt = Date.now() + RESOURCE_CACHE_TTL_MS;
    saveLocalResources(nextResources);
    setResources(filterResources(nextResources, includeArchived));
  };

  return {
    resources,
    loading,
    error,
    addResource,
    removeResource,
    refetch: () => loadResources({ ignoreCache: true }),
  };
}
