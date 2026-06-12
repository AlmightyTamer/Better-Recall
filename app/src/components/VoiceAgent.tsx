import { useState, useRef, useCallback, useEffect } from 'react';
import { useWhisperVoice } from '../hooks/useWhisperVoice';
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
import StudioIcon from './StudioIcon';
import ClaraFlowerPulse from './ClaraFlowerPulse';

type VoiceState = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking';

const SUGGESTIONS = [
  { label: 'What did I do today?', icon: 'calendar' as const },
  { label: 'Who is my caregiver?', icon: 'user' as const },
  { label: 'I feel lonely', icon: 'heart' as const },
];

export default function VoiceAgent() {
  const user      = useAppStore(s => s.user);
  const acseScore = useAppStore(s => s.acseScore);
  const triggerMemoryRecap  = useAppStore(s => s.triggerMemoryRecap);
  const activateComfortMode = useAppStore(s => s.activateComfortMode);

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [claraLine,  setClaraLine]  = useState('');
  const [errorMsg,   setErrorMsg]   = useState('');
  const [typedInput, setTypedInput] = useState('');

  const { checkRepeatQuestion } = useACSE();
  const {
    isListening, isTranscribing, transcript, elapsed,
    startListening, stopAndTranscribe, stopListening,
  } = useWhisperVoice();

  const historyRef    = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const busyRef       = useRef(false);
  const firstName     = user?.name?.split(' ')[0] ?? 'friend';

  useEffect(() => {
    unlockAudioPlayback();
    setClaraLine(`Hello, ${firstName}. I'm Clara — tap the microphone and we can talk.`);
    return () => { stopSpeaking(); stopListening(); };
  }, [firstName, stopListening]);

  // Keep voiceState in sync with hook states
  useEffect(() => {
    if (isListening)     setVoiceState('recording');
    else if (isTranscribing) setVoiceState('transcribing');
  }, [isListening, isTranscribing]);

  const runResponse = useCallback(async (text: string) => {
    if (!text.trim() || busyRef.current) return;
    busyRef.current = true;
    setErrorMsg('');

    try {
      checkRepeatQuestion(text);
      setVoiceState('thinking');
      setClaraLine('One moment…');

      const intent = detectClaraIntent(text);
      const ctx    = await buildClaraRichContext(user, acseScore);

      let response: string;
      if (intent.tailoredFirst) {
        response = getTailoredResponse(intent.intent, ctx);
      } else {
        try {
          const result = await claraChat(text, historyRef.current, user?.name ?? 'Margaret', ctx);
          response = result.reply;
        } catch {
          response = getTailoredResponse(intent.intent, ctx);
        }
      }

      historyRef.current = [
        ...historyRef.current,
        { role: 'user' as const, content: text },
        { role: 'assistant' as const, content: response },
      ].slice(-20);

      // Speak — always fire regardless of any session flags
      setClaraLine(response);
      setVoiceState('speaking');
      unlockAudioPlayback();
      try {
        await speak(response, { clara: true });
      } catch (e) {
        console.error('TTS error:', e);
      }

      setVoiceState('idle');

      // Cascades
      if (intent.cascade === 'memory_recap') {
        setTimeout(() => triggerMemoryRecap(intent.recapReason ?? 'disorientation'), 600);
      } else if (intent.cascade === 'comfort_mode') {
        setTimeout(() => activateComfortMode(), 600);
      }
    } catch (e) {
      console.error('Clara error:', e);
      setErrorMsg('Something went wrong. Please try again.');
      setVoiceState('idle');
    } finally {
      busyRef.current = false;
    }
  }, [checkRepeatQuestion, user, acseScore, triggerMemoryRecap, activateComfortMode]);

  const handleMicTap = useCallback(() => {
    unlockAudioPlayback();

    // If busy with LLM/TTS, tap interrupts
    if (voiceState === 'thinking' || voiceState === 'speaking') {
      stopSpeaking();
      busyRef.current = false;
      setVoiceState('idle');
      setClaraLine(`I'm here, ${firstName}. Tap the mic whenever you're ready.`);
      return;
    }

    // If recording — stop and transcribe
    if (voiceState === 'recording') {
      stopAndTranscribe();
      return;
    }

    // Idle — start recording
    setErrorMsg('');
    startListening()
      .then(text => {
        if (text.trim()) {
          void runResponse(text);
        } else {
          setClaraLine("I didn't catch that — try speaking a little closer to the mic.");
          setVoiceState('idle');
        }
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('denied') || msg.includes('not-allowed')) {
          setErrorMsg('Microphone access denied. Please allow it in your browser settings.');
        } else if (msg.includes('No Groq API key')) {
          setErrorMsg('Voice transcription unavailable — type your message below.');
        } else {
          setErrorMsg('Could not record. Please try again.');
        }
        setVoiceState('idle');
      });
  }, [voiceState, firstName, startListening, stopAndTranscribe, runResponse]);

  const handleChip = (q: string) => {
    unlockAudioPlayback();
    stopSpeaking();
    void runResponse(q);
  };

  const handleTextSend = () => {
    const text = typedInput.trim();
    if (!text || busyRef.current) return;
    setTypedInput('');
    unlockAudioPlayback();
    stopSpeaking();
    void runResponse(text);
  };

  const flowerActive = voiceState === 'thinking' || voiceState === 'speaking';
  const isRecording  = voiceState === 'recording';

  const micLabel =
    isRecording        ? 'Stop recording'  :
    voiceState === 'thinking' ? 'Interrupt Clara' :
    voiceState === 'speaking' ? 'Interrupt Clara' :
    'Start talking';

  const statusLabel =
    voiceState === 'recording'     ? `Recording — ${elapsed}s — tap to send` :
    voiceState === 'transcribing'  ? 'Transcribing your message…'            :
    voiceState === 'thinking'      ? 'Clara is thinking…'                    :
    voiceState === 'speaking'      ? 'Clara is speaking…'                    :
    'Ready — tap the mic to talk';

  const elapsedStr = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className="clara-room clara-room--seamless">
      <div className="clara-room__inner studio-scroll">

        {/* Header */}
        <header className="clara-room__header clara-room__header--slim">
          <div className="clara-room__avatar-sm clara-room__avatar-icon">
            <StudioIcon name="clara" size={22} />
          </div>
          <div className="clara-room__intro">
            <h1 className="clara-room__name">Clara</h1>
            <span className={`clara-room__badge clara-room__badge--${voiceState}`}>
              {voiceState === 'recording' ? `● REC ${elapsedStr}` :
               voiceState === 'transcribing' ? 'Transcribing…' :
               voiceState === 'thinking' ? 'Thinking' :
               voiceState === 'speaking' ? 'Speaking' : 'Ready'}
            </span>
          </div>
        </header>

        {/* Flower / Recording indicator */}
        <div className="clara-room__stage">
          {isRecording ? (
            <div className="clara-recording-ring" aria-hidden>
              <div className="clara-recording-ring__pulse" />
              <StudioIcon name="mic" size={36} />
              <p className="clara-recording-ring__timer">{elapsedStr}</p>
            </div>
          ) : (
            <ClaraFlowerPulse active={flowerActive} size={96} className="clara-room__flower" />
          )}
        </div>

        {/* Speech bubble */}
        <div
          className={`clara-room__speech clara-room__speech--seamless clara-room__speech--${voiceState}`}
          aria-live="polite"
        >
          {errorMsg ? (
            <p className="clara-room__error">{errorMsg}</p>
          ) : (
            <>
              {claraLine && <p className="clara-room__line">{claraLine}</p>}
              {isRecording && transcript && (
                <p className="clara-room__heard">
                  <span className="clara-room__heard-label">Hearing:</span> {transcript}
                </p>
              )}
            </>
          )}
        </div>

        {/* Mic button */}
        <div className="clara-room__controls">
          <button
            type="button"
            className={`clara-room__mic tap-feedback clara-room__mic--${voiceState}`}
            onClick={handleMicTap}
            aria-label={micLabel}
            disabled={voiceState === 'transcribing'}
          >
            <span className="clara-room__mic-ring" />
            {isRecording && <span className="clara-room__mic-ring clara-room__mic-ring--2" />}
            <StudioIcon
              name={isRecording ? 'mic' : voiceState === 'speaking' || voiceState === 'thinking' ? 'close' : 'mic'}
              size={32}
            />
          </button>
          <p className="clara-room__mic-hint">{statusLabel}</p>
        </div>

        {/* Text input */}
        <div className="clara-room__text-input">
          <input
            type="text"
            className="clara-room__text-field"
            placeholder="Or type a message to Clara…"
            value={typedInput}
            onChange={e => setTypedInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleTextSend(); }}
            aria-label="Type a message to Clara"
          />
          <button
            type="button"
            className="clara-room__text-send tap-feedback"
            onClick={handleTextSend}
            aria-label="Send"
            disabled={!typedInput.trim() || busyRef.current}
          >
            <StudioIcon name="send" size={18} />
          </button>
        </div>

        {/* Quick suggestions — only when idle */}
        {voiceState === 'idle' && (
          <section className="clara-room__suggestions">
            <p className="clara-room__suggestions-label">Quick things to say</p>
            <div className="clara-room__chips">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  type="button"
                  className="clara-room__chip tap-feedback"
                  onClick={() => handleChip(s.label)}
                >
                  <StudioIcon name={s.icon} size={18} />
                  {s.label}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
