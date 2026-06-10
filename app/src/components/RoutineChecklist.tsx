import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RoutineTask } from '../db/db';
import { useAppStore } from '../store/appStore';
import StudioIcon from './StudioIcon';

function currentPeriod(): RoutineTask['period'] {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const PERIOD_LABELS: Record<RoutineTask['period'], string> = {
  morning: 'Morning routine',
  afternoon: 'Afternoon routine',
  evening: 'Evening routine',
};

export default function RoutineChecklist() {
  const { user } = useAppStore();
  const period = currentPeriod();
  const today = new Date().toDateString();

  const tasks = useLiveQuery<RoutineTask[]>(
    () =>
      user?.id
        ? db.routineTasks.where('userId').equals(user.id).and((t) => t.period === period).sortBy('sortOrder')
        : Promise.resolve([]),
    [user?.id, period]
  ) ?? [];

  if (!user?.id || tasks.length === 0) return null;

  const toggle = async (task: RoutineTask) => {
    if (!task.id) return;
    const doneToday = task.completedAt && new Date(task.completedAt).toDateString() === today;
    await db.routineTasks.update(task.id, {
      completedAt: doneToday ? undefined : new Date().toISOString(),
    });
  };

  const doneCount = tasks.filter(
    (t) => t.completedAt && new Date(t.completedAt).toDateString() === today
  ).length;

  return (
    <section className="routine-checklist card">
      <div className="routine-checklist__header">
        <StudioIcon name="routine" size={22} />
        <div>
          <h3 className="routine-checklist__title">{PERIOD_LABELS[period]}</h3>
          <p className="routine-checklist__progress">{doneCount} of {tasks.length} done</p>
        </div>
      </div>
      <ul className="routine-checklist__list">
        {tasks.map((task) => {
          const done = task.completedAt && new Date(task.completedAt).toDateString() === today;
          return (
            <li key={task.id}>
              <button
                type="button"
                className={`routine-item tap-feedback ${done ? 'routine-item--done' : ''}`}
                onClick={() => void toggle(task)}
                aria-pressed={!!done}
              >
                <span className="routine-item__check">
                  <StudioIcon name={done ? 'check' : 'circle'} size={20} />
                </span>
                <span className="routine-item__label">{task.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
