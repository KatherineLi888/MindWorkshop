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
  countApplicationsForModel,
  createApplication,
  loadApplications,
  removeApplication,
  upsertApplication,
} from "@/lib/models/application-store";
import {
  getModelById,
  loadModelLibrary,
  removeModel,
  resetModelLibrary,
  upsertModel,
} from "@/lib/models/model-library-store";
import { createStoredModel } from "@/lib/models/helpers";
import type { ModelApplication, StoredModel } from "@/lib/models/types";

type ModelsContextValue = {
  models: StoredModel[];
  applications: ModelApplication[];
  getModel: (id: string) => StoredModel | undefined;
  saveModel: (model: StoredModel) => void;
  addModel: (partial: Parameters<typeof createStoredModel>[0]) => StoredModel;
  deleteModel: (id: string) => void;
  resetBuiltinDefaults: () => void;
  saveApplication: (app: ModelApplication) => void;
  createAndSaveApplication: (
    input: Parameters<typeof createApplication>[0]
  ) => ModelApplication;
  deleteApplication: (id: string) => void;
  getApplyCount: (modelId: string) => number;
  refresh: () => void;
};

const ModelsContext = createContext<ModelsContextValue | null>(null);

export function ModelsProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<StoredModel[]>(() => loadModelLibrary());
  const [applications, setApplications] = useState<ModelApplication[]>(() =>
    loadApplications()
  );

  const refresh = useCallback(() => {
    setModels(loadModelLibrary());
    setApplications(loadApplications());
  }, []);

  const getModel = useCallback(
    (id: string) => getModelById(id, models),
    [models]
  );

  const saveModel = useCallback((model: StoredModel) => {
    setModels(upsertModel(model));
  }, []);

  const addModel = useCallback(
    (partial: Parameters<typeof createStoredModel>[0]) => {
      const created = createStoredModel(partial);
      setModels(upsertModel(created));
      return created;
    },
    []
  );

  const deleteModel = useCallback((id: string) => {
    setModels(removeModel(id));
  }, []);

  const resetBuiltinDefaults = useCallback(() => {
    setModels(resetModelLibrary());
  }, []);

  const saveApplication = useCallback((app: ModelApplication) => {
    setApplications(upsertApplication(app));
  }, []);

  const createAndSaveApplication = useCallback(
    (input: Parameters<typeof createApplication>[0]) => {
      const app = createApplication(input);
      setApplications(upsertApplication(app));
      return app;
    },
    []
  );

  const deleteApplication = useCallback((id: string) => {
    setApplications(removeApplication(id));
  }, []);

  const getApplyCount = useCallback(
    (modelId: string) => countApplicationsForModel(modelId),
    []
  );

  const value = useMemo(
    () => ({
      models,
      applications,
      getModel,
      saveModel,
      addModel,
      deleteModel,
      resetBuiltinDefaults,
      saveApplication,
      createAndSaveApplication,
      deleteApplication,
      getApplyCount,
      refresh,
    }),
    [
      models,
      applications,
      getModel,
      saveModel,
      addModel,
      deleteModel,
      resetBuiltinDefaults,
      saveApplication,
      createAndSaveApplication,
      deleteApplication,
      getApplyCount,
      refresh,
    ]
  );

  return (
    <ModelsContext.Provider value={value}>{children}</ModelsContext.Provider>
  );
}

export function useModels() {
  const ctx = useContext(ModelsContext);
  if (!ctx) {
    throw new Error("useModels must be used within ModelsProvider");
  }
  return ctx;
}
