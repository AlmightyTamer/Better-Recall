import { useCallback, useRef, useState } from 'react';

type SpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript: string; confidence?: number };
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

const LISTEN_MAX_MS = 22_000;
const SILENCE_AFTER_SPEECH_MS = 3_200;

/** Pull the best transcript from the results list — finals plus any trailing interim */
function extractTranscript(results: SpeechRecognitionResultList): string {
  let finals = '';
  let interim = '';
  for (let i = 0; i < results.length; i++) {
    const seg = results[i][0]?.transcript ?? '';
    if (results[i].isFinal) finals += seg;
    else interim += seg;
  }
  const combined = (finals + interim).trim();
  if (combined) return combined;
  return finals.trim();
}

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const stopListening = useCallback(() => {
    clearTimers();
    try {
      recognitionRef.current?.abort();
    } catch {
      recognitionRef.current?.stop();
    }
    recognitionRef.current = null;
    setIsListening(false);
  }, [clearTimers]);

  const startListening = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (!SR) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      try {
        recognitionRef.current?.abort();
      } catch {
        recognitionRef.current?.stop();
      }
      clearTimers();

      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;
      recognitionRef.current = recognition;

      let settled = false;
      let bestText = '';
      let heardSpeech = false;
      let silenceTimer: ReturnType<typeof setTimeout> | null = null;
      let lastResults: SpeechRecognitionResultList | null = null;

      const finish = (text: string) => {
        if (settled) return;
        settled = true;
        clearTimers();
        if (silenceTimer) clearTimeout(silenceTimer);
        recognitionRef.current = null;
        setIsListening(false);
        setTranscript(text);
        resolve(text);
      };

      const scheduleSilenceStop = () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          try {
            recognition.stop();
          } catch {
            finish(bestText);
          }
        }, SILENCE_AFTER_SPEECH_MS);
      };

      recognition.onresult = (e: SpeechRecognitionEvent) => {
        lastResults = e.results;
        const text = extractTranscript(e.results);
        if (text) {
          bestText = text;
          heardSpeech = true;
          setTranscript(text);
          scheduleSilenceStop();
        }
      };

      recognition.onspeechstart = () => {
        heardSpeech = true;
        if (silenceTimer) clearTimeout(silenceTimer);
      };

      recognition.onspeechend = () => {
        if (heardSpeech) scheduleSilenceStop();
      };

      recognition.onerror = (e: { error: string }) => {
        if (settled) return;
        if (e.error === 'aborted') return;
        if (e.error === 'no-speech') {
          try {
            recognition.stop();
          } catch {
            finish(bestText);
          }
          return;
        }
        if (e.error === 'network') {
          settled = true;
          clearTimers();
          setIsListening(false);
          reject(new Error('network'));
          return;
        }
        settled = true;
        clearTimers();
        setIsListening(false);
        reject(new Error(e.error));
      };

      recognition.onend = () => {
        if (settled) return;
        if (lastResults) {
          const final = extractTranscript(lastResults);
          if (final.length > bestText.length) bestText = final;
        }
        finish(bestText);
      };

      timersRef.current.push(
        setTimeout(() => {
          try {
            recognition.stop();
          } catch {
            finish(bestText);
          }
        }, LISTEN_MAX_MS)
      );

      setIsListening(true);
      setTranscript('');

      try {
        recognition.start();
      } catch (err) {
        settled = true;
        setIsListening(false);
        reject(err instanceof Error ? err : new Error('Could not start microphone'));
      }
    });
  }, [clearTimers]);

  return { isListening, transcript, startListening, stopListening };
}
