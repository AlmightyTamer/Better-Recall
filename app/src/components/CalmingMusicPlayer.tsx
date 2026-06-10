import { useRef, useState } from 'react';
import StudioIcon from './StudioIcon';

const DEFAULT_TRACK = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

interface Props {
  url?: string;
  label?: string;
}

export default function CalmingMusicPlayer({ url, label = 'Calming music' }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const src = url || DEFAULT_TRACK;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  return (
    <div className="calming-music">
      <audio ref={audioRef} src={src} loop preload="none" />
      <button type="button" className="calming-music__btn tap-feedback" onClick={toggle}>
        <StudioIcon name={playing ? 'speaker' : 'music'} size={22} />
        <span>{playing ? 'Pause music' : label}</span>
      </button>
    </div>
  );
}
