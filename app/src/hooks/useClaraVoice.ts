import { useCallback, useRef, useState } from 'react';
import { GROQ_API_KEY } from '../env';
import { proxyPost } from '../services/apiClient';

// ── Constants ─────────────────────────────────────────────────────────────────
const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const WHISPER_MODEL = 'whisper-large-v3-turbo';

const LISTEN_MAX_MS = 20_000;          // hard ceiling for one turn
const SILENCE_AFTER_SPEECH_MS = 1_600; // stop N ms after last detected speech
const MIN_SPEECH_MS = 300;             // ignore bursts shorter than this
const VAD_THRESHOLD = 0.006;           // RMS amplitude — intentionally sensitive

// ── Device Detection ──────────────────────────────────────────────────────────
/** True only for genuine phones/tablets — NOT MacBooks with touchpads. */
function isRealMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function hasSpeechRecognition(): boolean {
  const w = window as Window & {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

/**
 * Routing decision:
 * - Real mobile devices → MediaRecorder + Groq Whisper (Speech API is unreliable in WebViews)
 * - Desktop with Speech API → Web Speech API (zero latency, no upload needed)
 * - Desktop without Speech API → MediaRecorder + Groq Whisper
 */
function useRecorderPath(): boolean {
  return isRealMobile() || !hasSpeechRecognition();
}

// ── Audio helpers ─────────────────────────────────────────────────────────────
function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const t of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch { /* skip */ }
  }
  return '';
}

function mimeToExt(mime: string): string {
  if (mime.includes('mp4')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Could not read audio'));
    reader.readAsDataURL(blob);
  });
}

// ── Transcription — direct Groq first, proxy fallback ─────────────────────────
async function transcribeBlob(blob: Blob, mimeType: string): Promise<string> {
  if (blob.size < 1_000) return '';

  const ext = mimeToExt(mimeType);

  // 1️⃣ Direct Groq API (preferred — bypasses potentially stale proxy)
  const apiKey = GROQ_API_KEY?.trim();
  if (apiKey) {
    try {
      const fd = new FormData();
      fd.append('file', blob, `audio.${ext}`);
      fd.append('model', WHISPER_MODEL);
      fd.append('language', 'en');
      fd.append('response_format', 'json');

      const res = await fetch(GROQ_TRANSCRIBE_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fd,
      });

      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        const text = (data.text ?? '').trim();
        if (text) return text;
      } else {
        const errText = await res.text().catch(() => '');
        console.warn('[Clara STT] Groq direct failed:', res.status, errText.slice(0, 120));
      }
    } catch (err) {
      console.warn('[Clara STT] Groq direct threw:', err);
    }
  }

  // 2️⃣ Proxy fallback
  try {
    const audio = await blobToBase64(blob);
    const data = await proxyPost<{ text?: string }>('/api/groq/transcribe', {
      audio,
      mimeType: mimeType || 'audio/webm',
      model: WHISPER_MODEL,
      language: 'en',
    });
    return (data.text ?? '').trim();
  } catch (err) {
    console.warn('[Clara STT] Proxy fallback failed:', err);
    throw new Error('Could not transcribe audio — check your microphone and try again.');
  }
}

// ── Web Speech API path ───────────────────────────────────────────────────────
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
};
type SpeechResultList = { length: number; [i: number]: { isFinal: boolean; length: number; [j: number]: { transcript: string } } };
type SpeechEvent = { results: SpeechResultList };

function extractTranscript(results: SpeechResultList): string {
  let finals = '';
  let interim = '';
  for (let i = 0; i < results.length; i++) {
    const seg = results[i][0]?.transcript ?? '';
    if (results[i].isFinal) finals += seg;
    else interim += seg;
  }
  return (finals || interim).trim();
}

