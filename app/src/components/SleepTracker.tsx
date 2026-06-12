import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useAppStore } from '../store/appStore';
import StudioIcon from './StudioIcon';
import {
  analyzeSleep,
  formatSleepDuration,
  lastNightDate,
  nightMetrics,
  qualityLabel,
} from '../lib/sleep';
import {
  connectAppleHealth,
  getAppleHealthMeta,
  isAppleHealthConnected,
  syncAppleWatchSleep,
} from '../lib/appleHealthSleep';

const SLEEP_TIPS = [
  'Try to go to bed around the same time each night.',
  'Dim the lights an hour before bed.',
  'A warm cup of chamomile tea can help you wind down.',
  'If you wake up, take slow breaths — you are safe at home.',
];

interface SleepTrackerProps {
  dashboard?: boolean;
}

export default function SleepTracker({ dashboard = false }: SleepTrackerProps) {
  const { user } = useAppStore();
  const [watchSyncing, setWatchSyncing] = useState(false);
  const [watchMeta, setWatchMeta] = useState(getAppleHealthMeta(user?.id ?? 0));
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const logs = useLiveQuery(
    () => (user?.id ? db.sleepLogs.where('userId').equals(user.id).sortBy('date') : []),
    [user?.id]
  ) ?? [];

  const report = analyzeSleep(logs);
  const lastNight = logs.find((l) => l.date === lastNightDate());
  const lastMetrics = lastNight ? nightMetrics(lastNight) : null;
  const firstName = user?.name?.split(' ')[0] ?? 'friend';

  // Auto-connect and sync Apple Watch on mount
  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;

    const autoConnect = async () => {
      if (!isAppleHealthConnected(uid)) {
        setWatchSyncing(true);
        try {
          const state = await connectAppleHealth(uid);
          setWatchMeta(state);
        } finally {
          setWatchSyncing(false);
        }
      }
      // Always sync on mount so data is fresh
      setWatchSyncing(true);
      try {
        await syncAppleWatchSleep(uid);
        const meta = getAppleHealthMeta(uid);
        setWatchMeta(meta);
        setLastSynced(meta.lastSyncAt ?? null);
      } finally {
        setWatchSyncing(false);
      }
    };

    void autoConnect();
  }, [user?.id]);

  const handleSync = async () => {
    if (!user?.id) return;
    setWatchSyncing(true);
    try {
      await syncAppleWatchSleep(user.id);
      const meta = getAppleHealthMeta(user.id);
      setWatchMeta(meta);
      setLastSynced(meta.lastSyncAt ?? null);
    } finally {
      setWatchSyncing(false);
    }
  };

  if (!user?.id) return null;

  const syncedAt = lastSynced ?? watchMeta.lastSyncAt;
  const syncedLabel = syncedAt
    ? new Date(syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={dashboard ? 'sleep-dashboard' : undefined}>
      {dashboard && (
        <header className="sleep-dashboard__hero">
          <div className="sleep-dashboard__hero-icon">
            <StudioIcon name="moon" size={32} />
          </div>
          <div>
            <h1 className="sleep-dashboard__title">{firstName}&apos;s sleep</h1>
            <p className="sleep-dashboard__sub">
              Sleep data is automatically recorded by Apple Watch and synced via Apple Health.
            </p>
          </div>
        </header>
      )}

      {/* Apple Watch status strip */}
      <div className="sleep-watch-strip card">
        <div className="sleep-watch-strip__icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="2" width="10" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/>
            <rect x="9" y="5" width="6" height="11" rx="1.5" fill="currentColor" opacity="0.15"/>
            <path d="M9 7h6M9 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M7 6H5M7 18H5M17 6h2M17 18h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="sleep-watch-strip__body">
          <p className="sleep-watch-strip__name">{watchMeta.deviceName ?? "Margaret's Apple Watch"}</p>
          <p className="sleep-watch-strip__status">
            {watchSyncing
              ? 'Syncing from Apple Health…'
              : syncedLabel
                ? `Last synced at ${syncedLabel}`
                : 'Connected via Apple Health'}
          </p>
        </div>
        <button
          type="button"
          className="sleep-watch-strip__sync tap-feedback"
          onClick={() => void handleSync()}
          disabled={watchSyncing}
          aria-label="Sync now"
        >
          <StudioIcon name="success" size={16} />
        </button>
      </div>

      <section className={`sleep-tracker card ${dashboard ? 'sleep-tracker--dashboard' : ''}`}>
        <div className="sleep-tracker__header">
          <div className="sleep-tracker__icon-wrap">
            <StudioIcon name="moon" size={24} />
          </div>
          <div className="sleep-tracker__head-text">
            <h3 className="sleep-tracker__title">{dashboard ? 'Last night' : 'Sleep'}</h3>
            <p className="sleep-tracker__sub">
              {lastMetrics
                ? `${formatSleepDuration(lastMetrics.durationHours)} · ${qualityLabel(lastNight!.quality)} · ${lastMetrics.efficiency}% efficiency`
                : watchSyncing ? 'Syncing from Apple Watch…' : 'Waiting for Apple Watch data'}
            </p>
          </div>
          {lastNight?.loggedBy === 'apple_watch' && (
            <span className="sleep-watch-badge">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              Watch
            </span>
          )}
        </div>

        {lastMetrics && (
          <div className="sleep-tracker__stats">
            <div className="sleep-stat">
              <span className="sleep-stat__value">{formatSleepDuration(lastMetrics.durationHours)}</span>
              <span className="sleep-stat__label">Duration</span>
            </div>
            <div className="sleep-stat">
              <span className="sleep-stat__value">{lastMetrics.efficiency}%</span>
              <span className="sleep-stat__label">Efficiency</span>
            </div>
            <div className="sleep-stat">
              <span className="sleep-stat__value">{lastMetrics.awakenings}</span>
              <span className="sleep-stat__label">Wake-ups</span>
            </div>
            {dashboard && (
              <div className="sleep-stat">
                <span className="sleep-stat__value">{report.avgDuration > 0 ? formatSleepDuration(report.avgDuration) : '—'}</span>
                <span className="sleep-stat__label">7-day avg</span>
              </div>
            )}
          </div>
        )}

        {report.nights.length > 0 && (
          <div className="sleep-tracker__week">
            <p className="sleep-tracker__week-label">{dashboard ? 'Sleep history' : 'Past week'}</p>
            <div className={`sleep-week-chart ${dashboard ? 'sleep-week-chart--tall' : ''}`}>
              {(dashboard ? report.nights.slice(-14) : report.nights.slice(-7)).map((n) => (
                <div key={n.date} className="sleep-week-bar" title={`${n.date}: ${formatSleepDuration(n.durationHours)}`}>
                  <div
                    className="sleep-week-bar__fill"
                    style={{ height: `${Math.min(100, (n.durationHours / 9) * 100)}%` }}
                  />
                  <span className="sleep-week-bar__day">
                    {new Date(n.date + 'T12:00:00').toLocaleDateString([], { weekday: 'narrow' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {dashboard && (
        <>
          <section className="sleep-tips card">
            <h3 className="studio-section-title">Evening wind-down tips</h3>
            <ul className="sleep-tips__list">
              {SLEEP_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>

          {report.interpretation[0] && (
            <section className="sleep-insight card">
              <StudioIcon name="heart" size={20} />
              <p>{report.interpretation[0]}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
