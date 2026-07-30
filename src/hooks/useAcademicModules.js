import { useCallback } from 'react';
import { getAcademicModules } from '../services/academicService';
import { useAcademicQuery } from './useAcademicQuery';

export function useAcademicModules(semesterId) {
  const fetcher = useCallback(() => getAcademicModules(semesterId), [semesterId]);

  return useAcademicQuery(fetcher, [semesterId], {
    enabled: Boolean(semesterId),
  });
}
