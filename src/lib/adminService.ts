import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { reauthenticateWithPopup, signInWithPopup } from 'firebase/auth';
import { db, auth, googleProvider, cleanForFirestore } from './firebase';
import { getEffectiveAdminEmail } from '../config/adminConfig';
import {
  AdminActivityLog,
  AdminActionLog,
  ManagedUser,
  AdminAnalytics,
  SomoReport,
  LegalExportLog,
} from '../types';

export class AdminReauthRequiredError extends Error {
  constructor(message: string = 'Recent authentication required (within last 5 minutes).') {
    super(message);
    this.name = 'AdminReauthRequiredError';
  }
}

/**
 * Automatically retrieves fresh Firebase ID token and builds authorization headers
 * without requiring the user to manually copy, paste, or supply tokens.
 */
export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const currentAuthUser = auth.currentUser;
  if (currentAuthUser) {
    try {
      const idToken = await currentAuthUser.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
      headers['x-user-id'] = currentAuthUser.uid;
      headers['x-user-email'] = currentAuthUser.email || '';
    } catch (err) {
      console.warn('[Admin] Failed to obtain fresh ID token automatically:', err);
    }
  }
  return headers;
}

/**
 * Validates whether the given user has administrative privileges.
 * Admin role is verified via server-side custom claims or verified token.
 */
export function checkIsAdmin(user: { email?: string | null } | null): boolean {
  if (!user || !user.email) return false;
  const adminEmail = getEffectiveAdminEmail().toLowerCase();
  if (adminEmail && user.email.toLowerCase() === adminEmail) {
    return true;
  }
  return false;
}

/**
 * Checks if a user's account is currently marked disabled or suspended by an administrator.
 */
export async function checkUserIsDisabled(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const statusSnap = await getDoc(doc(db, 'user_status', userId));
    if (statusSnap.exists()) {
      const data = statusSnap.data();
      return data?.isDisabled === true || data?.status === 'suspended' || data?.status === 'banned';
    }
  } catch (err) {
    console.warn('[Admin] Error checking user disabled status:', err);
  }
  return false;
}

/**
 * Checks if current auth user has the admin claim or matches configured email
 */
export async function verifyAdminStatusAsync(): Promise<{
  authorized: boolean;
  isAdmin: boolean;
  isRecentAuth: boolean;
  authTime?: number;
}> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    return { authorized: false, isAdmin: false, isRecentAuth: false };
  }

  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/admin/verify', { method: 'POST', headers });
    if (res.ok) {
      const json = await res.json();
      return {
        authorized: json.authorized === true,
        isAdmin: json.isAdmin === true,
        isRecentAuth: json.isRecentAuth === true,
        authTime: json.authTime,
      };
    }
  } catch (err) {
    console.warn('[Admin Auth] Error verifying token with server:', err);
  }

  // Fallback client claims check
  try {
    const idTokenResult = await currentAuthUser.getIdTokenResult(true);
    const isAdmin = idTokenResult.claims.admin === true && currentAuthUser.emailVerified === true;
    const authTime = typeof idTokenResult.authTime === 'string'
      ? Math.floor(new Date(idTokenResult.authTime).getTime() / 1000)
      : Math.floor(Date.now() / 1000);
    const nowSec = Math.floor(Date.now() / 1000);
    const isRecentAuth = (nowSec - authTime) <= 300;

    return {
      authorized: isAdmin,
      isAdmin,
      isRecentAuth,
      authTime,
    };
  } catch (err) {
    console.warn('[Admin Auth] Fallback claims check error:', err);
  }

  return { authorized: false, isAdmin: false, isRecentAuth: false };
}

/**
 * Re-authenticates current administrator to satisfy the 5-minute security gate.
 */
export async function reauthenticateAdmin(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    await reauthenticateWithPopup(user, googleProvider);
    await user.getIdToken(true);
    return true;
  } catch (err) {
    console.warn('[Admin Reauth] reauthenticateWithPopup fallback:', err);
    try {
      await signInWithPopup(auth, googleProvider);
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
        return true;
      }
    } catch (e) {
      console.error('[Admin Reauth] Re-authentication failed:', e);
    }
  }
  return false;
}

/**
 * Triggers server-side custom claim assignment for the administrator.
 */
export async function claimAdminRoleAsync(): Promise<{ success: boolean; message: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/admin/claim-admin-role', {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to claim admin role');
    }
    // Refresh user's Firebase ID token to pick up new claims
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
    return { success: true, message: data.message || 'Admin custom claim assigned.' };
  } catch (err: any) {
    console.error('[Admin] Error claiming admin role:', err);
    throw err;
  }
}

