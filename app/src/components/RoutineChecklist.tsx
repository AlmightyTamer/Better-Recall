import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CognitiveGameId, type RoutineTask } from '../db/db';
import { useAppStore } from '../store/appStore';
import StudioIcon from './StudioIcon';
import { GameLauncher } from './games/GameHub';

const PERIOD_ORDER: RoutineTask['period'][] = ['morning', 'afternoon', 'evening'];

const PERIOD_LABELS: Record<RoutineTask['period'], string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

const GAME_ICONS: Record<CognitiveGameId, string> = {
  wordle: 'W',
  sudoku: 'S',
  connections: 'C',
};

function isDoneToday(completedAt?: string): boolean {
  if (!completedAt) return false;
  return new Date(completedAt).toDateString() === new Date().toDateString();
}

export default function RoutineChecklist() {
  const { user } = useAppStore();
  const [activeGame, setActiveGame] = useState<CognitiveGameId | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const tasks = useLiveQuery<RoutineTask[]>(
    () =>
      user?.id
        ? db.routineTasks.where('userId').equals(user.id).sortBy('sortOrder')
        : Promise.resolve([]),
    [user?.id]
  ) ?? [];

  const grouped = useMemo(() => {
    const map = new Map<RoutineTask['period'], RoutineTask[]>();
    for (const period of PERIOD_ORDER) map.set(period, []);
    for (const task of tasks) {
      const list = map.get(task.period) ?? [];
      list.push(task);
      map.set(task.period, list);
    }
    return PERIOD_ORDER.map((period) => ({
      period,
      label: PERIOD_LABELS[period],
      tasks: (map.get(period) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    })).filter((g) => g.tasks.length > 0);
  }, [tasks]);

  const markDone = async (taskId: number) => {
    await db.routineTasks.update(taskId, { completedAt: new Date().toISOString() });
  };

  const toggle = async (task: RoutineTask) => {
    if (!task.id) return;
    if (task.gameId) {
      setActiveGame(task.gameId);
      setActiveTaskId(task.id);
      return;
    }
    const doneToday = isDoneToday(task.completedAt);
    await db.routineTasks.update(task.id, {
      completedAt: doneToday ? undefined : new Date().toISOString(),
    });
  };

  const handleGameComplete = async () => {
    if (activeTaskId) await markDone(activeTaskId);
    setActiveGame(null);
    setActiveTaskId(null);
  };

  const doneCount = tasks.filter((t) => isDoneToday(t.completedAt)).length;
  const progress = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

  if (!user?.id) {
    return (
      <div className="studio-scroll" style={{ padding: 16 }}>
        <p className="studio-empty-note">Sign in to see your routine.</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="studio-scroll" style={{ padding: 16 }}>
        <h2 className="studio-page-title">Daily Routine</h2>
        <p className="studio-empty-note">No routine items yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="studio-scroll simple-routine" style={{ padding: '16px 16px 40px' }}>
        <h2 className="studio-page-title" style={{ marginBottom: 4 }}>Daily Routine</h2>
        <p style={{ fontSize: 14, color: 'var(--studio-text-muted)', marginBottom: 16 }}>
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--studio-text-bright)' }}>
              {doneCount} of {tasks.length} completed
            </span>
            <span style={{ fontSize: 13, color: 'var(--studio-accent)', fontWeight: 700 }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 8, background: 'var(--studio-progress-track)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--fm-blue-deep, #2E6DB4), var(--fm-blue, #4A90D9))',
                borderRadius: 8,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {grouped.map(({ period, label, tasks: periodTasks }) => (
          <section key={period} className="routine-checklist card" style={{ marginBottom: 14 }}>
            <div className="routine-checklist__header">
              <StudioIcon name="routine" size={20} />
              <h3 className="routine-checklist__title">{label}</h3>
            </div>
            <ul className="routine-checklist__list">
              {periodTasks.map((task) => {
                const done = isDoneToday(task.completedAt);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      className={`routine-item tap-feedback ${done ? 'routine-item--done' : ''} ${task.gameId ? 'routine-item--game' : ''}`}
                      onClick={() => void toggle(task)}
                      aria-pressed={!!done}
                    >
                      <span className="routine-item__check">
                        {task.gameId ? (
                          <span className="routine-item__game-icon">{GAME_ICONS[task.gameId]}</span>
                        ) : (
                          <StudioIcon name={done ? 'check' : 'circle'} size={20} />
                        )}
                      </span>
                      <span className="routine-item__label">
                        {task.label}
                        {task.gameId && !done && (
                          <span className="routine-item__play-tag">Tap to play</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {doneCount === tasks.length && tasks.length > 0 && (
          <div
            style={{
              marginTop: 8,
              padding: '16px 20px',
              borderRadius: 16,
              background: 'rgba(76,175,80,0.10)',
              border: '1.5px solid rgba(76,175,80,0.25)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 18, fontWeight: 700, color: '#4CAF50', margin: '0 0 4px' }}>
              All done!
            </p>
            <p style={{ fontSize: 14, color: 'var(--studio-text-muted)', margin: 0 }}>
              Wonderful job completing your routine today.
            </p>
          </div>
        )}
      </div>

      {activeGame && (
        <GameLauncher
          gameId={activeGame}
          onClose={() => {
            setActiveGame(null);
            setActiveTaskId(null);
          }}
          onComplete={() => void handleGameComplete()}
        />
      )}
    </>
  );
}

/** Mark a game routine complete when launched from the Games tab */
export async function markGameRoutineComplete(userId: number, gameId: CognitiveGameId): Promise<void> {
  const tasks = await db.routineTasks.where('userId').equals(userId).toArray();
  const match = tasks.find((t) => t.gameId === gameId && !isDoneToday(t.completedAt));
  if (match?.id) {
    await db.routineTasks.update(match.id, { completedAt: new Date().toISOString() });
  }
}
