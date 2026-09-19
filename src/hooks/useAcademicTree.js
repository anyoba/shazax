import { useCallback, useEffect, useState } from 'react';
import { getAcademicTree } from '../services/academicService';

export function useAcademicTree() {
  const [data, setData] = useState({
    institutions: [],
    programs: [],
    programYears: [],
    semesters: [],
    modules: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTree() {
      setLoading(true);
      setError(null);

      try {
        const tree = await getAcademicTree({ force: reloadKey > 0 });
        if (!cancelled) setData(tree);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Impossible de charger les contenus academiques.');
          setData({
            institutions: [],
            programs: [],
            programYears: [],
            semesters: [],
            modules: [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTree();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
