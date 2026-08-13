import appLogo from "../actifs/images/Logo.png";
import officialSignature from "../actifs/images/Signature.png";

// Cache in localStorage if available
if (typeof window !== "undefined") {
  try {
    if (appLogo) localStorage.setItem("savoir_app_logo", appLogo);
    if (officialSignature) localStorage.setItem("savoir_app_signature", officialSignature);
  } catch (e) {
    // ignore local storage error if full
  }
}

export function getAppLogo(): string {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("savoir_app_logo");
    if (cached) return cached;
  }
  return appLogo;
}

export function getOfficialSignature(): string {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("savoir_app_signature");
    if (cached) return cached;
  }
  return officialSignature;
}

export { appLogo, officialSignature };
