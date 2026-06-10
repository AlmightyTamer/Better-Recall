import { db, type User } from '../db/db';
import { isMedicationDueSoon } from './schedule';
import { getSettings } from './settings';

let reminderInterval: ReturnType<typeof setInterval> | null = null;
const notifiedToday = new Set<string>();

function todayKey(medName: string): string {
  return `${new Date().toDateString()}-${medName}`;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showMedReminder(medName: string, dosage: string): void {
  if (!getSettings().medReminders) return;

  const title = `Time for ${medName}`;
  const body = `Please take ${dosage}. Open Recall to verify with your camera.`;

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/recall/favicon.svg', tag: todayKey(medName) });
  }
}

export function startMedReminderLoop(user: User | null): void {
  stopMedReminderLoop();
  if (!user?.id || !getSettings().medReminders) return;

  const check = () => {
    for (const med of user.medications) {
      if (!isMedicationDueSoon(med.schedule)) continue;
      const key = todayKey(med.name);
      if (notifiedToday.has(key)) continue;
      notifiedToday.add(key);
      showMedReminder(med.name, med.dosage);
    }
  };

  check();
  reminderInterval = setInterval(check, 60_000);
}

export function stopMedReminderLoop(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

export async function exportPatientData(userId: number): Promise<string> {
  const [user, events, logs, scores, alerts, anchors, contacts, routines, faces, journal] = await Promise.all([
    db.users.get(userId),
    db.events.where('userId').equals(userId).toArray(),
    db.medicationLogs.where('userId').equals(userId).toArray(),
    db.acseScores.where('userId').equals(userId).toArray(),
    db.supervisorAlerts.where('userId').equals(userId).toArray(),
    db.memoryAnchors.where('userId').equals(userId).toArray(),
    db.emergencyContacts.where('userId').equals(userId).toArray(),
    db.routineTasks.where('userId').equals(userId).toArray(),
    db.familiarFaces.where('userId').equals(userId).toArray(),
    db.careJournal.where('userId').equals(userId).toArray(),
  ]);

  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    user,
    events,
    medicationLogs: logs,
    acseScores: scores,
    supervisorAlerts: alerts,
    memoryAnchors: anchors,
    emergencyContacts: contacts,
    routineTasks: routines,
    familiarFaces: faces,
    careJournal: journal,
  }, null, 2);
}

export function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
