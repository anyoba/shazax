import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { sampleResources } from '../data/modules';

const RESOURCES_STORAGE_KEY = 'shazax_resources_cache';

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

export function useResources() {
  const [resources, setResources] = useState(() => readLocalResources() || sampleResources);

  useEffect(() => {
    const resourcesQuery = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      resourcesQuery,
      (snapshot) => {
        if (snapshot.empty) {
          const cached = readLocalResources();
          setResources(cached || sampleResources);
          return;
        }

        const nextResources = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        setResources(nextResources);
        saveLocalResources(nextResources);
      },
      (error) => {
        console.error('Failed to load resources', error);
        const cached = readLocalResources();
        setResources(cached || sampleResources);
      },
    );

    return unsubscribe;
  }, []);

  const addResource = async (resource) => {
    const id = resource.id || `resource-${Date.now()}`;
    const nextResource = {
      ...resource,
      id,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'resources', id), nextResource);

    const cached = readLocalResources() || resources;
    saveLocalResources([...cached, { ...resource, id, createdAt: new Date().toISOString() }]);
  };

  const removeResource = async (resourceId) => {
    await deleteDoc(doc(db, 'resources', resourceId));

    const cached = readLocalResources() || resources;
    saveLocalResources(cached.filter((resource) => resource.id !== resourceId));
  };

  return {
    resources,
    addResource,
    removeResource,
  };
}