function listenWithSpeechAPI(abortSignal: { aborted: boolean }): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) { reject(new Error('Speech recognition not available')); return; }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    let settled = false;
    let bestText = '';
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let maxTimer: ReturnType<typeof setTimeout> | null = null;
    let lastResults: SpeechResultList | null = null;

    const finish = (text: string) => {
      if (settled) return;
      settled = true;
      if (silenceTimer) clearTimeout(silenceTimer);
      if (maxTimer) clearTimeout(maxTimer);
      resolve(text.trim());
    };

    const scheduleSilence = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        if (abortSignal.aborted) { finish(''); return; }
        try { rec.stop(); } catch { finish(bestText); }
      }, SILENCE_AFTER_SPEECH_MS);
    };

    rec.onresult = (e: SpeechEvent) => {
      lastResults = e.results;
      const text = extractTranscript(e.results);
      if (text) { bestText = text; scheduleSilence(); }
    };

    rec.onspeechstart = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
    };

    rec.onspeechend = () => {
      if (bestText) scheduleSilence();
    };

    rec.onerror = (e: { error: string }) => {
      if (settled || e.error === 'aborted') return;
      if (e.error === 'no-speech') {
        try { rec.stop(); } catch { finish(''); }
        return;
      }
      settled = true;
      if (e.error === 'not-allowed') {
        reject(new Error('Microphone permission denied'));
      } else {
        reject(new Error(`Speech error: ${e.error}`));
      }
    };

    rec.onend = () => {
      if (settled) return;
      if (lastResults) {
        const t = extractTranscript(lastResults);
        if (t.length > bestText.length) bestText = t;
      }
      finish(bestText);
    };

    maxTimer = setTimeout(() => {
      try { rec.stop(); } catch { finish(bestText); }
    }, LISTEN_MAX_MS);

    if (abortSignal.aborted) { resolve(''); return; }
    try {
      rec.start();
    } catch (err) {
      settled = true;
      reject(err instanceof Error ? err : new Error('Could not start microphone'));
    }
  });
}

// ── MediaRecorder + Whisper path ──────────────────────────────────────────────
function listenWithRecorder(abortSignal: { aborted: boolean }): Promise<string> {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then(async (stream) => {
        if (abortSignal.aborted) {
          stream.getTracks().forEach((t) => t.stop());
          resolve('');
          return;
        }

        const mimeType = getSupportedMimeType();
        const chunks: Blob[] = [];

        // AudioContext for VAD
        const audioCtx = new AudioContext();
        await audioCtx.resume().catch(() => {});
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        const startedAt = Date.now();
        let speechStarted = false;
        let speechStartedAt = 0;
        let lastLoudAt = 0;
        let rafId = 0;
        let maxTimer: ReturnType<typeof setTimeout> | null = null;
        let stopped = false;

        const cleanup = () => {
          if (maxTimer) clearTimeout(maxTimer);
          cancelAnimationFrame(rafId);
          stream.getTracks().forEach((t) => t.stop());
          audioCtx.close().catch(() => {});
        };

        const doStop = () => {
          if (stopped) return;
          stopped = true;
          if (recorder.state === 'recording') recorder.stop();
        };

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          cleanup();
          if (abortSignal.aborted) { resolve(''); return; }
          try {
            const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
            console.log('[Clara STT] Blob size:', blob.size, 'type:', mimeType);
            const text = await transcribeBlob(blob, mimeType || 'audio/webm');
            resolve(text);
          } catch (err) {
            reject(err instanceof Error ? err : new Error('Transcription failed'));
          }
        };

        recorder.onerror = () => { cleanup(); reject(new Error('Recording error')); };

        // VAD loop — runs every animation frame
        const vad = () => {
          if (abortSignal.aborted || stopped) { doStop(); return; }

          const buf = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const s = (buf[i] - 128) / 128;
            sum += s * s;
          }
          const rms = Math.sqrt(sum / buf.length);
          const now = Date.now();

          if (rms > VAD_THRESHOLD) {
            if (!speechStarted) { speechStarted = true; speechStartedAt = now; }
            lastLoudAt = now;
          } else if (speechStarted && now - lastLoudAt >= SILENCE_AFTER_SPEECH_MS && now - speechStartedAt >= MIN_SPEECH_MS) {
            console.log('[Clara STT] VAD: silence detected, stopping');
            doStop();
            return;
          }

          if (now - startedAt >= LISTEN_MAX_MS) {
            console.log('[Clara STT] VAD: max time reached');
            doStop();
            return;
          }

          rafId = requestAnimationFrame(vad);
        };

        recorder.start(100);
        rafId = requestAnimationFrame(vad);
        maxTimer = setTimeout(doStop, LISTEN_MAX_MS + 1000);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('not-allowed')) {
          reject(new Error('Microphone permission denied'));
        } else {
          reject(new Error('Could not access microphone'));
        }
      });
  });
}

// ── Public hook ───────────────────────────────────────────────────────────────
export function useClaraVoice() {
  const [isListening, setIsListening] = useState(false);
  const abortRef = useRef(false);

  const stopListening = useCallback(() => {
    abortRef.current = true;
    setIsListening(false);
  }, []);

  const startListening = useCallback((): Promise<string> => {
    abortRef.current = false;
    setIsListening(true);

    const signal = { get aborted() { return abortRef.current; } };

    const run = useRecorderPath()
      ? listenWithRecorder(signal)
      : listenWithSpeechAPI(signal);

    return run
      .then((text) => {
        setIsListening(false);
        return abortRef.current ? '' : text;
      })
      .catch((err) => {
        setIsListening(false);
        throw err;
      });
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    isRecorderMode: useRecorderPath(),
  };
}
