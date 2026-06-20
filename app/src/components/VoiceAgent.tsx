import { useState, useRef, useCallback, useEffect } from 'react';
import { useClaraVoice } from '../hooks/useClaraVoice';
import { useACSE } from '../hooks/useACSE';
import { claraChat } from '../services/groq';
import { useAppStore } from '../store/appStore';
import { buildClaraRichContext } from '../lib/claraContext';
import {
  detectClaraIntent,
  getTailoredResponse,
  type MemoryRecapReason,
} from '../lib/claraIntents';
import { speak, stopSpeaking, unlockAudioPlayback } from '../services/elevenlabs';
import StudioIcon, { type IconName } from './StudioIcon';
import ClaraFlowerPulse from './ClaraFlowerPulse';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

const SUGGESTIONS: { label: string; icon: IconName }[] = [
  { label: 'What did I do today?', icon: 'calendar' },
  { label: 'Who is my caregiver?', icon: 'user'     },
  { label: 'I feel lonely',        icon: 'heart'    },
  { label: 'What time is it?',     icon: 'speaker'  },
];

const POST_SPEAK_PAUSE_MS = 800;
const CASCADE_DELAY_MS = 1_800;

// ── Live mic volume meter (shown when listening via MediaRecorder) ─────────────
function useMicLevel(active: boolean) {
  const [level, setLevel] = useState(0);
  const rafRef = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setLevel(0);
      return;
    }

    // Try to attach a separate analyser just for the meter
    // (the main recorder has its own context — this is display-only)
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        ctxRef.current = ctx;
        analyserRef.current = analyser;
        streamRef.current = stream;

        const tick = () => {
          const buf = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const s = (buf[i] - 128) / 128;
            sum += s * s;
          }
          const rms = Math.min(1, Math.sqrt(sum / buf.length) * 8);
          setLevel(rms);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => { /* meter is optional — ignore errors */ });

    return () => {
      cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close().catch(() => {});
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setLevel(0);
    };
  }, [active]);

  return level;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VoiceAgent() {
  const user = useAppStore((s) => s.user);
  const acseScore = useAppStore((s) => s.acseScore);
  const triggerMemoryRecap = useAppStore((s) => s.triggerMemoryRecap);
  const activateComfortMode = useAppStore((s) => s.activateComfortMode);

  const [state, setState] = useState<VoiceState>('idle');
  const [inSession, setInSession] = useState(false);
  const [claraLine, setClaraLine] = useState('');
  const [error, setError] = useState('');
  const [llmConnected, setLlmConnected] = useState<boolean | null>(null);
  const [typedInput, setTypedInput] = useState('');

  const { isListening, startListening, stopListening, isRecorderMode } = useClaraVoice();
  const { checkRepeatQuestion } = useACSE();
  const micLevel = useMicLevel(state === 'listening');

  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const sessionActiveRef = useRef(false);
  const greetingSetRef = useRef(false);

  const firstName = user?.name?.split(' ')[0] ?? 'friend';
  const flowerActive = state === 'thinking' || state === 'speaking';

  useEffect(() => {
    unlockAudioPlayback();
    if (!greetingSetRef.current) {
      setClaraLine(`Hello, ${firstName}. I'm Clara — tap the microphone and we can talk.`);
      greetingSetRef.current = true;
    }
    return () => {
      sessionActiveRef.current = false;
      stopSpeaking();
      stopListening();
    };
  }, [stopListening, firstName]);

  const stopSession = useCallback(() => {
    sessionActiveRef.current = false;
    setInSession(false);
    stopSpeaking();
    stopListening();
    setState('idle');
    setClaraLine(`I'm still here, ${firstName}. Tap the mic whenever you're ready.`);
    setError('');
  }, [stopListening, firstName]);

  const speakResponse = useCallback(async (response: string, force = false) => {
    if (!force && !sessionActiveRef.current) return;
    stopListening();
    setClaraLine(response);
    setState('speaking');
    try {
      unlockAudioPlayback();
      await speak(response, { clara: true });
    } catch (err) {
      console.error('[Clara TTS]', err);
    }
    await new Promise<void>((r) => setTimeout(r, POST_SPEAK_PAUSE_MS));
    if (sessionActiveRef.current || force) setState('idle');
  }, [stopListening]);

  const runCascade = useCallback(
    async (cascade: 'memory_recap' | 'comfort_mode', recapReason?: MemoryRecapReason) => {
      if (!sessionActiveRef.current) return;
      await new Promise<void>((r) => setTimeout(r, CASCADE_DELAY_MS));
      sessionActiveRef.current = false;
      setInSession(false);
      setState('idle');
      if (cascade === 'memory_recap') triggerMemoryRecap(recapReason ?? 'disorientation');
      else if (cascade === 'comfort_mode') activateComfortMode();
    },
    [triggerMemoryRecap, activateComfortMode]
  );

  const processUtterance = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      if (sessionActiveRef.current) setClaraLine("I didn't catch that — take your time and try again.");
      return;
    }

    checkRepeatQuestion(trimmed);
    setError('');
    setState('thinking');
    setClaraLine('One moment…');

    const intent = detectClaraIntent(trimmed);
    const ctx = await buildClaraRichContext(user, acseScore);
    let response: string;

    if (intent.tailoredFirst) {
      response = getTailoredResponse(intent.intent, ctx);
    } else {
      try {
        const result = await claraChat(trimmed, historyRef.current, user?.name ?? 'Margaret', ctx);
        response = result.reply;
        setLlmConnected(result.fromLlm);
      } catch (err) {
        console.error('[Clara LLM]', err);
        response = getTailoredResponse(intent.intent, ctx);
        setLlmConnected(false);
      }
    }

    historyRef.current = [
      ...historyRef.current,
      { role: 'user' as const, content: trimmed },
      { role: 'assistant' as const, content: response },
    ].slice(-20);

    if (!sessionActiveRef.current) return;
    await speakResponse(response);

    if (intent.cascade === 'memory_recap') await runCascade('memory_recap', intent.recapReason);
    else if (intent.cascade === 'comfort_mode') await runCascade('comfort_mode');
  }, [checkRepeatQuestion, user, acseScore, speakResponse, runCascade]);

  const runSingleTurn = useCallback(async () => {
    try {
      stopSpeaking();
      await new Promise<void>((r) => setTimeout(r, 150));
      if (!sessionActiveRef.current) return;

      setState('listening');
      setClaraLine(isRecorderMode ? "I'm listening — speak clearly…" : "I'm listening…");
      setError('');

      const heard = await startListening();
      if (!sessionActiveRef.current) return;

      if (!heard.trim()) {
        setClaraLine(`I didn't quite hear you, ${firstName} — tap the mic and try again.`);
        setState('idle');
        return;
      }

      // Show what was heard briefly
      setClaraLine(`"${heard}"`);
      await processUtterance(heard);
    } catch (err) {
      console.error('[Clara voice]', err);
      if (!sessionActiveRef.current) return;
      const msg = (err instanceof Error ? err.message : '').toLowerCase();
      if (msg.includes('denied') || msg.includes('not-allowed') || msg.includes('permission')) {
        setError('Microphone access is blocked. Please allow microphone in your browser settings.');
        setClaraLine('Once the mic is allowed, tap below and we can talk.');
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('transcri')) {
        setClaraLine("Having trouble connecting. Check your internet and try again.");
      } else {
        setClaraLine("I didn't quite catch that — try again.");
      }
      setState('idle');
    } finally {
      sessionActiveRef.current = false;
      setInSession(false);
    }
  }, [startListening, processUtterance, firstName, isRecorderMode]);

  const handleMicTap = useCallback(() => {
    unlockAudioPlayback();
    if (state !== 'idle' || inSession) { stopSession(); return; }
    stopSpeaking();
    sessionActiveRef.current = true;
    setInSession(true);
    setError('');
    void runSingleTurn();
  }, [state, inSession, stopSession, runSingleTurn]);

  const handleChip = (q: string) => {
    unlockAudioPlayback();
    stopSpeaking();
    stopListening();
    sessionActiveRef.current = true;
    setInSession(true);
    setError('');
    void processUtterance(q).finally(() => {
      sessionActiveRef.current = false;
      setInSession(false);
    });
  };

  const handleTextSend = () => {
    const text = typedInput.trim();
    if (!text || inSession) return;
    setTypedInput('');
    unlockAudioPlayback();
    stopSpeaking();
    stopListening();
    sessionActiveRef.current = true;
    setInSession(true);
    setError('');
    void processUtterance(text).finally(() => {
      sessionActiveRef.current = false;
      setInSession(false);
    });
  };

  const micIcon: IconName = (state === 'thinking' || state === 'speaking') ? 'close' : 'mic';
  const micHint =
    state === 'listening' ? (isRecorderMode ? 'Listening — speak now' : 'Listening…') :
    state === 'thinking'  ? 'Thinking…' :
    state === 'speaking'  ? 'Tap to stop' :
    'Tap to talk';

  // Mic level bar — 5 bars driven by micLevel (0–1)
  const bars = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div className="cv2-room">

      {/* ── Top bar ── */}
      <header className="cv2-header">
        <div className="cv2-header__dot cv2-header__dot--idle" />
        <span className="cv2-header__name">Clara</span>
        <span className={`cv2-status cv2-status--${state}`}>
          {state === 'listening' ? '● Listening' :
           state === 'thinking'  ? '◌ Thinking…' :
           state === 'speaking'  ? '▶ Speaking'  : 'Ready'}
        </span>
        {llmConnected === false && <span className="cv2-offline">Offline</span>}
      </header>

      {/* ── Scrollable body ── */}
      <div className="cv2-body studio-scroll">

        {/* Flower + mic visualizer */}
        <div className="cv2-stage">
          <ClaraFlowerPulse active={flowerActive} size={120} className="cv2-flower" />

          {/* Animated wave bars (always shown when listening) */}
          {state === 'listening' && (
            <div className="cv2-wave" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="cv2-wave__bar"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          )}

          {/* Live mic level — only in recorder mode, shows real audio input */}
          {state === 'listening' && isRecorderMode && (
            <div className="cv2-miclevel" aria-hidden>
              {bars.map((threshold, i) => (
                <div
                  key={i}
                  className="cv2-miclevel__bar"
                  style={{
                    height: `${8 + i * 5}px`,
                    background: micLevel >= threshold
                      ? 'var(--cv2-accent, #AF52DE)'
                      : 'var(--studio-border, rgba(255,255,255,0.15))',
                    transition: 'background 0.06s',
                  }}
                />
              ))}
              <span className="cv2-miclevel__label">
                {micLevel > 0.15 ? 'Voice detected' : 'Speak now…'}
              </span>
            </div>
          )}
        </div>

        {/* Speech / status text */}
        <div className="cv2-speech" aria-live="polite">
          {error    && <p className="cv2-speech__error">{error}</p>}
          {claraLine && <p className="cv2-speech__line">{claraLine}</p>}
        </div>

        {/* Suggestion chips */}
        {!inSession && state === 'idle' && (
          <div className="cv2-chips" role="group" aria-label="Quick suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                className="cv2-chip tap-feedback"
                onClick={() => handleChip(s.label)}
              >
                <StudioIcon name={s.icon} size={14} />
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 16 }} />
      </div>

      {/* ── Input bar ── */}
      <div className="cv2-input-bar">
        <button
          type="button"
          className={`cv2-mic tap-feedback cv2-mic--${state}`}
          onClick={handleMicTap}
          aria-label={state !== 'idle' ? 'Stop' : 'Talk to Clara'}
        >
          <span className="cv2-mic__ring" />
          <StudioIcon name={micIcon} size={24} />
        </button>

        <div className="cv2-text-wrap">
          <input
            type="text"
            className="cv2-text-field"
            placeholder="Type to Clara…"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTextSend(); }}
            aria-label="Type a message to Clara"
            disabled={inSession && state !== 'idle'}
          />
          <button
            type="button"
            className="cv2-send tap-feedback"
            onClick={handleTextSend}
            aria-label="Send"
            style={{ visibility: typedInput.trim() && !inSession ? 'visible' : 'hidden' }}
          >
            <StudioIcon name="send" size={16} />
          </button>
        </div>

        <p className="cv2-mic-hint">{micHint}</p>
      </div>
    </div>
  );
}
