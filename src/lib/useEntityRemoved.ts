import { useEffect, useRef } from 'react';

export function useEntityRemoved(apply: (ids: string[]) => void) {
  const applyRef = useRef(apply);
  applyRef.current = apply;
  useEffect(() => {
    const handler = (e: Event) => {
      const ids = (e as CustomEvent).detail?.ids;
      if (Array.isArray(ids) && ids.length) applyRef.current(ids);
    };
    window.addEventListener('academy-entity-removed', handler);
    return () => window.removeEventListener('academy-entity-removed', handler);
  }, []);
}
