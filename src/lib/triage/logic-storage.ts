import { loadLocal, saveLocal } from "@/lib/local-store";
import {
  DEFAULT_TRIAGE_WIZARD,
  type TriageWizardStep,
} from "./logic";

const KEY = "workshop-triage-logic";

export function loadTriageWizard(): TriageWizardStep[] {
  const custom = loadLocal<TriageWizardStep[] | null>(KEY, null);
  if (!custom?.length) return DEFAULT_TRIAGE_WIZARD;
  return custom;
}

export function saveTriageWizard(steps: TriageWizardStep[]): TriageWizardStep[] {
  saveLocal(KEY, steps);
  return steps;
}

export function resetTriageWizard(): TriageWizardStep[] {
  saveLocal(KEY, null);
  return DEFAULT_TRIAGE_WIZARD;
}