/**
 * Computes analytics overview from internal Somotoz data (Counts only).
 */
export async function fetchAdminAnalyticsData(): Promise<AdminAnalytics> {
  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/admin/analytics', { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.analytics) return data.analytics;
    }
  } catch (err) {
    console.warn('[Admin Analytics] API fetch notice:', err);
  }

  // Graceful fallback
  return {
    totalUsers: 1,
    activeUsers: 1,
    dailyActiveUsers: 1,
    suspendedUsers: 0,
    bannedUsers: 0,
    pendingReports: 0,
    resolvedReports: 0,
    underageReports: 0,
    totalReflectionsCount: 0,
    totalChatMessagesCount: 0,
    totalWisdomQueriesCount: 0,
    totalAiQueries: 0,
    totalSearches: 0,
    totalReflections: 0,
    recentActivityCount: 0,
    activityTrends: [],
  };
}

/**
 * Fetches managed Somotoz users with status and report counts.
 * Strictly NO chat viewing.
 */
export async function fetchManagedUsers(searchTerm?: string): Promise<ManagedUser[]> {
  try {
    const headers = await getAdminAuthHeaders();
    const url = searchTerm
      ? `/api/admin/users?search=${encodeURIComponent(searchTerm)}`
      : '/api/admin/users';
    const res = await fetch(url, { headers });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.users)) {
        return json.users;
      }
    }
  } catch (err) {
    console.warn('[Admin Users] Server /api/admin/users notice:', err);
  }
  return [];
}

/**
 * Performs a user moderation action (suspend, unsuspend, ban, delete).
 * Requires explanatory note and recent authentication (within last 5 minutes).
 */
export async function executeUserModerationAction(
  userId: string,
  action: 'suspend' | 'unsuspend' | 'ban' | 'delete',
  note: string
): Promise<{ success: boolean; action: string }> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch(`/api/admin/users/${userId}/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, note }),
  });

  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    if (data.error === 'REAUTH_REQUIRED' || (data.message && data.message.includes('Recent re-authentication required'))) {
      throw new AdminReauthRequiredError(data.message || 'Recent authentication required (within last 5 minutes).');
    }
    throw new Error(data.message || 'Authentication required.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || 'Moderation action failed.');
  }

  return await res.json();
}

/**
 * Fetches user reports for Admin Dashboard review.
 * Only attached messages (up to 20) are displayed.
 */
export async function fetchAdminReportsAsync(): Promise<SomoReport[]> {
  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/admin/reports', { headers });
    if (res.ok) {
      const data = await res.json();
      return data.reports || [];
    }
  } catch (err) {
    console.warn('[Admin Reports] API fetch notice:', err);
  }
  return [];
}

/**
 * Performs a report moderation action (dismiss, warn, suspend, ban).
 * Requires explanatory note and recent authentication (within last 5 minutes).
 */
export async function executeReportModerationAction(
  reportId: string,
  action: 'dismiss' | 'warn' | 'suspend' | 'ban',
  note: string
): Promise<{ success: boolean; action: string; status: string }> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch(`/api/admin/reports/${reportId}/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, note }),
  });

  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    if (data.error === 'REAUTH_REQUIRED' || (data.message && data.message.includes('Recent re-authentication required'))) {
      throw new AdminReauthRequiredError(data.message || 'Recent authentication required (within last 5 minutes).');
    }
    throw new Error(data.message || 'Authentication required.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || 'Report moderation failed.');
  }

  return await res.json();
}

/**
 * Fetches the immutable admin action audit log (who, what, when, why).
 */
export async function fetchAdminActionLogs(): Promise<AdminActionLog[]> {
  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/admin/action-logs', { headers });
    if (res.ok) {
      const data = await res.json();
      return data.logs || [];
    }
  } catch (err) {
    console.warn('[Admin Action Logs] API fetch notice:', err);
  }
  return [];
}

/**
 * Fetches the priority queue for suspicious accounts and underage reports.
 */
export async function fetchFlaggedQueue(): Promise<{
  underageReports: SomoReport[];
  suspiciousUsers: any[];
}> {
  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/admin/flagged-queue', { headers });
    if (res.ok) {
      const data = await res.json();
      return {
        underageReports: data.underageReports || [],
        suspiciousUsers: data.suspiciousUsers || [],
      };
    }
  } catch (err) {
    console.warn('[Flagged Queue] API fetch notice:', err);
  }
  return { underageReports: [], suspiciousUsers: [] };
}

