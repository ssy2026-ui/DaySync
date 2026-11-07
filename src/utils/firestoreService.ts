import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  getDocFromServer,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DaySchedule, ScheduleTemplate } from '../types';
import { DEFAULT_TEMPLATES } from './storage';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
    return 'Permission denied: Please ensure you are signed in to save to your personal cloud schedule.';
  }
  if (msg.includes('unavailable') || msg.includes('offline') || msg.includes('network')) {
    return 'Network unavailable: Your changes are cached locally and will sync when you are back online.';
  }
  if (msg.includes('resource-exhausted')) {
    return 'Cloud storage quota exceeded. Please wait a few moments and try again.';
  }
  return msg;
}

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
    }
  }
}
testConnection();

// Load all schedules for a specific user
export async function loadUserSchedulesFromFirestore(
  userId: string
): Promise<Record<string, DaySchedule>> {
  const path = `users/${userId}/schedules`;
  try {
    const colRef = collection(db, 'users', userId, 'schedules');
    const snap = await getDocs(colRef);
    const result: Record<string, DaySchedule> = {};

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const dateKey = data.date || docSnap.id;
      result[dateKey] = {
        date: dateKey,
        templateId: data.templateId || undefined,
        templateName: data.templateName || undefined,
        ruleOfThree: Array.isArray(data.ruleOfThree)
          ? data.ruleOfThree.map((r: any) => ({
              id: r.id || `mit-${Math.random().toString(36).slice(2, 6)}`,
              title: r.title || '',
              category: r.category === 'work' ? 'work' : 'school',
              completed: Boolean(r.completed),
              notes: r.notes || undefined,
              assignedBlockId: r.assignedBlockId || undefined
            }))
          : [],
        blocks: Array.isArray(data.blocks)
          ? data.blocks.map((b: any) => ({
              id: b.id || `blk-${Math.random().toString(36).slice(2, 6)}`,
              title: b.title || 'Focus Block',
              startTime: b.startTime || '09:00',
              endTime: b.endTime || '10:00',
              category: b.category || 'work',
              isFlexible: Boolean(b.isFlexible),
              subtasks: Array.isArray(b.subtasks)
                ? b.subtasks.map((s: any) => ({
                    id: s.id || `task-${Math.random().toString(36).slice(2, 6)}`,
                    title: s.title || '',
                    completed: Boolean(s.completed),
                    category: s.category === 'school' ? 'school' : 'work'
                  }))
                : []
            }))
          : [],
        dayNotes: data.dayNotes || undefined
      };
    });

    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return {};
  }
}

// Save a day schedule for a specific user
export async function saveUserScheduleToFirestore(
  userId: string,
  schedule: DaySchedule
): Promise<void> {
  const path = `users/${userId}/schedules/${schedule.date}`;
  try {
    const docRef = doc(db, 'users', userId, 'schedules', schedule.date);
    // Explicitly sanitize to ensure no undefined values are sent to Firestore
    const payload = {
      date: schedule.date,
      userId,
      templateId: schedule.templateId || null,
      templateName: schedule.templateName || null,
      ruleOfThree: (schedule.ruleOfThree || []).map(r => ({
        id: r.id,
        title: r.title || '',
        category: r.category,
        completed: Boolean(r.completed),
        notes: r.notes || null,
        assignedBlockId: r.assignedBlockId || null
      })),
      blocks: (schedule.blocks || []).map(b => ({
        id: b.id,
        title: b.title || '',
        startTime: b.startTime || '09:00',
        endTime: b.endTime || '10:00',
        category: b.category,
        isFlexible: Boolean(b.isFlexible),
        subtasks: (b.subtasks || []).map(s => ({
          id: s.id,
          title: s.title || '',
          completed: Boolean(s.completed),
          category: s.category
        }))
      })),
      dayNotes: schedule.dayNotes || null,
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Load all templates for a specific user (or initialize defaults if empty)
export async function loadUserTemplatesFromFirestore(
  userId: string
): Promise<ScheduleTemplate[]> {
  const path = `users/${userId}/templates`;
  try {
    const colRef = collection(db, 'users', userId, 'templates');
    const snap = await getDocs(colRef);

    if (snap.empty) {
      // First-time user setup: seed default templates into their private Firestore
      const seeded: ScheduleTemplate[] = [];
      for (const tpl of DEFAULT_TEMPLATES) {
        await saveUserTemplateToFirestore(userId, tpl);
        seeded.push(tpl);
      }
      return seeded;
    }

    const templates: ScheduleTemplate[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      templates.push({
        id: data.id,
        name: data.name,
        description: data.description,
        type: data.type,
        blocks: data.blocks || []
      });
    });

    return templates;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return DEFAULT_TEMPLATES;
  }
}

// Save a template for a specific user
export async function saveUserTemplateToFirestore(
  userId: string,
  template: ScheduleTemplate
): Promise<void> {
  const path = `users/${userId}/templates/${template.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'templates', template.id);
    await setDoc(docRef, {
      id: template.id,
      userId,
      name: template.name,
      description: template.description || '',
      type: template.type,
      blocks: (template.blocks || []).map(b => ({
        id: b.id,
        title: b.title || '',
        startTime: b.startTime || '09:00',
        endTime: b.endTime || '10:00',
        category: b.category || 'work',
        isFlexible: Boolean(b.isFlexible),
        defaultSubtaskTitles: b.defaultSubtaskTitles || []
      })),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a template for a specific user
export async function deleteUserTemplateFromFirestore(
  userId: string,
  templateId: string
): Promise<void> {
  const path = `users/${userId}/templates/${templateId}`;
  try {
    const docRef = doc(db, 'users', userId, 'templates', templateId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
