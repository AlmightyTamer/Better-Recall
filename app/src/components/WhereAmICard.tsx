import { useAppStore } from '../store/appStore';
import StudioIcon from './StudioIcon';

export default function WhereAmICard() {
  const { user } = useAppStore();
  if (!user) return null;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="where-am-i card">
      <div className="where-am-i__header">
        <StudioIcon name="location" size={22} />
        <h3 className="where-am-i__title">Where you are</h3>
      </div>
      <p className="where-am-i__place">{user.homeAddress || user.city}</p>
      <p className="where-am-i__time">{timeStr}</p>
      <p className="where-am-i__date">{dateStr}</p>
      <div className="where-am-i__caregiver">
        <StudioIcon name="user" size={16} />
        <span>
          {user.caregiverName} ({user.caregiverRelationship}) is your caregiver
        </span>
      </div>
      {user.emergencyNote && (
        <p className="where-am-i__note">{user.emergencyNote}</p>
      )}
    </div>
  );
}
