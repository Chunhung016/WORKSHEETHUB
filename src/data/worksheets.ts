import { get, set } from 'idb-keyval';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WorksheetItem } from '../types';

export const INITIAL_WORKSHEETS: WorksheetItem[] = [
  {
    id: 'ws-1',
    qrCodeId: 'BEE-ABC-01',
    title: 'Alphabet & Phonics Worksheet 01 - Answer Key',
    gradeClass: 'STD 1',
    subject: 'English',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    fileName: 'Alphabet_Phonics_01_Answer.pdf',
  },
  {
    id: 'ws-2',
    qrCodeId: 'BEE-MATH-02',
    title: 'Counting Numbers 1 to 10 - Answer Key',
    gradeClass: 'STD 1',
    subject: 'Mathematics',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Math_Counting_02_Answer.pdf',
  },
  {
    id: 'ws-3',
    qrCodeId: 'BEE-NATURE-03',
    title: 'Honey Bee Science & Life Cycle - Answer Key',
    gradeClass: 'STD 2',
    subject: 'Science',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    fileName: 'Bee_Science_03_Answer.pdf',
  }
];

const LOCAL_STORAGE_KEY = 'little_bee_worksheets_v3';
const INITIALIZED_KEY = 'little_bee_storage_initialized_v3';
const FIRESTORE_COLLECTION = 'worksheets';

// Helper: load local items from IndexedDB
export const getLocalWorksheets = async (): Promise<WorksheetItem[] | null> => {
  try {
    const saved = await get<WorksheetItem[]>(LOCAL_STORAGE_KEY);
    if (saved && Array.isArray(saved)) {
      return saved;
    }
  } catch (e) {
    console.error('Error reading from IndexedDB:', e);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore JSON or localStorage error
  }

  return null;
};

// Helper: save local items to IndexedDB and localStorage
export const saveLocalWorksheets = async (worksheets: WorksheetItem[]): Promise<void> => {
  try {
    await set(LOCAL_STORAGE_KEY, worksheets);
    await set(INITIALIZED_KEY, true);
  } catch (e) {
    console.error('Error writing to IndexedDB:', e);
  }

  // Try storing in localStorage (strip large base64 if quota exceeded)
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(worksheets));
    localStorage.setItem(INITIALIZED_KEY, 'true');
  } catch (e) {
    // Large base64 PDF exceeded 5MB localStorage limit - strip PDF payload for localStorage fallback
    try {
      const lightweight = worksheets.map(ws => ({
        ...ws,
        pdfUrl: ws.pdfUrl.startsWith('data:') ? '' : ws.pdfUrl,
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweight));
    } catch {
      // IndexedDB has already persisted the full data safely
    }
  }
};

// Merge cloud documents with local cache to ensure no local PDFs or new additions are lost
const mergeCloudWithLocal = (
  cloudItems: WorksheetItem[],
  localItems: WorksheetItem[] | null
): WorksheetItem[] => {
  if (!localItems || localItems.length === 0) {
    return cloudItems;
  }

  const localMap = new Map<string, WorksheetItem>();
  localItems.forEach((item) => localMap.set(item.id, item));

  // Update cloud items with local high-res PDF data if cloud copy is lightweight
  const merged: WorksheetItem[] = cloudItems.map((cloudItem) => {
    const local = localMap.get(cloudItem.id);
    if (local && local.pdfUrl && (!cloudItem.pdfUrl || cloudItem.pdfUrl.length < 50)) {
      return {
        ...cloudItem,
        pdfUrl: local.pdfUrl,
        fileName: local.fileName || cloudItem.fileName,
      };
    }
    return cloudItem;
  });

  return merged;
};

/**
 * Real-time listener: syncs across open browser tabs & devices without overwriting local data
 */
export const subscribeToWorksheets = (
  onUpdate: (worksheets: WorksheetItem[]) => void
) => {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        // Read current local cache
        const localItems = await getLocalWorksheets();
        
        if (!snapshot.empty) {
          const cloudItems: WorksheetItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            cloudItems.push({
              id: docSnap.id,
              qrCodeId: data.qrCodeId || '',
              title: data.title || '',
              gradeClass: data.gradeClass || 'STD 1',
              subject: data.subject || 'General',
              pdfUrl: data.pdfUrl || '',
              fileName: data.fileName,
            });
          });

          const merged = mergeCloudWithLocal(cloudItems, localItems);
          await saveLocalWorksheets(merged);
          onUpdate(merged);
        }
      },
      (error) => {
        console.warn('Firestore real-time subscription error:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish Firestore listener:', err);
    return () => {};
  }
};

