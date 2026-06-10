import { useState } from 'react';
import { db, type User } from '../db/db';
import StudioIcon from './StudioIcon';

interface Props {
  onComplete: (user: User) => void;
  onCancel: () => void;
}

export default function OnboardingWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    age: '',
    city: '',
    homeAddress: '',
    caregiverName: '',
    caregiverRelationship: 'daughter',
    caregiverPhone: '',
    emergencyNote: 'I live at home. Please call my caregiver first.',
    patientPin: '',
  });

  const steps = ['About you', 'Caregiver', 'Safety', 'Done'];

  const handleCreate = async () => {
    const now = new Date().toISOString();
    const userId = await db.users.add({
      name: form.name.trim(),
      age: parseInt(form.age) || 75,
      city: form.city.trim(),
      homeAddress: form.homeAddress.trim() || form.city.trim(),
      caregiverName: form.caregiverName.trim(),
      caregiverRelationship: form.caregiverRelationship,
      caregiverPhone: form.caregiverPhone.trim(),
      emergencyNote: form.emergencyNote.trim(),
      patientPin: form.patientPin.trim() || undefined,
      onboardingComplete: true,
      medications: [],
      createdAt: now,
    });

    await db.emergencyContacts.add({
      userId,
      name: form.caregiverName.trim(),
      relationship: form.caregiverRelationship,
      phone: form.caregiverPhone.trim(),
      isPrimary: true,
    });

    const defaultRoutines = [
      { label: 'Brush teeth', period: 'morning' as const, sortOrder: 0 },
      { label: 'Take morning medication', period: 'morning' as const, sortOrder: 1 },
      { label: 'Eat breakfast', period: 'morning' as const, sortOrder: 2 },
      { label: 'Afternoon walk or rest', period: 'afternoon' as const, sortOrder: 0 },
      { label: 'Eat dinner', period: 'evening' as const, sortOrder: 0 },
      { label: 'Take evening medication', period: 'evening' as const, sortOrder: 1 },
      { label: 'Prepare for bed', period: 'evening' as const, sortOrder: 2 },
    ];

    await db.routineTasks.bulkAdd(
      defaultRoutines.map((r) => ({ ...r, userId }))
    );

    const user = await db.users.get(userId);
    if (user) onComplete(user);
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card card">
        <div className="onboarding-steps">
          {steps.map((s, i) => (
            <span key={s} className={`onboarding-step ${i <= step ? 'onboarding-step--active' : ''}`}>
              {s}
            </span>
          ))}
        </div>

        {step === 0 && (
          <div className="onboarding-panel">
            <h2>Let's set up your profile</h2>
            <input className="studio-input" placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={{ marginBottom: 8 }} />
            <input className="studio-input" placeholder="Age" type="number" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} style={{ marginBottom: 8 }} />
            <input className="studio-input" placeholder="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} style={{ marginBottom: 8 }} />
            <input className="studio-input" placeholder="Home address (for orientation)" value={form.homeAddress} onChange={(e) => setForm((p) => ({ ...p, homeAddress: e.target.value }))} />
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-panel">
            <h2>Who is your caregiver?</h2>
            <input className="studio-input" placeholder="Caregiver name" value={form.caregiverName} onChange={(e) => setForm((p) => ({ ...p, caregiverName: e.target.value }))} style={{ marginBottom: 8 }} />
            <input className="studio-input" placeholder="Relationship (e.g. daughter)" value={form.caregiverRelationship} onChange={(e) => setForm((p) => ({ ...p, caregiverRelationship: e.target.value }))} style={{ marginBottom: 8 }} />
            <input className="studio-input" placeholder="Phone number" type="tel" value={form.caregiverPhone} onChange={(e) => setForm((p) => ({ ...p, caregiverPhone: e.target.value }))} />
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-panel">
            <h2>Safety settings</h2>
            <textarea className="studio-textarea" rows={2} placeholder="Emergency note for responders" value={form.emergencyNote} onChange={(e) => setForm((p) => ({ ...p, emergencyNote: e.target.value }))} style={{ marginBottom: 8 }} />
            <input className="studio-input" placeholder="Optional PIN (4 digits)" type="password" maxLength={4} value={form.patientPin} onChange={(e) => setForm((p) => ({ ...p, patientPin: e.target.value.replace(/\D/g, '') }))} />
            <p className="studio-text-muted" style={{ fontSize: 14 }}>A morning &amp; evening routine will be created automatically.</p>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-panel onboarding-panel--done">
            <StudioIcon name="success" size={48} />
            <h2>You're all set!</h2>
            <p>Recall will help with medications, memory, and daily orientation.</p>
          </div>
        )}

        <div className="onboarding-actions">
          {step > 0 && step < 3 && (
            <button type="button" className="studio-btn tap-feedback" onClick={() => setStep((s) => s - 1)}>Back</button>
          )}
          {step < 3 ? (
            <button
              type="button"
              className="studio-btn studio-btn--primary tap-feedback"
              disabled={step === 0 && !form.name.trim()}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </button>
          ) : (
            <button type="button" className="studio-btn studio-btn--primary tap-feedback" onClick={() => void handleCreate()}>
              Start using Recall
            </button>
          )}
          <button type="button" className="studio-btn studio-btn--text" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
