import { useCallback } from 'react';
import { getInstitutions } from '../services/academicService';
import { useAcademicQuery } from './useAcademicQuery';

export function useInstitutions() {
  const fetcher = useCallback(() => getInstitutions(), []);

  return useAcademicQuery(fetcher, []);
}
