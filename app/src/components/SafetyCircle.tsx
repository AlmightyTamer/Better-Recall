import { useLiveQuery } from 'dexie-react-hooks';
import { db, type EmergencyContact } from '../db/db';
import { useAppStore } from '../store/appStore';
import { dialNumber } from '../lib/emergency';
import { familyPhotoUrl } from '../lib/assets';
import StudioIcon from './StudioIcon';

export default function SafetyCircle() {
  const { user } = useAppStore();

  const contacts = useLiveQuery<EmergencyContact[]>(
    () => (user?.id ? db.emergencyContacts.where('userId').equals(user.id).toArray() : []),
    [user?.id]
  ) ?? [];

  if (!user) return null;

  const caregiver = user.caregiverPhone
    ? {
        name: user.caregiverName,
        relationship: user.caregiverRelationship,
        phone: user.caregiverPhone,
        primary: true,
      }
    : null;

  const deduped = contacts.filter((c) => {
    if (!caregiver) return true;
    const samePhone = c.phone === caregiver.phone;
    const sameName = c.name.trim().toLowerCase() === caregiver.name.trim().toLowerCase();
    return !samePhone && !sameName;
  });

  const allContacts = [
    ...(caregiver ? [caregiver] : []),
    ...deduped.map((c) => ({
      name: c.name,
      relationship: c.relationship,
      phone: c.phone,
      primary: c.isPrimary,
    })),
  ];

  if (allContacts.length === 0) return null;

  return (
    <section className="safety-circle card">
      <div className="safety-circle__header">
        <StudioIcon name="shield" size={22} />
        <h3 className="studio-section-title" style={{ margin: 0 }}>Your safety circle</h3>
      </div>
      <div className="safety-circle__grid">
        {allContacts.map((c) => {
          const photo = familyPhotoUrl(c.name);
          return (
            <button
              key={c.phone}
              type="button"
              className="safety-contact tap-feedback"
              onClick={() => dialNumber(c.phone)}
            >
              <span className="safety-contact__avatar">
                {photo ? (
                  <img src={photo} alt="" className="safety-contact__photo" />
                ) : (
                  c.name.charAt(0)
                )}
              </span>
              <span className="safety-contact__name">{c.name}</span>
              <span className="safety-contact__rel">{c.relationship}</span>
              <span className="safety-contact__call">Tap to call</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
