import { useEffect, useRef } from 'react';

export function useApiCacheSync<T>(endpoint: string, apply: (data: T) => void) {
  const applyRef = useRef(apply);
  applyRef.current = apply;
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.endpoint === endpoint && detail.data !== undefined) {
        applyRef.current(detail.data as T);
      }
    };
    window.addEventListener('academy-api-cache', handler);
    return () => window.removeEventListener('academy-api-cache', handler);
  }, [endpoint]);
}
