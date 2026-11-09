// ========================================================
// SOMOTOZ MASTER ADMIN CONFIGURATION
// ========================================================
// Admin role is derived exclusively from Firebase Auth custom claims (admin: true)
// and verified server-side. No secrets or admin emails are hardcoded in client code.
// ========================================================

// Optional environment variable hint for UI display
export const ADMIN_EMAIL: string = ((import.meta as any).env?.VITE_ADMIN_EMAIL as string) || '';

/**
 * Returns the configured administrator email hint from environment variables if present.
 * Real authorization is enforced via verified Firebase ID tokens and custom claims.
 */
export function getEffectiveAdminEmail(): string {
  return ADMIN_EMAIL.trim().toLowerCase();
}

