// ========================================================
// SOMOTOZ MASTER ADMIN CONFIGURATION
// ========================================================
// Single authoritative administrator email configuration.
// Verified via Firebase Authentication + server-side custom claims + Firebase Security Rules.
// ========================================================

// Authoritative administrator email for Somotoz
export const ADMIN_EMAIL: string = "mauryasomkumar@gmail.com";

/**
 * Returns the configured administrator email for Somotoz.
 */
export function getEffectiveAdminEmail(): string {
  return ADMIN_EMAIL.trim().toLowerCase();
}

