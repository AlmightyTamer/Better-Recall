const EVENTS_KEY = 'recall_routine_events';

export interface RoutineEvent {
  id: string;
  name: string;
  time: string;
}

export function loadRoutineEvents(): RoutineEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RoutineEvent[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

export function addRoutineEvent(name: string, time: string): RoutineEvent {
  const events = loadRoutineEvents();
  const event: RoutineEvent = {
    id: `routine-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    time: time.trim(),
  };
  events.push(event);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  // Notify other tabs / components
  window.dispatchEvent(new Event('storage'));
  return event;
}

/** Parse "add X at Y to my routine" → { name, time } */
export function parseRoutineUtterance(text: string): { name: string; time: string } | null {
  // "remind me to X at Y" / "add X at Y to my routine" / "schedule X at Y"
  const atMatch = text.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  const time = atMatch ? atMatch[1].trim() : '';

  // Strip common prefixes and the time part
  let name = text
    .replace(/^(add|remind me to|put|schedule)\s+/i, '')
    .replace(/\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i, '')
    .replace(/\s+(to|on)\s+(my\s+)?(routine|schedule|list).*$/i, '')
    .trim();

  if (!name) return null;
  // Capitalise first letter
  name = name.charAt(0).toUpperCase() + name.slice(1);
  return { name, time: time || '' };
}

export function todayRoutineKey(): string {
  return `recall_routine_done_${new Date().toDateString()}`;
}

export function loadTodayCompletions(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(todayRoutineKey());
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch { /* ignore */ }
  return {};
}
