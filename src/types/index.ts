import { Timestamp } from 'firebase/firestore';

export type FrequencyBandId = 'sub' | 'low' | 'lowMid' | 'mid' | 'highMid' | 'high';
export type BandVerdict = 'too_much' | 'just_right' | 'too_little' | null;

export interface FrequencyBand {
  id: FrequencyBandId;
  label: string;
  range: string;
  verdict: BandVerdict;
  notes: string;
}

export const DEFAULT_BANDS: FrequencyBand[] = [
  { id: 'sub', label: 'Sub', range: '20–60 Hz', verdict: null, notes: '' },
  { id: 'low', label: 'Low', range: '60–250 Hz', verdict: null, notes: '' },
  { id: 'lowMid', label: 'Low-Mid', range: '250–500 Hz', verdict: null, notes: '' },
  { id: 'mid', label: 'Mid', range: '500 Hz–2 kHz', verdict: null, notes: '' },
  { id: 'highMid', label: 'High-Mid', range: '2–8 kHz', verdict: null, notes: '' },
  { id: 'high', label: 'High', range: '8 kHz+', verdict: null, notes: '' },
];

export interface FeedbackEntry {
  id?: string;
  timestamp: number;
  reviewerName: string;
  comment: string;
  rating: number;
  volumeDb: number;
  bands: FrequencyBand[];
  createdAt?: Timestamp;
  read?: boolean;
  readSections?: {
    volume?: boolean;
    frequencies?: boolean;
  };
}

export interface Track {
  id: string;
  ownerId: string;
  title: string;
  fileName: string;
  storagePath: string;
  downloadURL: string;
  duration?: number;
  fileSize?: number;
  feedbackCount: number;
  unreadCount?: number;
  createdAt: Timestamp;
}

export interface UserDoc {
  storageUsed: number;
}
