'use client';

import { useRef, useState, useEffect } from 'react';
import { ScriptData } from '@/lib/types/api';

interface AudioPlayerProps {
  audioUrl: string;
  script: ScriptData;
  duration: number;
}

export function AudioPlayer({ audioUrl, script, duration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changePlaybackRate = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-primary-blue mb-6">PersonalCast 音声レポート</h2>

      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Player Controls */}
      <div className="space-y-6">
        {/* Play/Pause Button and Time */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayPause}
            className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center hover:bg-primary-light-blue transition-colors"
          >
            {isPlaying ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          
          <div className="flex-1">
            <div className="text-sm text-text-secondary">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, var(--primary-blue) 0%, var(--primary-blue) ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">再生速度:</span>
          <div className="flex gap-2">
            {[0.75, 1, 1.25, 1.5].map(rate => (
              <button
                key={rate}
                onClick={() => changePlaybackRate(rate)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  playbackRate === rate
                    ? 'bg-primary-blue text-white'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Script Display */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-text-primary mb-4">台本</h3>
        <div className="max-h-64 overflow-y-auto space-y-4 pr-2">
          {script.sections.map((section, index) => (
            <div key={index} className="flex gap-3">
              <span className="font-medium text-script-speaker flex-shrink-0">
                {section.speaker}:
              </span>
              <p className="text-script-text leading-relaxed">
                {section.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* BGM Credit */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-text-secondary">
          BGM: フリーBGM・音楽素材MusMus{' '}
          <a 
            href="https://musmus.main.jp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-blue hover:text-primary-light-blue underline"
          >
            https://musmus.main.jp
          </a>
        </p>
      </div>
    </div>
  );
}