/**
 * Fetch worksheets on page load (Reliable local-first + cloud merge)
 */
export const getWorksheetsFromStorage = async (): Promise<WorksheetItem[]> => {
  // 1. Check local IndexedDB first
  const localItems = await getLocalWorksheets();
  const isInitialized = (await get<boolean>(INITIALIZED_KEY)) || localStorage.getItem(INITIALIZED_KEY) === 'true';

  // 2. Fetch from Firestore
  try {
    const colRef = collection(db, FIRESTORE_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (!snapshot.empty) {
      const cloudItems: WorksheetItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        cloudItems.push({
          id: docSnap.id,
          qrCodeId: data.qrCodeId || '',
          title: data.title || '',
          gradeClass: data.gradeClass || 'STD 1',
          subject: data.subject || 'General',
          pdfUrl: data.pdfUrl || '',
          fileName: data.fileName,
        });
      });

      const merged = mergeCloudWithLocal(cloudItems, localItems);
      await saveLocalWorksheets(merged);
      return merged;
    } else {
      // Cloud is empty.
      if (localItems && localItems.length > 0) {
        // User has local data -> sync local items up to cloud
        syncAllToFirestore(localItems).catch(() => {});
        return localItems;
      }

      if (isInitialized) {
        // User intentionally deleted all worksheets -> return empty array
        return [];
      }

      // First time user launch: initialize with defaults and save
      await saveLocalWorksheets(INITIAL_WORKSHEETS);
      syncAllToFirestore(INITIAL_WORKSHEETS).catch(() => {});
      return INITIAL_WORKSHEETS;
    }
  } catch (cloudError) {
    console.warn('Cloud fetch failed, using local storage fallback:', cloudError);
  }

  // 3. Cloud unavailable or failed: Return local data
  if (localItems !== null) {
    return localItems;
  }

  if (isInitialized) {
    return [];
  }

  // Brand new offline launch
  await saveLocalWorksheets(INITIAL_WORKSHEETS);
  return INITIAL_WORKSHEETS;
};

/**
 * Batch sync full worksheet list to Firestore safely
 */
export const syncAllToFirestore = async (worksheets: WorksheetItem[]) => {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTION);
    const snapshot = await getDocs(colRef);
    const newIds = new Set(worksheets.map((w) => w.id));

    // Delete items that were removed
    for (const docSnap of snapshot.docs) {
      if (!newIds.has(docSnap.id)) {
        await deleteDoc(docSnap.ref).catch((e) => console.warn('Could not delete cloud doc:', e));
      }
    }

    // Save/Update each item in Firestore
    for (const ws of worksheets) {
      // Firestore document max limit is 1MB. If base64 is too large (> 750KB),
      // we save the metadata without exceeding the document limit.
      let cloudPdfUrl = ws.pdfUrl;
      if (cloudPdfUrl && cloudPdfUrl.startsWith('data:') && cloudPdfUrl.length > 750000) {
        cloudPdfUrl = ''; // Retained locally in IndexedDB
      }

      const docRef = doc(db, FIRESTORE_COLLECTION, ws.id);
      await setDoc(docRef, {
        id: ws.id,
        qrCodeId: ws.qrCodeId,
        title: ws.title,
        gradeClass: ws.gradeClass || 'STD 1',
        subject: ws.subject || 'General',
        pdfUrl: cloudPdfUrl,
        fileName: ws.fileName || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch((e) => {
        console.warn(`Could not sync worksheet ${ws.id} to cloud:`, e);
      });
    }
  } catch (err) {
    console.error('Failed to batch sync to Firestore:', err);
  }
};

/**
 * Save worksheets to both local IndexedDB and Cloud Firestore
 */
export const saveWorksheetsToStorage = async (worksheets: WorksheetItem[]) => {
  // 1. Immediately persist full data locally (guarantees zero data loss on refresh)
  await saveLocalWorksheets(worksheets);

  // 2. Sync to Cloud Firestore asynchronously
  syncAllToFirestore(worksheets).catch((err) => {
    console.warn('Cloud sync error:', err);
  });
};
