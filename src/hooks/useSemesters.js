import { useCallback } from 'react';
import { getSemesters } from '../services/academicService';
import { useAcademicQuery } from './useAcademicQuery';

export function useSemesters(programYearId) {
  const fetcher = useCallback(() => getSemesters(programYearId), [programYearId]);

  return useAcademicQuery(fetcher, [programYearId], {
    enabled: Boolean(programYearId),
  });
}
