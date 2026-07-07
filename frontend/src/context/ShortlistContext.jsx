import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { pgKey } from "../utils/pg";

const STORAGE_KEY = "stayease_shortlist_v1";
const ShortlistContext = createContext(null);

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ShortlistProvider({ children }) {
  const [items, setItems] = useState(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or unavailable — shortlist stays in-memory only */
    }
  }, [items]);

  const savedKeys = useMemo(() => new Set(items.map(pgKey)), [items]);

  const isSaved = useCallback((pg) => savedKeys.has(pgKey(pg)), [savedKeys]);

  const toggle = useCallback((pg) => {
    const key = pgKey(pg);
    setItems((prev) =>
      prev.some((p) => pgKey(p) === key) ? prev.filter((p) => pgKey(p) !== key) : [...prev, pg]
    );
  }, []);

  const remove = useCallback((pg) => {
    const key = pgKey(pg);
    setItems((prev) => prev.filter((p) => pgKey(p) !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, count: items.length, isSaved, toggle, remove, clear }),
    [items, isSaved, toggle, remove, clear]
  );

  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>;
}

export function useShortlist() {
  const ctx = useContext(ShortlistContext);
  if (!ctx) throw new Error("useShortlist must be used within a ShortlistProvider");
  return ctx;
}
