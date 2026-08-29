"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppData } from "./types";
import { makeSeedData } from "./seed";
import { getContent, saveContent, ApiError } from "./api";

type Ctx = {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  ready: boolean;
  saving: boolean;
  saveError: string | null;
  refresh: () => Promise<void>;
};

const DataCtx = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Local fallback so pages never crash on the very first paint before the
  // network response arrives (server + client render the same seed shape).
  const [data, setData] = useState<AppData>(() => makeSeedData());
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const skipNextSave = useRef(true); // don't PUT right after the initial GET
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const fresh = await getContent();
      skipNextSave.current = true;
      setData(fresh);
    } catch (e) {
      console.error("Could not load site content from the API", e);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Persist every change to the backend (debounced so rapid edits — e.g.
  // dragging a slot, typing a name — collapse into one request). Requires
  // an authenticated admin session; on the public site nothing ever calls
  // setData, so this simply never fires there.
  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      setSaveError(null);
      try {
        await saveContent(data);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Could not save changes.";
        setSaveError(msg);
        console.error("Could not save site content", e);
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ready]);

  return (
    <DataCtx.Provider value={{ data, setData, ready, saving, saveError, refresh: load }}>{children}</DataCtx.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error("useAppData must be used inside <DataProvider>");
  return ctx;
}
