import { create } from 'zustand';
import type { User } from '../db/db';
import { db } from '../db/db';
import { getStoredTheme, persistTheme, type ThemeMode } from '../lib/theme';
import { preloadFlowers } from '../flowers';

export type AppScreen = 'loading' | 'login' | 'patient' | 'supervisor';

interface SupervisorAlert {
  id: string;
  message: string;
  timestamp: string;
  type: 'comfort_mode' | 'medication_unconfirmed' | 'general' | 'sos' | 'presence';
}

interface AppState {
  screen: AppScreen;
  user: User | null;
  acseScore: number;
  comfortModeActive: boolean;
  supervisorAlerts: SupervisorAlert[];
  isZooming: boolean;
  theme: ThemeMode;

  setScreen: (screen: AppScreen) => void;
  setUser: (user: User) => void;
  setAcseScore: (score: number) => void;
  deductAcse: (points: number, reason: string) => void;
  activateComfortMode: () => void;
  deactivateComfortMode: () => void;
  addSupervisorAlert: (alert: Omit<SupervisorAlert, 'id'> & { persist?: boolean }) => void;
  clearSupervisorAlert: (id: string) => void;
  setIsZooming: (v: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  resetSession: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'loading',
  user: null,
  acseScore: 100,
  comfortModeActive: false,
  supervisorAlerts: [],
  isZooming: false,
  theme: getStoredTheme(),

  setScreen: (screen) => set({ screen }),
  setUser: (user) => set({ user }),
  setAcseScore: (score) => {
    set({ acseScore: score });
    const user = get().user;
    if (user?.id) {
      db.acseScores.add({
        userId: user.id,
        score,
        timestamp: new Date().toISOString(),
        reason: 'Manual reset',
      }).catch(console.error);
    }
  },

  deductAcse: (points, reason) => {
    const current = get().acseScore;
    const next = Math.max(0, current - points);
    set({ acseScore: next });

    if (next < 50 && !get().comfortModeActive) {
      get().activateComfortMode();
    }

    const user = get().user;
    if (user?.id) {
      db.acseScores.add({
        userId: user.id,
        score: next,
        timestamp: new Date().toISOString(),
        reason,
      }).catch(console.error);
    }
  },

  activateComfortMode: () => {
    const user = get().user;
    set({ comfortModeActive: true });

    get().addSupervisorAlert({
      message: `Comfort Mode activated at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: new Date().toISOString(),
      type: 'comfort_mode',
      persist: true,
    });

    if (user?.id) {
      db.events.add({
        userId: user.id,
        timestamp: new Date().toISOString(),
        type: 'system_alert',
        title: 'Comfort Mode activated',
        description: `Comfort Mode activated at ${new Date().toLocaleTimeString()}. ACSE score dropped below 50.`,
        completed: true,
        source: 'system',
      }).catch(console.error);
    }
  },

  deactivateComfortMode: () => {
    set({ comfortModeActive: false, acseScore: 70 });
    const user = get().user;
    if (user?.id) {
      db.acseScores.add({
        userId: user.id,
        score: 70,
        timestamp: new Date().toISOString(),
        reason: 'Comfort Mode completed',
      }).catch(console.error);
    }
  },

  addSupervisorAlert: (alert) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => ({
      supervisorAlerts: [{ ...alert, id }, ...state.supervisorAlerts],
    }));

    const user = get().user;
    if (alert.persist !== false && user?.id) {
      db.supervisorAlerts.add({
        userId: user.id,
        message: alert.message,
        timestamp: alert.timestamp,
        type: alert.type,
        dismissed: false,
      }).catch(console.error);
    }
  },

  clearSupervisorAlert: (id) => {
    set((state) => ({
      supervisorAlerts: state.supervisorAlerts.filter((a) => a.id !== id),
    }));
    const numericId = Number(id);
    if (!Number.isNaN(numericId)) {
      db.supervisorAlerts.update(numericId, { dismissed: true }).catch(console.error);
    }
  },

  setIsZooming: (v) => set({ isZooming: v }),

  setTheme: (theme) => {
    persistTheme(theme);
    preloadFlowers(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    persistTheme(next);
    preloadFlowers(next);
    set({ theme: next });
  },

  resetSession: () =>
    set({
      screen: 'login',
      user: null,
      acseScore: 100,
      comfortModeActive: false,
      supervisorAlerts: [],
      isZooming: false,
    }),
}));
