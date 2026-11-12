/**
 * scripts/cleanup-demo-firestore.ts
 *
 * Administrative maintenance script to purge legacy seeded demo accounts
 * (e.g. Luna Vance, Neo Thorne, Aarav Sharma, Kai Chen, Som Maurya demo IDs)
 * from Firestore `publicProfiles` and `users` collections.
 *
 * Usage:
 *   npx tsx scripts/cleanup-demo-firestore.ts
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

// Ensure Firebase Admin is initialized
const app = getApps().length === 0 ? initializeApp() : getApps()[0];
const db = getFirestore(app);

const DEMO_UIDS = [
  'somo_peer_luna',
  'somo_peer_neo',
  'somo_peer_iitm',
  'somo_peer_kai',
  'somo_som_admin',
  'SOMO-SOM-001',
  'SOMO-LUNA-01',
  'SOMO-NEO-02',
  'SOMO-IITM-03',
  'SOMO-KAI-99',
];

const DEMO_USERNAMES = [
  'lunavance',
  'neothorne',
  'aaravsharma',
  'kaichen',
  'sommaurya',
];

async function cleanupDemoProfiles() {
  console.log('[Cleanup] Starting purge of demo profiles from Firestore...');
  let deletedCount = 0;

  // 1. Delete known demo document IDs from publicProfiles
  for (const uid of DEMO_UIDS) {
    try {
      const docRef = db.collection('publicProfiles').doc(uid);
      const snap = await docRef.get();
      if (snap.exists) {
        await docRef.delete();
        console.log(`[Cleanup] Deleted publicProfiles/${uid}`);
        deletedCount++;
      }
    } catch (e: any) {
      console.warn(`[Cleanup] Warning for publicProfiles/${uid}:`, e.message);
    }
  }

  // 2. Query publicProfiles for demo usernames
  try {
    const pubSnap = await db.collection('publicProfiles').get();
    for (const d of pubSnap.docs) {
      const data = d.data();
      const u = (data.username || '').toLowerCase();
      if (DEMO_USERNAMES.includes(u)) {
        await d.ref.delete();
        console.log(`[Cleanup] Deleted demo public profile: ${d.id} (@${u})`);
        deletedCount++;
      }
    }
  } catch (err: any) {
    console.warn('[Cleanup] Error querying publicProfiles:', err.message);
  }

  // 3. Remove demo docs from users collection if present
  for (const uid of DEMO_UIDS) {
    try {
      const userRef = db.collection('users').doc(uid);
      const snap = await userRef.get();
      if (snap.exists) {
        await userRef.delete();
        console.log(`[Cleanup] Deleted users/${uid}`);
        deletedCount++;
      }
    } catch (e: any) {
      console.warn(`[Cleanup] Warning for users/${uid}:`, e.message);
    }
  }

  console.log(`[Cleanup] Successfully purged ${deletedCount} demo records from Firestore.`);
}

cleanupDemoProfiles()
  .then(() => {
    console.log('[Cleanup] Finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Cleanup] Execution failed:', err);
    process.exit(1);
  });