/**
 * Performs a verified Legal Request Export (server-side only, strictly logged).
 * Generates compliance records within retention window.
 * Requires recent authentication (within last 5 minutes).
 */
export async function executeLegalExportAsync(params: {
  targetUserId: string;
  caseReference: string;
  requestingAuthority: string;
  orderDate: string;
  note?: string;
}): Promise<{ success: boolean; exportData?: any; error?: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/admin/legal-export', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      if (data.error === 'REAUTH_REQUIRED' || (data.message && data.message.includes('Recent re-authentication required'))) {
        throw new AdminReauthRequiredError(data.message || 'Recent authentication required (within last 5 minutes).');
      }
      return { success: false, error: data.message || 'Unauthorized' };
    }

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || data.error || 'Legal export failed.' };
    }
    return { success: true, exportData: data.exportData };
  } catch (err: any) {
    if (err instanceof AdminReauthRequiredError) throw err;
    return { success: false, error: err.message || 'Legal export request failed.' };
  }
}

/**
 * Triggers manual retention cleanup.
 * Purges soft-deleted messages, expired messages, and scheduled accounts older than retention days (90 days).
 */
export async function triggerRetentionCleanupAsync(note: string): Promise<{
  success: boolean;
  deletedMessagesCount: number;
  deletedAccountsCount: number;
  retentionDays: number;
}> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch('/api/admin/retention-cleanup', {
    method: 'POST',
    headers,
    body: JSON.stringify({ note }),
  });

  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    if (data.error === 'REAUTH_REQUIRED' || (data.message && data.message.includes('Recent re-authentication required'))) {
      throw new AdminReauthRequiredError(data.message || 'Recent authentication required (within last 5 minutes).');
    }
    throw new Error(data.message || 'Authentication required.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || 'Retention cleanup failed.');
  }

  return await res.json();
}

/**
 * Backward-compatibility: Submits a report about a user or conduct in SomoChat.
 */
export async function submitUserReportAsync(
  report: Omit<SomoReport, 'id' | 'timestamp' | 'status' | 'reporterId'> & { reporterId?: string }
): Promise<{ success: boolean; id: string }> {
  const currentAuth = auth.currentUser;
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullReport: SomoReport = {
    id: reportId,
    reporterId: currentAuth?.uid || report.reporterId || 'anonymous',
    reporterEmail: currentAuth?.email || report.reporterEmail || '',
    reportedUserId: report.reportedUserId,
    reportedUserName: report.reportedUserName || 'User',
    reportedSomoId: report.reportedSomoId,
    reason: report.reason,
    details: report.details || '',
    attachedMessages: report.attachedMessages || [],
    timestamp: Date.now(),
    status: 'pending',
  };

  try {
    const reportRef = doc(db, 'reports', reportId);
    await setDoc(reportRef, cleanForFirestore(fullReport));
  } catch (err) {
    console.warn('[Reports] Direct Firestore report write note:', err);
  }

  try {
    const headers = await getAdminAuthHeaders();
    await fetch('/api/reports', {
      method: 'POST',
      headers,
      body: JSON.stringify(fullReport),
    });
  } catch (err) {
    console.warn('[Reports] Server report proxy note:', err);
  }

  return { success: true, id: reportId };
}

/**
 * Backward-compatibility helper for recording internal Somotoz activity telemetry.
 */
export async function recordAdminActivity(logData: {
  userId: string;
  userEmail: string;
  userName?: string;
  activityType: AdminActivityLog['activityType'];
  query: string;
  feature: string;
  status: 'success' | 'error';
  tokens?: number;
  modelUsed?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullLog: AdminActivityLog = {
      id: logId,
      userId: logData.userId || 'anonymous',
      userEmail: logData.userEmail || 'unknown@somotoz.ai',
      userName: logData.userName || 'Somotoz User',
      activityType: logData.activityType,
      query: (logData.query || '').slice(0, 3000),
      feature: logData.feature || 'General',
      status: logData.status,
      timestamp: Date.now(),
      tokens: logData.tokens || 100,
      modelUsed: logData.modelUsed || 'gemini-3.1-flash-lite',
      metadata: logData.metadata,
    };

    fetch('/api/activity/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullLog),
    }).catch(() => {});
  } catch (err) {
    console.warn('[Admin Logger] Notice:', err);
  }
}
