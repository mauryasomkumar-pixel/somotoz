// ========================================================
// SOMOTOZ MASTER ADMIN CONFIGURATION
// ========================================================
// Enter your authorized administrator email below.
// Firebase Authentication + server-side authorization will verify
// that only signed-in users matching this email (or with custom
// admin claims) can access the admin dashboard and administrative APIs.
//
// Do NOT place passwords, service account keys, or private tokens here.
// ========================================================

// ADMIN CONFIGURATION
export const ADMIN_EMAIL: string = "ENTER_YOUR_ADMIN_EMAIL_HERE";

// Secondary fallback email for Som Maurya (owner of Somotoz)
// if ADMIN_EMAIL is left as the default placeholder string above:
export const OWNER_FALLBACK_EMAIL = "mauryasomkumar@gmail.com";

/**
 * Returns the effective admin email configured for the application.
 */
export function getEffectiveAdminEmail(): string {
  if (ADMIN_EMAIL && ADMIN_EMAIL !== "ENTER_YOUR_ADMIN_EMAIL_HERE") {
    return ADMIN_EMAIL.trim().toLowerCase();
  }
  return OWNER_FALLBACK_EMAIL.toLowerCase();
}
