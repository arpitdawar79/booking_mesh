import type { ImportContext } from "./contact-import-context";

const STORAGE_KEY = "booking-mesh:contact-import-installation-id";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** A resettable browser installation label, never a hardware identity. */
export function captureImportDevice(): NonNullable<ImportContext["device"]> {
  let installationId: string = crypto.randomUUID();
  let persistence: "local_storage" | "import_only" = "import_only";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && UUID.test(stored)) installationId = stored;
    else localStorage.setItem(STORAGE_KEY, installationId);
    persistence = "local_storage";
  } catch {
    // Restricted storage must not block contact imports.
  }
  return {
    installationId,
    persistence,
    language: navigator.language.slice(0, 80),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone.slice(0, 100),
    displayMode: window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & {standalone?: boolean}).standalone === true
      ? "standalone" : "browser",
  };
}
