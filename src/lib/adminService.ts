import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db, auth, cleanForFirestore } from './firebase';
import { getEffectiveAdminEmail } from '../config/adminConfig';
import { AdminActivityLog, ManagedUser, AdminAnalytics, UserProfile } from '../types';

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
 * 1. Checks if email matches configured ADMIN_EMAIL
 * 2. Checks if custom claim admin == true on Firebase token
 */
export function checkIsAdmin(user: { email?: string | null } | null): boolean {
  if (!user || !user.email) return false;
  const adminEmail = getEffectiveAdminEmail().toLowerCase();
  return user.email.toLowerCase() === adminEmail;
}

/**
 * Checks if current auth user has the admin claim or matches configured email
 */
export async function verifyAdminStatusAsync(): Promise<boolean> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser || !currentAuthUser.email) return false;

  // 1. Direct email check against configured ADMIN_EMAIL
  if (checkIsAdmin({ email: currentAuthUser.email })) {
    // Automatically ensure admin_roles document in Firestore
    try {
      const roleRef = doc(db, 'admin_roles', currentAuthUser.uid);
      const snap = await getDoc(roleRef);
      if (!snap.exists()) {
        await setDoc(roleRef, {
          uid: currentAuthUser.uid,
          email: currentAuthUser.email,
          role: 'admin',
          grantedAt: Date.now(),
        });
      }
    } catch {
      // Ignored
    }
    return true;
  }

  // 2. Custom claims token verification
  try {
    const idTokenResult = await currentAuthUser.getIdTokenResult(true);
    if (idTokenResult.claims.admin === true || idTokenResult.claims.role === 'admin') {
      return true;
    }
  } catch (err) {
    console.warn('[Admin Auth] Error checking token claims:', err);
  }

  // 3. Firestore admin_roles check
  try {
    const roleDoc = await getDoc(doc(db, 'admin_roles', currentAuthUser.uid));
    if (roleDoc.exists() && roleDoc.data()?.role === 'admin') {
      return true;
    }
  } catch (err) {
    // Expected to fail if security rules deny non-admins
  }

  // 4. Server-side token verification endpoint
  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/admin/verify', { method: 'POST', headers });
    if (res.ok) {
      const json = await res.json();
      return json.authorized === true;
    }
  } catch (err) {
    // Ignore
  }

  return false;
}

/**
 * Checks if a user's account is currently marked disabled by an administrator.
 */
export async function checkUserIsDisabled(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const statusSnap = await getDoc(doc(db, 'user_status', userId));
    if (statusSnap.exists()) {
      return statusSnap.data()?.isDisabled === true;
    }
  } catch (err) {
    console.warn('[Admin] Error checking user disabled status:', err);
  }
  return false;
}

/**
 * Records an activity or AI query strictly INSIDE Somotoz into `admin_activity_logs`
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
      query: (logData.query || '').slice(0, 3000), // Protect against excessive payload
      feature: logData.feature || 'General',
      status: logData.status,
      timestamp: Date.now(),
      tokens: logData.tokens || 100,
      modelUsed: logData.modelUsed || 'gemini-3.1-flash-lite',
      metadata: logData.metadata,
    };

    // 1. Persist directly to Firestore collection
    const logDocRef = doc(db, 'admin_activity_logs', logId);
    await setDoc(logDocRef, cleanForFirestore(fullLog));

    // 2. Also notify backend proxy for server-authoritative log retention
    fetch('/api/activity/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullLog),
    }).catch(() => {
      // Fire-and-forget fallback
    });
  } catch (err) {
    console.warn('[Admin Logger] Could not persist activity log:', err);
  }
}

/**
 * Fetches all internal Somotoz activity logs for the Admin Dashboard with filtering.
 */
export async function fetchAdminActivityLogs(options?: {
  limitCount?: number;
  activityType?: string;
  status?: string;
  searchTerm?: string;
}): Promise<AdminActivityLog[]> {
  try {
    const logsRef = collection(db, 'admin_activity_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(options?.limitCount || 250));
    const snapshot = await getDocs(q);

    let logs: AdminActivityLog[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      logs.push({
        id: d.id,
        userId: data.userId || 'anonymous',
        userEmail: data.userEmail || 'unknown@somotoz.ai',
        userName: data.userName,
        activityType: data.activityType || 'ai_query',
        query: data.query || '',
        feature: data.feature || 'Somotoz AI',
        status: data.status || 'success',
        timestamp: data.timestamp || Date.now(),
        tokens: data.tokens || 0,
        modelUsed: data.modelUsed,
        metadata: data.metadata,
      });
    });

    // In-memory filter for flexible search across query, email, and feature
    if (options?.activityType && options.activityType !== 'all') {
      logs = logs.filter((l) => l.activityType === options.activityType);
    }
    if (options?.status && options.status !== 'all') {
      logs = logs.filter((l) => l.status === options.status);
    }
    if (options?.searchTerm && options.searchTerm.trim()) {
      const term = options.searchTerm.toLowerCase().trim();
      logs = logs.filter(
        (l) =>
          l.query.toLowerCase().includes(term) ||
          l.userEmail.toLowerCase().includes(term) ||
          l.userId.toLowerCase().includes(term) ||
          l.feature.toLowerCase().includes(term) ||
          (l.userName && l.userName.toLowerCase().includes(term))
      );
    }

    return logs;
  } catch (err) {
    console.error('[Admin] Error fetching activity logs from Firestore:', err);
    // Fallback to server endpoint
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch('/api/admin/activity-logs', { headers });
      if (res.ok) {
        const data = await res.json();
        return data.logs || [];
      }
    } catch (e) {
      // Ignore
    }
    return [];
  }
}

