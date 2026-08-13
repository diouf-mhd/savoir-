import { getAppConfigFromFirebase, saveAppConfigToFirebase, AppConfigData } from "../data/firebaseStorage";

export const CURRENT_APP_VERSION = "1.0.0";
const LOCAL_CONFIG_KEY = "savoir_plus_app_config_v1";

export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  apkUrl: string;
  message?: string;
}

/**
 * Compare two semver strings (e.g., "1.0.0" vs "1.0.1").
 * Returns true if latestVersion is strictly greater than currentVersion.
 */
export function isNewerVersion(currentVersion: string, latestVersion: string): boolean {
  if (!latestVersion) return false;

  const clean = (v: string) => v.replace(/^v/i, "").trim();
  const currentParts = clean(currentVersion).split(".").map((p) => parseInt(p, 10) || 0);
  const latestParts = clean(latestVersion).split(".").map((p) => parseInt(p, 10) || 0);

  const maxLength = Math.max(currentParts.length, latestParts.length);

  for (let i = 0; i < maxLength; i++) {
    const c = currentParts[i] || 0;
    const l = latestParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}

/**
 * Get current cached config from localStorage.
 */
export function getLocalAppConfig(): AppConfigData {
  try {
    const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    latest_version: "1.0.0",
    apk_url: "",
    message: "Une nouvelle version de l'application Savoir+ est disponible avec de superbes améliorations.",
  };
}

/**
 * Save config locally.
 */
export function saveLocalAppConfig(config: AppConfigData): void {
  localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Fetch latest app config from Firestore system/app_config collection,
 * fallback to local cache.
 */
export async function checkForAppUpdates(): Promise<UpdateCheckResult> {
  let config: AppConfigData | null = null;

  try {
    config = await getAppConfigFromFirebase();
  } catch (err) {
    console.warn("Could not fetch remote app config:", err);
  }

  if (!config) {
    config = getLocalAppConfig();
  } else {
    saveLocalAppConfig(config);
  }

  const hasUpdate = isNewerVersion(CURRENT_APP_VERSION, config.latest_version);

  return {
    hasUpdate,
    latestVersion: config.latest_version || CURRENT_APP_VERSION,
    currentVersion: CURRENT_APP_VERSION,
    apkUrl: config.apk_url || "",
    message: config.message || "Une nouvelle version de l'application Savoir+ est disponible avec de superbes améliorations.",
  };
}

/**
 * Save new configuration (Admin action) to both Firestore & LocalStorage.
 */
export async function updateAppConfig(config: AppConfigData): Promise<void> {
  saveLocalAppConfig(config);
  await saveAppConfigToFirebase(config);
}
