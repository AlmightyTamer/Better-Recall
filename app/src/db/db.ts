import Dexie, { type Table } from 'dexie';
import { FAMILY_PHOTOS } from '../lib/assets';

export interface User {
  id?: number;
  name: string;
  age: number;
  city: string;
  homeAddress?: string;
  caregiverName: string;
  caregiverRelationship: string;
  caregiverPhone?: string;
  familyPhotoUrl?: string;
  calmingMusicUrl?: string;
  emergencyNote?: string;
  patientPin?: string;
  onboardingComplete?: boolean;
  medications: Medication[];
  createdAt: string;
}

export interface Medication {
  name: string;
  dosage: string;
  schedule: string[];
}

export interface Event {
  id?: number;
  userId: number;
  timestamp: string;
  type: 'user_action' | 'planned' | 'caregiver_input' | 'system_alert';
  title: string;
  description: string;
  completed: boolean;
  source: string;
}

export interface MedicationLog {
  id?: number;
  userId: number;
  medicationName: string;
  timestamp: string;
  visionConfidence: 'high' | 'medium' | 'low' | 'manual' | 'unconfirmed';
  visionDescription: string;
  imageThumbnail?: string;
  confirmed: boolean;
}

export interface AcseScore {
  id?: number;
  userId: number;
  score: number;
  timestamp: string;
  reason?: string;
}

export interface SupervisorAlertRecord {
  id?: number;
  userId: number;
  message: string;
  timestamp: string;
  type: 'comfort_mode' | 'medication_unconfirmed' | 'general' | 'presence' | 'sos';
  dismissed: boolean;
}

export interface MemoryAnchorRecord {
  id?: number;
  userId: number;
  title: string;
  emoji: string;
  anchorText: string;
  speakText: string;
  generatedAt: string;
}

export interface EmergencyContact {
  id?: number;
  userId: number;
  name: string;
  relationship: string;
  phone: string;
  isPrimary?: boolean;
}

export type CognitiveGameId = 'wordle' | 'sudoku' | 'connections';

export interface RoutineTask {
  id?: number;
  userId: number;
  label: string;
  period: 'morning' | 'afternoon' | 'evening';
  sortOrder: number;
  completedAt?: string;
  gameId?: CognitiveGameId;
}

export interface SleepLog {
  id?: number;
  userId: number;
  /** Calendar date of the night (YYYY-MM-DD) */
  date: string;
  bedTime: string;
  wakeTime: string;
  quality: 1 | 2 | 3 | 4 | 5;
  awakenings: number;
  notes?: string;
  loggedBy: 'patient' | 'caregiver' | 'apple_watch';
}

export interface FamiliarFace {
  id?: number;
  userId: number;
  name: string;
  relationship: string;
  photoUrl: string;
  memoryPrompt: string;
}

export interface CareJournalEntry {
  id?: number;
  userId: number;
  timestamp: string;
  mood: 'great' | 'good' | 'okay' | 'difficult';
  note: string;
  author: string;
}

class RecallDB extends Dexie {
  users!: Table<User>;
  events!: Table<Event>;
  medicationLogs!: Table<MedicationLog>;
  acseScores!: Table<AcseScore>;
  supervisorAlerts!: Table<SupervisorAlertRecord>;
  memoryAnchors!: Table<MemoryAnchorRecord>;
  emergencyContacts!: Table<EmergencyContact>;
  routineTasks!: Table<RoutineTask>;
  familiarFaces!: Table<FamiliarFace>;
  careJournal!: Table<CareJournalEntry>;
  sleepLogs!: Table<SleepLog>;

