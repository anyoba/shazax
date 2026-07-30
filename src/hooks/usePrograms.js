import { useCallback } from 'react';
import { getPrograms } from '../services/academicService';
import { useAcademicQuery } from './useAcademicQuery';

export function usePrograms(institutionId) {
  const fetcher = useCallback(() => getPrograms(institutionId), [institutionId]);

  return useAcademicQuery(fetcher, [institutionId], {
    enabled: Boolean(institutionId),
  });
}
