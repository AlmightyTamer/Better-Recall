import { useMemo, useState } from 'react';
import {
  dailyConnections,
  DIFFICULTY_COLORS,
  type ConnectionGroup,
} from '../../lib/games/connectionsData';

const MAX_MISTAKES = 4;

interface ConnectionsGameProps {
  onComplete?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ConnectionsGame({ onComplete }: ConnectionsGameProps) {
  const groups = useMemo(() => dailyConnections(), []);
  const [pool, setPool] = useState(() => shuffle(groups.flatMap((g) => g.words)));
  const [selected, setSelected] = useState<string[]>([]);
  const [solvedCategories, setSolvedCategories] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState('');

  const solvedGroups = groups.filter((g) => solvedCategories.includes(g.category));
  const poolWords = pool.filter(
    (w) => !solvedGroups.some((g) => g.words.includes(w))
  );

  const toggle = (word: string) => {
    if (solvedGroups.some((g) => g.words.includes(word))) return;
    setSelected((prev) => {
      if (prev.includes(word)) return prev.filter((w) => w !== word);
      if (prev.length >= 4) return prev;
      return [...prev, word];
    });
  };

  const submit = () => {
    if (selected.length !== 4) return;
    const match = groups.find(
      (g) =>
        !solvedCategories.includes(g.category) &&
        g.words.every((w) => selected.includes(w))
    );
    if (match) {
      const nextSolved = [...solvedCategories, match.category];
      setSolvedCategories(nextSolved);
      setSelected([]);
      if (nextSolved.length === groups.length) onComplete?.();
    } else {
      setMistakes((m) => m + 1);
      setShake(true);
      setToast('Not a group — try again');
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setToast(''), 2000);
      setSelected([]);
    }
  };

  const gameOver = mistakes >= MAX_MISTAKES;
  const won = solvedCategories.length === groups.length;

  return (
    <div className="connections-game">
      <p className="connections-game__hint">Find groups of four related words</p>
      {toast && <p className="connections-game__toast" role="status">{toast}</p>}
      <div className="connections-game__mistakes">
        {Array.from({ length: MAX_MISTAKES }, (_, i) => (
          <span key={i} className={`connections-mistake ${i < mistakes ? 'connections-mistake--used' : ''}`} />
        ))}
      </div>

      {solvedGroups.map((g) => (
        <div
          key={g.category}
          className="connections-solved"
          style={{ background: DIFFICULTY_COLORS[g.difficulty] }}
        >
          <p className="connections-solved__cat">{g.category}</p>
          <p className="connections-solved__words">{g.words.join(', ')}</p>
        </div>
      ))}

      {!won && !gameOver && (
        <div className={`connections-grid ${shake ? 'connections-grid--shake' : ''}`}>
          {poolWords.map((word) => (
            <button
              key={word}
              type="button"
              className={`connections-tile tap-feedback ${selected.includes(word) ? 'connections-tile--selected' : ''}`}
              onClick={() => toggle(word)}
            >
              {word}
            </button>
          ))}
        </div>
      )}

      {!won && !gameOver && (
        <div className="connections-actions">
          <button
            type="button"
            className="studio-btn studio-btn--ghost tap-feedback"
            onClick={() => {
              setPool(shuffle(poolWords));
              setSelected([]);
            }}
          >
            Shuffle
          </button>
          <button
            type="button"
            className="studio-btn studio-btn--ghost tap-feedback"
            onClick={() => setSelected([])}
            disabled={selected.length === 0}
          >
            Deselect
          </button>
          <button
            type="button"
            className="studio-btn studio-btn--primary tap-feedback"
            disabled={selected.length !== 4}
            onClick={submit}
          >
            Submit
          </button>
        </div>
      )}

      {won && <p className="connections-game__win">All groups found — sharp thinking!</p>}
      {gameOver && !won && (
        <div className="connections-game__reveal">
          <p className="connections-game__lose">Out of mistakes — here are the groups:</p>
          {groups
            .filter((g) => !solvedCategories.includes(g.category))
            .map((g) => (
              <div key={g.category} className="connections-solved" style={{ background: DIFFICULTY_COLORS[g.difficulty] }}>
                <p className="connections-solved__cat">{g.category}</p>
                <p className="connections-solved__words">{g.words.join(', ')}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
