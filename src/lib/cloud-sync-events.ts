export const CLOUD_SYNCED_EVENT = "workshop-cloud-synced";

export function dispatchCloudSynced() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CLOUD_SYNCED_EVENT));
}
