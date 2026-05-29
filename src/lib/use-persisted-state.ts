import { useEffect, useState } from "react";

/**
 * Like useState, but persists the value to localStorage and rehydrates
 * on mount.
 *
 * The initial value is used for the very first render (matches the
 * server-rendered HTML, avoiding hydration mismatches). After mount,
 * a useEffect loads the stored value (if any) and replaces state.
 * Persistence pauses until that first load completes, so the seed
 * initial value doesn't overwrite an existing stored value.
 *
 * The optional `validator` guards against corrupted/hand-edited
 * localStorage data — if it returns false, we fall back to the
 * initial value.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  validator?: (val: unknown) => val is T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount. Runs only in the browser (useEffect
  // doesn't run during SSR), so window/localStorage are always available.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        const parsed: unknown = JSON.parse(stored);
        if (!validator || validator(parsed)) {
          setState(parsed as T);
        }
      }
    } catch {
      // localStorage unavailable or JSON parse failed — stay with initial.
    }
    setLoaded(true);
    // We intentionally do NOT include `validator` in deps; callers usually
    // pass a fresh function each render and we only want to load once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Save on changes — but skip the very first render so we don't overwrite
  // a real stored value with the initial-value placeholder before the load
  // useEffect above has run.
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // localStorage write failed (quota, private mode) — ignore.
    }
  }, [key, state, loaded]);

  return [state, setState];
}
