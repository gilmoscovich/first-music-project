import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export const uploadAudio = (
  uid: string,
  trackId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<{ downloadURL: string; storagePath: string }> => {
  return new Promise((resolve, reject) => {
    const storagePath = `tracks/${uid}/${trackId}/${file.name}`;
    const storageRef = ref(storage, storagePath);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      (snapshot) => {
        onProgress(snapshot.bytesTransferred / snapshot.totalBytes);
      },
      reject,
      async () => {
        try {
          const downloadURL = await getDownloadURL(storageRef);
          resolve({ downloadURL, storagePath });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

export const deleteAudio = async (storagePath: string): Promise<void> => {
  try {
    await deleteObject(ref(storage, storagePath));
  } catch {
    // File may already be deleted — ignore
  }
};
