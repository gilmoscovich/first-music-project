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

export type InstrumentGroupId = 'kick' | 'bass' | 'percussions' | 'synths' | 'vocals' | 'fx';

export interface InstrumentGroup {
  id: InstrumentGroupId;
  label: string;
  notes: string;
}

export const DEFAULT_INSTRUMENTS: InstrumentGroup[] = [
  { id: 'kick',        label: 'Kick',        notes: '' },
  { id: 'bass',        label: 'Bass',        notes: '' },
  { id: 'percussions', label: 'Percussions', notes: '' },
  { id: 'synths',      label: 'Synths',      notes: '' },
  { id: 'vocals',      label: 'Vocals',      notes: '' },
  { id: 'fx',          label: 'FX',          notes: '' },
];

export interface FeedbackEntry {
  id?: string;
  timestamp: number;
  reviewerName: string;
  comment: string;
  instruments: InstrumentGroup[];
  bands: FrequencyBand[];
  createdAt?: Timestamp;
  read?: boolean;
  readSections?: {
    instruments?: boolean;
    frequencies?: boolean;
  };
  ownerNotes?: { id: string; text: string; checked: boolean }[];
  // Legacy field — kept for reading old entries
  volumeDb?: number;
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
  peaks?: number[][];
  feedbackCount: number;
  unreadCount?: number;
  createdAt: Timestamp;
}

export interface UserDoc {
  storageUsed: number;
}

export const VERDICT_LABEL: Record<NonNullable<BandVerdict>, string> = {
  too_much:   'Too Much',
  just_right: 'Just Right',
  too_little: 'Too Little',
};
