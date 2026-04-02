import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  increment,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './config';
import type { Track, FeedbackEntry } from '../types';
import { logError } from '../utils/errorHandler';

export const createTrack = async (
  trackId: string,
  data: Omit<Track, 'id' | 'feedbackCount' | 'createdAt'>
): Promise<void> => {
  const batch = writeBatch(db);
  batch.set(doc(db, 'tracks', trackId), {
    ...data,
    feedbackCount: 0,
    createdAt: serverTimestamp(),
  });
  if (data.fileSize && data.ownerId) {
    batch.set(
      doc(db, 'users', data.ownerId),
      { storageUsed: increment(data.fileSize) },
      { merge: true }
    );
  }
  await batch.commit();
};

export const updateTrackDuration = async (trackId: string, duration: number): Promise<void> => {
  await updateDoc(doc(db, 'tracks', trackId), { duration });
};

export const updateTrackTitle = async (trackId: string, title: string): Promise<void> => {
  await updateDoc(doc(db, 'tracks', trackId), { title });
};

export const deleteTrack = async (trackId: string, ownerId?: string, fileSize?: number): Promise<void> => {
  const feedbackSnap = await getDocs(collection(db, 'tracks', trackId, 'feedback'));
  const batch = writeBatch(db);
  feedbackSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'tracks', trackId));
  if (ownerId && fileSize) {
    batch.set(
      doc(db, 'users', ownerId),
      { storageUsed: increment(-fileSize) },
      { merge: true }
    );
  }
  await batch.commit();
};

export const getUserStorageUsed = async (uid: string): Promise<number> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return 0;
  return (snap.data().storageUsed as number) ?? 0;
};

export const updateTrackFileSize = async (
  trackId: string,
  uid: string,
  fileSize: number
): Promise<void> => {
  const batch = writeBatch(db);
  batch.update(doc(db, 'tracks', trackId), { fileSize });
  batch.set(doc(db, 'users', uid), { storageUsed: increment(fileSize) }, { merge: true });
  await batch.commit();
};

export const getTrack = async (trackId: string): Promise<Track | null> => {
  const snap = await getDoc(doc(db, 'tracks', trackId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Track;
};

export const getUserTracks = async (uid: string): Promise<Track[]> => {
  const q = query(
    collection(db, 'tracks'),
    where('ownerId', '==', uid)
  );
  const snap = await getDocs(q);
  const tracks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Track));
  return tracks.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
};

export const addFeedback = async (
  trackId: string,
  feedback: Omit<FeedbackEntry, 'id' | 'createdAt'>
): Promise<string> => {
  const batch = writeBatch(db);

  const feedbackRef = doc(collection(db, 'tracks', trackId, 'feedback'));
  batch.set(feedbackRef, {
    ...feedback,
    createdAt: serverTimestamp(),
  });

  const trackRef = doc(db, 'tracks', trackId);
  batch.update(trackRef, { feedbackCount: increment(1), unreadCount: increment(1) });

  await batch.commit();
  return feedbackRef.id;
};

export const saveOwnerNotes = async (
  trackId: string,
  feedbackId: string,
  notes: { id: string; text: string; checked: boolean }[]
): Promise<void> => {
  await updateDoc(doc(db, 'tracks', trackId, 'feedback', feedbackId), {
    ownerNotes: notes,
  });
};

export const deleteFeedback = async (trackId: string, feedbackId: string): Promise<void> => {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'tracks', trackId, 'feedback', feedbackId));
  batch.update(doc(db, 'tracks', trackId), { feedbackCount: increment(-1) });
  await batch.commit();
};

export const markFeedbackSectionRead = async (
  trackId: string,
  feedbackId: string,
  section: 'instruments' | 'frequencies',
  read: boolean
): Promise<void> => {
  await updateDoc(doc(db, 'tracks', trackId, 'feedback', feedbackId), {
    [`readSections.${section}`]: read,
  });
};

export const markFeedbackRead = async (
  trackId: string,
  feedbackId: string,
  read: boolean
): Promise<void> => {
  const batch = writeBatch(db);
  batch.update(doc(db, 'tracks', trackId, 'feedback', feedbackId), { read });
  batch.update(doc(db, 'tracks', trackId), { unreadCount: increment(read ? -1 : 1) });
  await batch.commit();
};

export const subscribeFeedback = (
  trackId: string,
  callback: (entries: FeedbackEntry[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'tracks', trackId, 'feedback'),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as FeedbackEntry));
    callback(entries);
  }, (error) => {
    logError(error, 'subscribeFeedback');
    callback([]);
  });
};

