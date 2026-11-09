import { doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth, cleanForFirestore, logoutUser } from './firebase';
import { UserProfile, PublicUserProfile } from '../types';

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Validates a username format and checks real-time availability in Firestore.
 */
export async function checkUsernameAvailability(
  username: string,
  currentUid?: string
): Promise<{ isValid: boolean; isAvailable: boolean; message: string }> {
  const trimmed = username.trim().toLowerCase();

  if (!trimmed) {
    return { isValid: false, isAvailable: false, message: 'Username is required.' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, isAvailable: false, message: 'Username must be at least 3 characters.' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, isAvailable: false, message: 'Username must be at most 20 characters.' };
  }

  if (!USERNAME_REGEX.test(trimmed)) {
    return {
      isValid: false,
      isAvailable: false,
      message: 'Only letters, numbers, and underscores are allowed.',
    };
  }

  try {
    const docRef = doc(db, 'usernames', trimmed);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { isValid: true, isAvailable: true, message: 'Username is available.' };
    }

    const data = snap.data();
    if (currentUid && data.uid === currentUid) {
      return { isValid: true, isAvailable: true, message: 'This is your current username.' };
    }

    return { isValid: true, isAvailable: false, message: 'This username is already taken.' };
  } catch (err: any) {
    console.warn('Error checking username availability:', err);
    return { isValid: true, isAvailable: true, message: 'Username format is valid.' };
  }
}

/**
 * Checks if a user is eligible to change their username (once every 30 days).
 */
export function checkUsernameChangeCooldown(lastChangedAt?: number): {
  canChange: boolean;
  daysRemaining: number;
} {
  if (!lastChangedAt) {
    return { canChange: true, daysRemaining: 0 };
  }

  const elapsed = Date.now() - lastChangedAt;
  if (elapsed >= THIRTY_DAYS_MS) {
    return { canChange: true, daysRemaining: 0 };
  }

  const remainingMs = THIRTY_DAYS_MS - elapsed;
  const daysRemaining = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  return { canChange: false, daysRemaining };
}

/**
 * Saves or updates a user profile with strict privacy guarantees.
 * Private data (email, real name, phone, dob) is saved ONLY to users/{uid}.
 * Only username, photo, bio, and mood are written to public_profiles/{uid}.
 */
export async function saveFullUserProfile(
  uid: string,
  profileData: Partial<UserProfile>,
  oldUsername?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = Date.now();
    const newUsername = profileData.username?.trim().toLowerCase();

    // 1. Manage username reservation if username is provided or changed
    if (newUsername && newUsername !== oldUsername?.toLowerCase()) {
      // Claim new username
      const newUsernameRef = doc(db, 'usernames', newUsername);
      await setDoc(newUsernameRef, {
        username: newUsername,
        uid,
        createdAt: now,
      });

      // Release old username if user had one
      if (oldUsername) {
        try {
          const oldRef = doc(db, 'usernames', oldUsername.toLowerCase());
          await deleteDoc(oldRef);
        } catch (e) {
          console.warn('Could not release previous username:', e);
        }
      }

      profileData.usernameLastChangedAt = now;
    }

    // Never save base mode to Firestore (only mood & accent are stored)
    const dataToSave = { ...profileData };
    delete (dataToSave as any).theme;
    delete (dataToSave as any).baseMode;

    const sanitizedData = cleanForFirestore({
      ...dataToSave,
      uid,
      updatedAt: now,
    });

    // 2. Save private profile to users/{uid} and users/{uid}/profile/main
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, sanitizedData, { merge: true });

    const userProfileSubDoc = doc(db, 'users', uid, 'profile', 'main');
    await setDoc(userProfileSubDoc, sanitizedData, { merge: true });

    // 3. Save PUBLIC profile (strictly NO real name, email, or phone)
    if (profileData.username) {
      const publicData: PublicUserProfile = {
        uid,
        username: profileData.username.trim(),
        photoURL: profileData.photoURL || null,
        bio: profileData.bio || '',
        mood: profileData.mood || 'peaceful',
        accentColor: profileData.accentColor,
        isAdult: profileData.isAdult !== false,
        updatedAt: now,
      };

      const publicDocRef = doc(db, 'public_profiles', uid);
      await setDoc(publicDocRef, cleanForFirestore(publicData), { merge: true });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to save profile in Firestore:', err);
    return { success: false, error: err.message || 'Could not save profile.' };
  }
}

/**
 * Schedules account deletion and removes public-facing records.
 */
export async function scheduleAccountDeletion(
  uid: string,
  username?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = Date.now();

    // 1. Mark user profile as scheduled for deletion
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        status: 'scheduled_for_deletion',
        deletionScheduledAt: now,
      },
      { merge: true }
    );

    const subDocRef = doc(db, 'users', uid, 'profile', 'main');
    await setDoc(
      subDocRef,
      {
        status: 'scheduled_for_deletion',
        deletionScheduledAt: now,
      },
      { merge: true }
    );

    // 2. Remove public profile so user no longer appears in SomoChat
    try {
      const publicDocRef = doc(db, 'public_profiles', uid);
      await deleteDoc(publicDocRef);
    } catch {}

    // 3. Release username doc so it can be reclaimed
    if (username) {
      try {
        const usernameRef = doc(db, 'usernames', username.toLowerCase());
        await deleteDoc(usernameRef);
      } catch {}
    }

    // 4. Sign out
    await logoutUser();

    return { success: true };
  } catch (err: any) {
    console.error('Account deletion error:', err);
    return { success: false, error: err.message || 'Could not schedule account deletion.' };
  }
}

/**
 * Silently refreshes the Firebase ID token if nearing expiration.
 */
export async function ensureFreshIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(false);
  } catch (err) {
    console.warn('Silent token refresh failed, trying force refresh:', err);
    try {
      return await user.getIdToken(true);
    } catch {
      return null;
    }
  }
}