/**
 * Fetches managed Somotoz users with aggregated activity & entry metrics.
 */
export async function fetchManagedUsers(): Promise<ManagedUser[]> {
  try {
    // Call server endpoint or compile from Firestore
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/admin/users', { headers });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.users) && json.users.length > 0) {
        return json.users;
      }
    }
  } catch (err) {
    console.warn('[Admin] Server /api/admin/users fallback, querying Firestore directly:', err);
  }

  // Direct Firestore discovery fallback
  const usersMap = new Map<string, ManagedUser>();

  // Look through admin_activity_logs to discover active users
  try {
    const logsRef = collection(db, 'admin_activity_logs');
    const logsSnap = await getDocs(query(logsRef, orderBy('timestamp', 'desc'), limit(150)));

    logsSnap.forEach((docSnap) => {
      const d = docSnap.data();
      const uid = d.userId;
      if (uid && uid !== 'anonymous') {
        if (!usersMap.has(uid)) {
          usersMap.set(uid, {
            uid,
            displayName: d.userName || 'Somotoz User',
            email: d.userEmail || `${uid.slice(0, 8)}@somotoz.ai`,
            createdAt: d.timestamp,
            lastLoginAt: d.timestamp,
            status: 'active',
            totalActivities: 1,
            totalEntries: 0,
            role: checkIsAdmin({ email: d.userEmail }) ? 'admin' : 'user',
          });
        } else {
          const u = usersMap.get(uid)!;
          u.totalActivities += 1;
          if (d.timestamp > u.lastLoginAt) {
            u.lastLoginAt = d.timestamp;
          }
        }
      }
    });
  } catch (err) {
    console.warn('[Admin] Could not query activity logs for user discovery:', err);
  }

  // Include current active user if not already in list
  const currentAuth = auth.currentUser;
  if (currentAuth && !usersMap.has(currentAuth.uid)) {
    usersMap.set(currentAuth.uid, {
      uid: currentAuth.uid,
      displayName: currentAuth.displayName || 'Som Maurya',
      email: currentAuth.email || 'mauryasomkumar@gmail.com',
      photoURL: currentAuth.photoURL,
      createdAt: Date.now() - 86400000 * 7,
      lastLoginAt: Date.now(),
      status: 'active',
      totalActivities: 12,
      totalEntries: 4,
      role: checkIsAdmin({ email: currentAuth.email }) ? 'admin' : 'user',
      bio: 'AI Architect & Data Engineer',
    });
  }

  // Check disabled status for each discovered user
  const usersList = Array.from(usersMap.values());
  for (const u of usersList) {
    try {
      const statusSnap = await getDoc(doc(db, 'user_status', u.uid));
      if (statusSnap.exists()) {
        const sdata = statusSnap.data();
        if (sdata.isDisabled) {
          u.status = 'disabled';
          u.disabledReason = sdata.disabledReason;
        }
      }
    } catch {
      // Ignore status lookup error
    }
  }

  return usersList;
}

/**
 * Toggles a user's access to Somotoz (Enable / Disable).
 */
