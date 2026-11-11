import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface UserDataExportPackage {
  exportMetadata: {
    exportId: string;
    exportedAt: string;
    uid: string;
    platform: string;
    version: string;
    notice: string;
  };
  profile: Record<string, any> | null;
  publicProfile: Record<string, any> | null;
  journalEntries: Array<Record<string, any>>;
  reflectionsAndActivities: Array<Record<string, any>>;
  chatRequests: {
    outgoing: Array<Record<string, any>>;
    incoming: Array<Record<string, any>>;
  };
}

/**
 * Downloads all personal application data for the current authenticated user as a structured JSON file.
 * Fulfills data portability requirements under privacy regulations.
 */
export async function downloadMyUserData(uid?: string, username?: string): Promise<UserDataExportPackage> {
  const currentUid = uid || auth.currentUser?.uid;
  if (!currentUid) {
    throw new Error('User must be authenticated to download personal data.');
  }

  // 1. Fetch user private profile
  let profileData: Record<string, any> | null = null;
  try {
    const profileSnap = await getDoc(doc(db, 'users', currentUid, 'profile', 'main'));
    if (profileSnap.exists()) {
      profileData = profileSnap.data();
    }
  } catch (err) {
    console.warn('[UserDataExport] Error fetching profile:', err);
  }

  // 2. Fetch public directory profile
  let publicProfileData: Record<string, any> | null = null;
  try {
    const publicSnap = await getDoc(doc(db, 'public_profiles', currentUid));
    if (publicSnap.exists()) {
      publicProfileData = publicSnap.data();
    }
  } catch (err) {
    console.warn('[UserDataExport] Error fetching public profile:', err);
  }

  // 3. Fetch journal entries
  const entries: Array<Record<string, any>> = [];
  try {
    const entriesSnap = await getDocs(collection(db, 'users', currentUid, 'entries'));
    entriesSnap.forEach((d) => {
      entries.push({ id: d.id, ...d.data() });
    });
  } catch (err) {
    console.warn('[UserDataExport] Error fetching entries:', err);
  }

  // 4. Fetch reflections and personal activities
  const activities: Array<Record<string, any>> = [];
  try {
    const actsSnap = await getDocs(collection(db, 'users', currentUid, 'activities'));
    actsSnap.forEach((d) => {
      activities.push({ id: d.id, ...d.data() });
    });
  } catch (err) {
    console.warn('[UserDataExport] Error fetching activities:', err);
  }

  // 5. Fetch chat requests
  const outgoingRequests: Array<Record<string, any>> = [];
  const incomingRequests: Array<Record<string, any>> = [];
  try {
    const outSnap = await getDocs(query(collection(db, 'chatRequests'), where('fromUid', '==', currentUid)));
    outSnap.forEach((d) => outgoingRequests.push({ id: d.id, ...d.data() }));

    const inSnap = await getDocs(query(collection(db, 'chatRequests'), where('toUid', '==', currentUid)));
    inSnap.forEach((d) => incomingRequests.push({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[UserDataExport] Error fetching chat requests:', err);
  }

  const exportPackage: UserDataExportPackage = {
    exportMetadata: {
      exportId: `USER_DATA_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      exportedAt: new Date().toISOString(),
      uid: currentUid,
      platform: 'Somotoz AI Suite',
      version: '2.0.0',
      notice: 'This export contains your personal account profile, journal entries, AI reflections, and chat connections.',
    },
    profile: profileData,
    publicProfile: publicProfileData,
    journalEntries: entries,
    reflectionsAndActivities: activities,
    chatRequests: {
      outgoing: outgoingRequests,
      incoming: incomingRequests,
    },
  };

  // Trigger browser download
  try {
    const jsonString = JSON.stringify(exportPackage, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeUsername = (username || profileData?.username || currentUid.slice(0, 8)).replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `somotoz_data_export_${safeUsername}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[UserDataExport] Browser file download failed:', err);
  }

  return exportPackage;
}
