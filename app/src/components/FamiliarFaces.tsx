import { useLiveQuery } from 'dexie-react-hooks';
import { db, type FamiliarFace } from '../db/db';
import { useAppStore } from '../store/appStore';
import { speak } from '../services/elevenlabs';
import StudioIcon from './StudioIcon';

export default function FamiliarFaces() {
  const { user } = useAppStore();

  const faces = useLiveQuery<FamiliarFace[]>(
    () => (user?.id ? db.familiarFaces.where('userId').equals(user.id).toArray() : Promise.resolve([])),
    [user?.id]
  ) ?? [];

  if (faces.length === 0) return null;

  return (
    <section className="familiar-faces">
      <div className="familiar-faces__header">
        <StudioIcon name="heart" size={20} />
        <h3 className="studio-section-title" style={{ margin: 0 }}>People who love you</h3>
      </div>
      <div className="familiar-faces__scroll">
        {faces.map((face) => (
          <button
            key={face.id}
            type="button"
            className="familiar-face tap-feedback"
            onClick={() => void speak(face.memoryPrompt)}
            aria-label={`${face.name}, ${face.relationship}. Tap to hear a memory.`}
          >
            <img src={face.photoUrl} alt={face.name} className="familiar-face__photo" loading="lazy" />
            <p className="familiar-face__name">{face.name}</p>
            <p className="familiar-face__rel">{face.relationship}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
