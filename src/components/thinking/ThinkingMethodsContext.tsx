"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createCustomMethod,
  getMethodById,
  getRuntimeMethods,
  loadStoredMethods,
  removeStoredMethod,
  resetMethodLibrary,
  saveStoredMethods,
  upsertStoredMethod,
} from "@/lib/thinking/method-store";
import type {
  StoredThinkingMethod,
  ThinkingMethodDef,
} from "@/lib/thinking/methods";

type ThinkingMethodsContextValue = {
  methods: ThinkingMethodDef[];
  stored: StoredThinkingMethod[];
  getMethod: (id: string) => ThinkingMethodDef;
  updateMethod: (method: StoredThinkingMethod) => void;
  addMethod: (
    partial: Parameters<typeof createCustomMethod>[0]
  ) => StoredThinkingMethod;
  deleteMethod: (id: string) => void;
  resetDefaults: () => void;
  refresh: () => void;
};

const ThinkingMethodsContext =
  createContext<ThinkingMethodsContextValue | null>(null);

export function ThinkingMethodsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredThinkingMethod[]>(() =>
    loadStoredMethods()
  );

  const methods = useMemo(() => getRuntimeMethods(stored), [stored]);

  const refresh = useCallback(() => {
    setStored(loadStoredMethods());
  }, []);

  const getMethod = useCallback(
    (id: string) => getMethodById(id, stored),
    [stored]
  );

  const updateMethod = useCallback((method: StoredThinkingMethod) => {
    setStored(upsertStoredMethod(method));
  }, []);

  const addMethod = useCallback(
    (partial: Parameters<typeof createCustomMethod>[0]) => {
      const created = createCustomMethod(partial);
      setStored(upsertStoredMethod(created));
      return created;
    },
    []
  );

  const deleteMethod = useCallback((id: string) => {
    setStored(removeStoredMethod(id));
  }, []);

  const resetDefaults = useCallback(() => {
    setStored(resetMethodLibrary());
  }, []);

  const value = useMemo(
    () => ({
      methods,
      stored,
      getMethod,
      updateMethod,
      addMethod,
      deleteMethod,
      resetDefaults,
      refresh,
    }),
    [methods, stored, getMethod, updateMethod, addMethod, deleteMethod, resetDefaults, refresh]
  );

  return (
    <ThinkingMethodsContext.Provider value={value}>
      {children}
    </ThinkingMethodsContext.Provider>
  );
}

export function useThinkingMethods() {
  const ctx = useContext(ThinkingMethodsContext);
  if (!ctx) {
    throw new Error("useThinkingMethods must be used within ThinkingMethodsProvider");
  }
  return ctx;
}
