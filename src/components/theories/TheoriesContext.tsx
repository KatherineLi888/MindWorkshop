"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { promoteTheoryToModel as doPromote } from "@/lib/theories/promote";
import {
  addTheory as storeAdd,
  loadTheories,
  removeTheory,
  upsertTheory,
} from "@/lib/theories/theory-store";
import { createStoredTheory } from "@/lib/theories/helpers";
import type { StoredModel } from "@/lib/models/types";
import type { StoredTheory } from "@/lib/theories/types";

type TheoriesContextValue = {
  theories: StoredTheory[];
  getTheory: (id: string) => StoredTheory | undefined;
  saveTheory: (theory: StoredTheory) => void;
  addTheory: (partial: Parameters<typeof createStoredTheory>[0]) => StoredTheory;
  deleteTheory: (id: string) => void;
  promoteToModel: (theory: StoredTheory) => { model: StoredModel; theory: StoredTheory };
  refresh: () => void;
};

const TheoriesContext = createContext<TheoriesContextValue | null>(null);

export function TheoriesProvider({ children }: { children: ReactNode }) {
  const [theories, setTheories] = useState<StoredTheory[]>(() => loadTheories());

  const refresh = useCallback(() => {
    setTheories(loadTheories());
  }, []);

  const getTheory = useCallback(
    (id: string) => theories.find((t) => t.id === id),
    [theories]
  );

  const saveTheory = useCallback((theory: StoredTheory) => {
    setTheories(upsertTheory(theory));
  }, []);

  const addTheory = useCallback(
    (partial: Parameters<typeof createStoredTheory>[0]) => {
      const created = storeAdd(partial);
      setTheories(loadTheories());
      return created;
    },
    []
  );

  const deleteTheory = useCallback((id: string) => {
    setTheories(removeTheory(id));
  }, []);

  const promoteToModel = useCallback((theory: StoredTheory) => {
    const result = doPromote(theory);
    setTheories(loadTheories());
    return result;
  }, []);

  const value = useMemo(
    () => ({
      theories,
      getTheory,
      saveTheory,
      addTheory,
      deleteTheory,
      promoteToModel,
      refresh,
    }),
    [
      theories,
      getTheory,
      saveTheory,
      addTheory,
      deleteTheory,
      promoteToModel,
      refresh,
    ]
  );

  return (
    <TheoriesContext.Provider value={value}>{children}</TheoriesContext.Provider>
  );
}

export function useTheories() {
  const ctx = useContext(TheoriesContext);
  if (!ctx) {
    throw new Error("useTheories must be used within TheoriesProvider");
  }
  return ctx;
}
