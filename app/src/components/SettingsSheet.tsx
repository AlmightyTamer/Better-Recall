import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { getSettings, saveSettings, type FontScale } from '../lib/settings';
import { requestNotificationPermission } from '../lib/notifications';
import StudioIcon from './StudioIcon';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ open, onClose }: Props) {
  const { toggleTheme, theme } = useAppStore();
  const [settings, setSettings] = useState(getSettings);

  if (!open) return null;

  const update = (patch: Parameters<typeof saveSettings>[0]) => {
    const next = saveSettings(patch);
    setSettings(next);
  };

  return (
    <div className="settings-overlay" onClick={onClose} role="presentation">
      <div className="settings-sheet card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Settings">
        <div className="settings-sheet__header">
          <h2 className="settings-sheet__title">Settings</h2>
          <button type="button" className="studio-icon-btn tap-feedback" onClick={onClose} aria-label="Close">
            <StudioIcon name="close" size={20} />
          </button>
        </div>

        <div className="settings-group">
          <p className="settings-group__label">Accessibility</p>
          <label className="settings-toggle">
            <span>Easy Mode — larger buttons &amp; simpler layout</span>
            <input
              type="checkbox"
              checked={settings.easyMode}
              onChange={(e) => update({ easyMode: e.target.checked })}
            />
          </label>
          <label className="settings-toggle">
            <span>High contrast</span>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => update({ highContrast: e.target.checked })}
            />
          </label>
          <div className="settings-field">
            <span>Text size</span>
            <select
              className="studio-select"
              value={settings.fontScale}
              onChange={(e) => update({ fontScale: e.target.value as FontScale })}
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra large</option>
            </select>
          </div>
        </div>

        <div className="settings-group">
          <p className="settings-group__label">Reminders</p>
          <label className="settings-toggle">
            <span>Medication reminders</span>
            <input
              type="checkbox"
              checked={settings.medReminders}
              onChange={async (e) => {
                if (e.target.checked) await requestNotificationPermission();
                update({ medReminders: e.target.checked });
              }}
            />
          </label>
        </div>

        <div className="settings-group">
          <p className="settings-group__label">Appearance</p>
          <button type="button" className="studio-btn tap-feedback" style={{ width: '100%' }} onClick={toggleTheme}>
            <StudioIcon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
          </button>
        </div>

        <p className="settings-footnote">
          Recall v1.0 · Not a medical device · Data stored on this device
        </p>
      </div>
    </div>
  );
}
