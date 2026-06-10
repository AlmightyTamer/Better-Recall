import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { startMedReminderLoop, stopMedReminderLoop } from '../lib/notifications';

export function useMedReminders(): void {
  const user = useAppStore((s) => s.user);
  const screen = useAppStore((s) => s.screen);

  useEffect(() => {
    if (screen === 'patient' && user) {
      startMedReminderLoop(user);
    } else {
      stopMedReminderLoop();
    }
    return () => stopMedReminderLoop();
  }, [user, screen]);
}
