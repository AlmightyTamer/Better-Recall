import { useState, useRef, useCallback, FormEvent, useEffect } from 'react';
import { useVoice } from '../hooks/useVoice';
import { useACSE } from '../hooks/useACSE';
import { claraChat } from '../services/groq';
import { useAppStore } from '../store/appStore';
import { db } from '../db/db';
import StudioIcon from './StudioIcon';
import { speak, stopSpeaking, unlockAudioPlayback } from '../services/elevenlabs';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

const VOICE_PREF_KEY = 'recall_clara_voice';

const SUGGESTIONS = [
  'What should I do next?',
  'How am I doing today?',
  'Tell me about my medications',
];

export default function VoiceAgent() {
  const user = useAppStore((s) => s.user);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking'>('idle');
  const [voiceOn, setVoiceOn] = useState(() => localStorage.getItem(VOICE_PREF_KEY) !== 'off');
  const [speaking, setSpeaking] = useState(false);
  const { startListening } = useVoice();
  const { checkRepeatQuestion, recordActivity } = useACSE();
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(VOICE_PREF_KEY, voiceOn ? 'on' : 'off');
  }, [voiceOn]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns, status, speaking]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || status === 'thinking') return;

    checkRepeatQuestion(trimmed);
    recordActivity();
    setStatus('thinking');
    setTurns((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');

    let response = "I'm having trouble right now. Please try again in a moment.";

    try {
      const ctx = await buildContext(user?.id ?? 1);
      response = await claraChat(
        trimmed,
        historyRef.current,
        user?.name ?? 'Margaret',
        ctx
      );

      historyRef.current = [
        ...historyRef.current,
        { role: 'user' as const, content: trimmed },
        { role: 'assistant' as const, content: response },
      ].slice(-20);
    } catch (err) {
      console.error(err);
    }

    setTurns((prev) => [...prev, { role: 'assistant', content: response }]);
    setStatus('idle');
    inputRef.current?.focus();

    if (voiceOn) {
      setSpeaking(true);
      try {
        await speak(response);
      } finally {
        setSpeaking(false);
      }
    }
  }, [status, checkRepeatQuestion, recordActivity, user, voiceOn]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    unlockAudioPlayback();
    void sendMessage(input);
  };

  const handleMicTap = useCallback(async () => {
    if (status !== 'idle') return;
    unlockAudioPlayback();

    try {
      setStatus('listening');
      const transcript = await startListening();
      if (!transcript.trim()) {
        setStatus('idle');
        return;
      }
      setStatus('idle');
      await sendMessage(transcript);
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  }, [status, startListening, sendMessage]);

  const toggleVoice = () => {
    if (voiceOn) stopSpeaking();
    setVoiceOn((v) => !v);
  };

  const statusLabel =
    speaking ? 'Clara is speaking…' :
    status === 'listening' ? 'Listening…' :
    status === 'thinking' ? 'Clara is thinking…' :
    voiceOn ? 'Ask Clara by voice or type below' :
    'Type or tap the mic to ask Clara';

  return (
    <div className="clara-chat">
      <div
        ref={messagesRef}
        className="studio-scroll clara-chat__messages clara-chat__messages--selectable"
      >
        {turns.length === 0 && (
          <div className="clara-chat__empty">
            <div className="clara-chat__empty-icon">
              <StudioIcon name="chat" size={36} />
            </div>
            <p className="clara-chat__empty-title">Hi, I'm Clara</p>
            <p className="clara-chat__empty-sub">
              Ask me anything — I'll read my answers aloud.
            </p>
            <div className="clara-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="clara-suggestion tap-feedback"
                  onClick={() => {
                    unlockAudioPlayback();
                    void sendMessage(s);
                  }}
                  disabled={status !== 'idle'}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`clara-chat__row clara-chat__row--${t.role}`}>
            <div className="clara-chat__bubble-wrap">
              <div className={`clara-chat__bubble clara-chat__bubble--${t.role}`}>
                {t.content}
              </div>
              {t.role === 'assistant' && (
                <button
                  type="button"
                  className="clara-chat__listen tap-feedback"
                  onClick={() => {
                    unlockAudioPlayback();
                    stopSpeaking();
                    setSpeaking(true);
                    void speak(t.content).finally(() => setSpeaking(false));
                  }}
                  aria-label="Listen to Clara again"
                >
                  <StudioIcon name="speaker" size={16} />
                  <span>Listen again</span>
                </button>
              )}
            </div>
          </div>
        ))}
        {status === 'thinking' && (
          <div className="clara-chat__row clara-chat__row--assistant">
            <div className="studio-bubble-assistant clara-chat__thinking">
              <StudioIcon name="thinking" size={20} />
              <span>Thinking…</span>
            </div>
          </div>
        )}
      </div>

      <form className="clara-chat__composer" onSubmit={handleSubmit}>
        <div className="clara-chat__toolbar">
          <p className="studio-text-muted clara-chat__status">{statusLabel}</p>
          <button
            type="button"
            className={`clara-chat__voice-toggle tap-feedback ${voiceOn ? 'clara-chat__voice-toggle--on' : ''}`}
            onClick={toggleVoice}
            aria-pressed={voiceOn}
          >
            <StudioIcon name="speaker" size={16} />
            <span>{voiceOn ? 'Voice on' : 'Voice off'}</span>
          </button>
        </div>
        <div className="clara-chat__input-row">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Clara anything…"
            className="studio-input clara-chat__input"
            disabled={status === 'thinking' || status === 'listening'}
            autoComplete="off"
          />
          <button
            type="submit"
            className="clara-chat__send tap-feedback"
            disabled={!input.trim() || status !== 'idle'}
            aria-label="Send message"
          >
            <StudioIcon name="send" size={20} />
          </button>
          <button
            type="button"
            onClick={() => void handleMicTap()}
            className={`clara-chat__mic tap-feedback ${status === 'listening' ? 'clara-chat__mic--active mic-listening' : ''}`}
            disabled={status === 'thinking'}
            aria-label="Speak to Clara"
          >
            <StudioIcon name="mic" size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

async function buildContext(userId: number) {
  const now = new Date();
  const events = await db.events.where('userId').equals(userId).toArray();

  const completed = events
    .filter((e) => e.completed && new Date(e.timestamp) <= now)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const upcoming = events
    .filter((e) => !e.completed && new Date(e.timestamp) > now)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(0, 3);

  return {
    recentEvents: completed.map(
      (e) => `${e.title} at ${new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    ),
    upcomingEvents: upcoming.map(
      (e) => `${e.title} at ${new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    ),
  };
}
