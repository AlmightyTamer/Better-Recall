import type { CognitiveGameId } from '../db/db';

export type RoutineTemplate = {
  label: string;
  period: 'morning' | 'afternoon' | 'evening';
  sortOrder: number;
  gameId?: CognitiveGameId;
};

export const DEFAULT_ROUTINES: RoutineTemplate[] = [
  { label: 'Brush teeth', period: 'morning', sortOrder: 0 },
  { label: 'Take morning medication', period: 'morning', sortOrder: 1 },
  { label: 'Eat breakfast', period: 'morning', sortOrder: 2 },
  { label: 'Morning walk or stretch', period: 'morning', sortOrder: 3 },
  { label: 'Daily Word puzzle', period: 'morning', sortOrder: 4, gameId: 'wordle' },
  { label: 'Afternoon rest or activity', period: 'afternoon', sortOrder: 0 },
  { label: 'Hydrate and snack', period: 'afternoon', sortOrder: 1 },
  { label: 'Sudoku challenge', period: 'afternoon', sortOrder: 2, gameId: 'sudoku' },
  { label: 'Word connections', period: 'afternoon', sortOrder: 3, gameId: 'connections' },
  { label: 'Eat dinner', period: 'evening', sortOrder: 0 },
  { label: 'Take evening medication', period: 'evening', sortOrder: 1 },
  { label: 'Prepare for bed', period: 'evening', sortOrder: 2 },
  { label: "Log last night's sleep", period: 'morning', sortOrder: 5 },
];

export const GAME_ROUTINE_LABELS = new Set(
  DEFAULT_ROUTINES.filter((r) => r.gameId).map((r) => r.label)
);
