import { useCallback, useEffect, useRef, useState } from "react";

// Runs an async function and tracks loading / error / data. Call reload() to run it again.
export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const run = useRef(0);
  const load = useCallback(() => {
    const id = ++run.current;
    setState((s) => ({ ...s, loading: true, error: "" }));
    return fn()
      .then((data) => { if (id === run.current) setState({ data, error: "", loading: false }); })
      .catch((e) => { if (id === run.current) setState({ data: null, error: e.message, loading: false }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

export function useTitle(title) {
  useEffect(() => { document.title = title ? `${title} · DPathfinder AI` : "DPathfinder AI"; }, [title]);
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
