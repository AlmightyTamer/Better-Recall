import { useCallback, useRef, useState } from 'react';
import { GROQ_API_KEY } from '../env';
import { usesApiProxy } from '../services/apiClient';

const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const WHISPER_MODEL = 'whisper-large-v3-turbo';
const MAX_RECORD_MS = 30_000;

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const type of ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4']) {
    try { if (MediaRecorder.isTypeSupported(type)) return type; } catch { /* skip */ }
  }
  return '';
}

function mimeToExt(mime: string): string {
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4')) return 'mp4';
  return 'webm';
}

export function useWhisperVoice() {
  const [isListening, setIsListening]       = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript]         = useState('');
  const [elapsed, setElapsed]               = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timerRef.current)   { clearInterval(timerRef.current);  timerRef.current  = null; }
    if (autoStopRef.current){ clearTimeout(autoStopRef.current); autoStopRef.current = null; }
  };

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const transcribeChunks = useCallback(async (chunks: Blob[], mimeType: string): Promise<string> => {
    setIsTranscribing(true);
    try {
      const audioBlob = new Blob(chunks, { type: mimeType });
      if (audioBlob.size < 1500) return '';

      const apiKey = usesApiProxy() ? '' : GROQ_API_KEY;
      if (!apiKey?.trim()) throw new Error('No Groq API key available for Whisper STT');

      const formData = new FormData();
      formData.append('file', audioBlob, `audio.${mimeToExt(mimeType)}`);
      formData.append('model', WHISPER_MODEL);
      formData.append('language', 'en');
      formData.append('response_format', 'json');

      const res = await fetch(GROQ_TRANSCRIBE_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        throw new Error(`Whisper ${res.status}${err ? `: ${err.slice(0, 80)}` : ''}`);
      }

      const data = (await res.json()) as { text?: string };
      const text = (data.text ?? '').trim();
      setTranscript(text);
      return text;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  /** Stop recording and return the transcript via the existing promise */
  const stopAndTranscribe = useCallback(() => {
    clearTimers();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      releaseStream();
      setIsListening(false);
      setElapsed(0);
    }
  }, []);

  /** Cancel mid-recording — resolves with '' */
  const stopListening = useCallback(() => {
    clearTimers();
    releaseStream();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setIsListening(false);
    setIsTranscribing(false);
    setElapsed(0);
  }, []);

  const startListening = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices
        .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
        .then(stream => {
          streamRef.current = stream;
          const mimeType = getSupportedMimeType();
          const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
          mediaRecorderRef.current = mr;
          chunksRef.current = [];

          mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

          mr.onstop = async () => {
            clearTimers();
            releaseStream();
            setIsListening(false);
            setElapsed(0);
            try {
              const text = await transcribeChunks(chunksRef.current, mimeType || 'audio/webm');
              resolve(text);
            } catch (err) {
              reject(err instanceof Error ? err : new Error('Transcription failed'));
            }
          };

          mr.onerror = () => {
            clearTimers();
            releaseStream();
            setIsListening(false);
            reject(new Error('Recording error'));
          };

          setIsListening(true);
          setTranscript('');
          setElapsed(0);
          mr.start(250);

          timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
          autoStopRef.current = setTimeout(() => {
            if (mr.state === 'recording') mr.stop();
          }, MAX_RECORD_MS);
        })
        .catch(err => {
          setIsListening(false);
          reject(err instanceof Error ? err : new Error('Microphone access denied'));
        });
    });
  }, [transcribeChunks]);

  return { isListening, isTranscribing, transcript, elapsed, startListening, stopListening, stopAndTranscribe };
}
