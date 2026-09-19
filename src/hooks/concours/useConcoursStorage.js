import { useCallback, useEffect, useState } from 'react';

export function useConcoursStorage(reader) {
  const [value, setValue] = useState(() => reader());

  const refresh = useCallback(() => {
    setValue(reader());
  }, [reader]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return [value, refresh];
}
