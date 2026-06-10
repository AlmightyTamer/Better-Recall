import { useState } from 'react';
import { saveSettings, CONSENT_VERSION } from '../lib/settings';
import StudioIcon from './StudioIcon';

interface Props {
  onAccept: () => void;
}

export default function MedicalDisclaimer({ onAccept }: Props) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="disclaimer-overlay" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
      <div className="disclaimer-card card">
        <div className="disclaimer-card__icon">
          <StudioIcon name="shield" size={32} />
        </div>
        <h2 id="disclaimer-title" className="disclaimer-card__title">Welcome to Recall</h2>
        <p className="disclaimer-card__lead">
          Recall is a cognitive support companion — not a medical device or substitute for professional care.
        </p>
        <ul className="disclaimer-card__list">
          <li>Medication verification is assistive; always confirm with your pharmacist or doctor.</li>
          <li>ACSE scores are behavioral signals, not clinical diagnoses.</li>
          <li>In an emergency, call 911 or your local emergency number.</li>
          <li>Your data stays on this device unless you export it.</li>
        </ul>
        <label className="disclaimer-card__check">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>I understand and agree to use Recall as a support tool</span>
        </label>
        <button
          type="button"
          className="studio-btn studio-btn--primary tap-feedback"
          style={{ width: '100%' }}
          disabled={!checked}
          onClick={() => {
            saveSettings({ consentAccepted: true, consentVersion: CONSENT_VERSION });
            onAccept();
          }}
        >
          Continue to Recall
        </button>
      </div>
    </div>
  );
}
