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

const DB_KEY = 'little_bee_worksheets_pdf_v2';
const FIRESTORE_COLLECTION = 'worksheets';

/**
 * Subscribe to real-time cloud changes across all devices
 */
export const subscribeToWorksheets = (
  onUpdate: (worksheets: WorksheetItem[]) => void
) => {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: WorksheetItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({
              id: docSnap.id,
              qrCodeId: data.qrCodeId || '',
              title: data.title || '',
              gradeClass: data.gradeClass || 'STD 1',
              subject: data.subject || 'General',
              pdfUrl: data.pdfUrl || '',
              fileName: data.fileName,
            });
          });
          // Cache locally
          set(DB_KEY, items).catch(() => {});
          onUpdate(items);
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
 * Get worksheets prioritizing Firestore, with fallback to local cache
 */
export const getWorksheetsFromStorage = async (): Promise<WorksheetItem[]> => {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTION);
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items: WorksheetItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          qrCodeId: data.qrCodeId || '',
          title: data.title || '',
          gradeClass: data.gradeClass || 'STD 1',
          subject: data.subject || 'General',
          pdfUrl: data.pdfUrl || '',
          fileName: data.fileName,
        });
      });
      // Save to IndexedDB cache
      await set(DB_KEY, items).catch(() => {});
      return items;
    } else {
      // First time initialization: seed initial sample worksheets into Cloud Firestore
      await syncAllToFirestore(INITIAL_WORKSHEETS);
      return INITIAL_WORKSHEETS;
    }
  } catch (cloudError) {
    console.warn('Could not fetch from Firestore, falling back to local storage:', cloudError);
  }

  // Fallback to IndexedDB
  try {
    const saved = await get<WorksheetItem[]>(DB_KEY);
    if (saved && saved.length > 0) {
      return saved.map((item) => ({
        ...item,
        gradeClass: item.gradeClass || 'STD 1',
        subject: item.subject || 'General'
      }));
    }
  } catch (e) {
    console.error('Failed to load from IndexedDB', e);
  }

  // Fallback to localStorage
  try {
    const localSaved = localStorage.getItem(DB_KEY);
    if (localSaved) {
      const parsed = JSON.parse(localSaved);
      return parsed.map((item: any) => ({
        ...item,
        gradeClass: item.gradeClass || 'STD 1',
        subject: item.subject || 'General'
      }));
    }
  } catch (e) {
    console.error(e);
  }

  return INITIAL_WORKSHEETS;
};

/**
 * Sync single worksheet addition or update to Firestore
 */
export const saveSingleWorksheetToCloud = async (worksheet: WorksheetItem) => {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, worksheet.id);
    await setDoc(docRef, {
      id: worksheet.id,
      qrCodeId: worksheet.qrCodeId,
      title: worksheet.title,
      gradeClass: worksheet.gradeClass || 'STD 1',
      subject: worksheet.subject || 'General',
      pdfUrl: worksheet.pdfUrl,
      fileName: worksheet.fileName || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error saving to Firestore:', err);
  }
};

/**
 * Delete a worksheet from Firestore
 */
export const deleteWorksheetFromCloud = async (id: string) => {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting from Firestore:', err);
  }
};

/**
 * Batch sync full worksheet list to Firestore
 */
export const syncAllToFirestore = async (worksheets: WorksheetItem[]) => {
  try {
    const colRef = collection(db, FIRESTORE_COLLECTION);
    const snapshot = await getDocs(colRef);
    const newIds = new Set(worksheets.map((w) => w.id));

    // Delete items that are no longer in the list
    for (const docSnap of snapshot.docs) {
      if (!newIds.has(docSnap.id)) {
        await deleteDoc(docSnap.ref).catch(() => {});
      }
    }

    // Save/Update all items
    for (const ws of worksheets) {
      const docRef = doc(db, FIRESTORE_COLLECTION, ws.id);
      await setDoc(docRef, {
        id: ws.id,
        qrCodeId: ws.qrCodeId,
        title: ws.title,
        gradeClass: ws.gradeClass || 'STD 1',
        subject: ws.subject || 'General',
        pdfUrl: ws.pdfUrl,
        fileName: ws.fileName || '',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Failed to batch sync to Firestore:', err);
  }
};

/**
 * Save worksheets both locally and to Cloud Firestore
 */
export const saveWorksheetsToStorage = async (worksheets: WorksheetItem[]) => {
  // 1. Local IndexedDB Cache for offline resilience
  try {
    await set(DB_KEY, worksheets);
  } catch (e) {
    console.error('Failed to save to IndexedDB', e);
  }

  // 2. Local Storage Backup
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(worksheets));
  } catch (e) {
    // Large base64 PDFs might exceed localStorage quota; IndexedDB & Firestore handle this safely
  }

  // 3. Sync to Cloud Firestore for cross-device sharing
  syncAllToFirestore(worksheets).catch((err) => {
    console.warn('Cloud sync in progress or queued:', err);
  });
};
