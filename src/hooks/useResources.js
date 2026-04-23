import { useEffect, useState } from 'react';
import { sampleResources } from '../data/modules';

const STORAGE_KEY = 'resource-hub-items';

export function useResources() {
  const [resources, setResources] = useState(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return sampleResources;
    }

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse stored resources', error);
      return sampleResources;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
  }, [resources]);

  const addResource = (resource) => {
    setResources((current) => [resource, ...current]);
  };

  const removeResource = (resourceId) => {
    setResources((current) => current.filter((resource) => resource.id !== resourceId));
  };

  return {
    resources,
    addResource,
    removeResource,
  };
}
