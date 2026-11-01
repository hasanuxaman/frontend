import { useCallback, useEffect, useRef, useState } from "react";

// Tiny data-loading hook: { data, loading, error, reload }.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState((s) => ({ data: s.data, loading: false, error: e.message }));
    }
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, deps);
  return { ...state, reload: load };
}

export function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
