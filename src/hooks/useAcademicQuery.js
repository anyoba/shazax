import { useCallback, useEffect, useState } from 'react';

export function useAcademicQuery(fetcher, dependencies, { enabled = true } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!enabled) {
        setData([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextData = await fetcher();
        if (!cancelled) {
          setData(nextData);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setData([]);
          setError(fetchError?.message || 'Unable to load data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [fetcher, ...dependencies, enabled, reloadKey]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
