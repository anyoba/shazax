import { useCallback } from 'react';
import { getProgramYears } from '../services/academicService';
import { useAcademicQuery } from './useAcademicQuery';

export function useProgramYears(programId) {
  const fetcher = useCallback(() => getProgramYears(programId), [programId]);

  return useAcademicQuery(fetcher, [programId], {
    enabled: Boolean(programId),
  });
}