  constructor() {
    super('RecallDB');
    this.version(1).stores({
      users: '++id, name',
      events: '++id, userId, timestamp, type, completed',
      medicationLogs: '++id, userId, medicationName, timestamp',
      acseScores: '++id, userId, timestamp',
    });
    this.version(2).stores({
      users: '++id, name',
      events: '++id, userId, timestamp, type, completed',
      medicationLogs: '++id, userId, medicationName, timestamp',
      acseScores: '++id, userId, timestamp',
      supervisorAlerts: '++id, userId, timestamp, dismissed',
      memoryAnchors: '++id, userId, generatedAt',
    });
    this.version(3).stores({
      users: '++id, name',
      events: '++id, userId, timestamp, type, completed',
      medicationLogs: '++id, userId, medicationName, timestamp',
      acseScores: '++id, userId, timestamp',
      supervisorAlerts: '++id, userId, timestamp, dismissed',
      memoryAnchors: '++id, userId, generatedAt',
      emergencyContacts: '++id, userId',
      routineTasks: '++id, userId, period',
      familiarFaces: '++id, userId',
      careJournal: '++id, userId, timestamp',
    });
    this.version(4).stores({
      users: '++id, name',
      events: '++id, userId, timestamp, type, completed',
      medicationLogs: '++id, userId, medicationName, timestamp',
      acseScores: '++id, userId, timestamp',
      supervisorAlerts: '++id, userId, timestamp, dismissed',
      memoryAnchors: '++id, userId, generatedAt',
      emergencyContacts: '++id, userId',
      routineTasks: '++id, userId, period',
      familiarFaces: '++id, userId',
      careJournal: '++id, userId, timestamp',
      sleepLogs: '++id, userId, date',
    });
    this.version(5).stores({
      users: '++id, name',
      events: '++id, userId, timestamp, type, completed',
      medicationLogs: '++id, userId, medicationName, timestamp',
      acseScores: '++id, userId, timestamp',
      supervisorAlerts: '++id, userId, timestamp, dismissed',
      memoryAnchors: '++id, userId, generatedAt',
      emergencyContacts: '++id, userId',
      routineTasks: '++id, userId, period',
      familiarFaces: '++id, userId',
      careJournal: '++id, userId, timestamp',
      sleepLogs: '++id, userId, date',
    }).upgrade(async (tx) => {
      const faces = await tx.table('familiarFaces').toArray();
      for (const face of faces) {
        const key = face.name.trim().toLowerCase() as keyof typeof FAMILY_PHOTOS;
        const photo = FAMILY_PHOTOS[key];
        if (photo && face.photoUrl !== photo) {
          await tx.table('familiarFaces').update(face.id, { photoUrl: photo });
        }
      }

      const contacts = await tx.table('emergencyContacts').toArray();
      for (const contact of contacts) {
        if (contact.name.trim().toLowerCase() !== 'susan') continue;
        const user = await tx.table('users').get(contact.userId);
        if (user?.caregiverName?.trim().toLowerCase() === 'susan') {
          await tx.table('emergencyContacts').update(contact.id, {
            name: 'Robert',
            relationship: 'Grandson',
            phone: '+15555550187',
            isPrimary: false,
          });
        }
      }
    });
    this.version(6).stores({
      users: '++id, name',
      events: '++id, userId, timestamp, type, completed',
      medicationLogs: '++id, userId, medicationName, timestamp',
      acseScores: '++id, userId, timestamp',
      supervisorAlerts: '++id, userId, timestamp, dismissed',
      memoryAnchors: '++id, userId, generatedAt',
      emergencyContacts: '++id, userId',
      routineTasks: '++id, userId, period',
      familiarFaces: '++id, userId',
      careJournal: '++id, userId, timestamp',
      sleepLogs: '++id, userId, date',
    }).upgrade(async (tx) => {
      const faces = await tx.table('familiarFaces').toArray();
      for (const face of faces) {
        const key = face.name.trim().toLowerCase() as keyof typeof FAMILY_PHOTOS;
        const photo = FAMILY_PHOTOS[key];
        if (photo) await tx.table('familiarFaces').update(face.id, { photoUrl: photo });
      }

      const users = await tx.table('users').toArray();
      for (const user of users) {
        if (user.name !== 'Margaret' || !user.id) continue;
        const contacts = await tx.table('emergencyContacts').where('userId').equals(user.id).toArray();
        const caregiverPhone = (user.caregiverPhone ?? '').replace(/\D/g, '');
        const caregiverName = user.caregiverName?.trim().toLowerCase() ?? '';

        for (const contact of contacts) {
          const sameName = contact.name.trim().toLowerCase() === caregiverName;
          const samePhone = contact.phone.replace(/\D/g, '') === caregiverPhone;
          if (sameName || samePhone) {
            await tx.table('emergencyContacts').delete(contact.id!);
          }
        }

        const remaining = await tx.table('emergencyContacts').where('userId').equals(user.id).toArray();
        const hasRobert = remaining.some((c) => c.name.trim().toLowerCase() === 'robert');
        if (!hasRobert) {
          await tx.table('emergencyContacts').add({
            userId: user.id,
            name: 'Robert',
            relationship: 'Grandson',
            phone: '+15555550187',
            isPrimary: false,
          });
        }
      }
    });
  }
}

export const db = new RecallDB();
