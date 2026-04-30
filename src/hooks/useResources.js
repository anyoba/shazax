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

export function useResources() {
  const [resources, setResources] = useState(sampleResources);

  useEffect(() => {
    const resourcesQuery = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      resourcesQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setResources(sampleResources);
          return;
        }

        setResources(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
      },
      (error) => {
        console.error('Failed to load resources', error);
        setResources(sampleResources);
      },
    );

    return unsubscribe;
  }, []);

  const addResource = async (resource) => {
    const id = resource.id || `resource-${Date.now()}`;
    await setDoc(doc(db, 'resources', id), {
      ...resource,
      id,
      createdAt: serverTimestamp(),
    });
  };

  const removeResource = async (resourceId) => {
    await deleteDoc(doc(db, 'resources', resourceId));
  };

  return {
    resources,
    addResource,
    removeResource,
  };
}