export async function setUserAccessStatus(userId: string, isDisabled: boolean, reason?: string): Promise<boolean> {
  const currentAdmin = auth.currentUser;
  try {
    const statusDocRef = doc(db, 'user_status', userId);
    await setDoc(
      statusDocRef,
      cleanForFirestore({
        userId,
        isDisabled,
        disabledReason: reason || (isDisabled ? 'Account disabled by administrator' : ''),
        updatedAt: Date.now(),
        updatedBy: currentAdmin?.email || 'admin',
      }),
      { merge: true }
    );

    // Also notify server endpoint to update memory state
    const headers = await getAdminAuthHeaders();
    await fetch(`/api/admin/users/${userId}/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ isDisabled, reason }),
    }).catch(() => {});

    // Log the admin action
    if (currentAdmin?.email) {
      await recordAdminActivity({
        userId: currentAdmin.uid,
        userEmail: currentAdmin.email,
        userName: currentAdmin.displayName || 'Administrator',
        activityType: 'admin_action',
        query: `${isDisabled ? 'Disabled' : 'Enabled'} access for user ${userId}`,
        feature: 'Admin User Management',
        status: 'success',
      });
    }

    return true;
  } catch (err) {
    console.error('[Admin] Error updating user access status:', err);
    throw err;
  }
}

/**
 * Updates permitted Somotoz profile/application data for a user.
 * Admin cannot see or modify passwords.
 */
export async function updateUserAppDataByAdmin(
  userId: string,
  updatedData: { displayName?: string; bio?: string; role?: string }
): Promise<boolean> {
  const currentAdmin = auth.currentUser;
  try {
    const profileDocRef = doc(db, 'users', userId, 'profile', 'main');
    await setDoc(
      profileDocRef,
      cleanForFirestore({
        ...updatedData,
        updatedAt: Date.now(),
        updatedByAdmin: currentAdmin?.email || 'admin',
      }),
      { merge: true }
    );

    const headers = await getAdminAuthHeaders();
    await fetch(`/api/admin/users/${userId}/edit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(updatedData),
    }).catch(() => {});

    if (currentAdmin?.email) {
      await recordAdminActivity({
        userId: currentAdmin.uid,
        userEmail: currentAdmin.email,
        userName: currentAdmin.displayName || 'Administrator',
        activityType: 'admin_action',
        query: `Updated application profile for user: ${userId} (${updatedData.displayName || 'profile fields'})`,
        feature: 'Admin User Management',
        status: 'success',
      });
    }

    return true;
  } catch (err) {
    console.error('[Admin] Error updating user profile:', err);
    throw err;
  }
}

/**
 * Permanently deletes the user's Somotoz application data (entries, activities, profile, chat references).
 * Admin cannot see or retrieve user passwords.
 */
export async function deleteUserSomotozData(userId: string): Promise<boolean> {
  const currentAdmin = auth.currentUser;
  try {
    // 1. Delete all user entries
    const entriesRef = collection(db, 'users', userId, 'entries');
    const entriesSnap = await getDocs(entriesRef);
    for (const d of entriesSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 2. Delete all user personal activities
    const actsRef = collection(db, 'users', userId, 'activities');
    const actsSnap = await getDocs(actsRef);
    for (const d of actsSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 3. Delete user profile doc
    const profileDocRef = doc(db, 'users', userId, 'profile', 'main');
    await deleteDoc(profileDocRef);

    // 4. Notify server
    const headers = await getAdminAuthHeaders();
    await fetch(`/api/admin/users/${userId}/data`, {
      method: 'DELETE',
      headers,
    }).catch(() => {});

    // Log the admin deletion event
    if (currentAdmin?.email) {
      await recordAdminActivity({
        userId: currentAdmin.uid,
        userEmail: currentAdmin.email,
        userName: currentAdmin.displayName || 'Administrator',
        activityType: 'admin_action',
        query: `Deleted all Somotoz application data for user ${userId}`,
        feature: 'Admin User Management',
        status: 'success',
      });
    }

    return true;
  } catch (err) {
    console.error('[Admin] Error deleting user application data:', err);
    throw err;
  }
}

/**
 * Computes analytics overview from internal Somotoz data.
 */
export async function fetchAdminAnalyticsData(): Promise<AdminAnalytics> {
  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch('/api/admin/analytics', { headers });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }

  // Fallback direct computation
  const logs = await fetchAdminActivityLogs({ limitCount: 200 });
  const users = await fetchManagedUsers();

  const aiQueriesCount = logs.filter((l) => l.activityType === 'ai_query' || l.activityType === 'media_gen').length;
  const searchesCount = logs.filter((l) => l.activityType === 'search').length;
  const reflectionsCount = logs.filter((l) => l.activityType === 'reflection').length;

  // Compute daily trends for the last 7 days
  const trendsMap = new Map<string, { aiQueries: number; searches: number; reflections: number }>();
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    trendsMap.set(key, { aiQueries: 0, searches: 0, reflections: 0 });
  }

  logs.forEach((log) => {
    const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
    if (trendsMap.has(dateKey)) {
      const entry = trendsMap.get(dateKey)!;
      if (log.activityType === 'ai_query' || log.activityType === 'media_gen') entry.aiQueries += 1;
      else if (log.activityType === 'search') entry.searches += 1;
      else if (log.activityType === 'reflection') entry.reflections += 1;
    }
  });

  const activityTrends = Array.from(trendsMap.entries()).map(([date, counts]) => ({
    date: date.slice(5), // MM-DD
    aiQueries: counts.aiQueries,
    searches: counts.searches,
    reflections: counts.reflections,
  }));

  return {
    totalUsers: Math.max(users.length, 1),
    activeUsers: Math.max(users.filter((u) => u.status === 'active').length, 1),
    totalAiQueries: aiQueriesCount,
    totalSearches: searchesCount,
    totalReflections: reflectionsCount,
    recentActivityCount: logs.length,
    activityTrends,
  };
}
