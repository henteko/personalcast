'use client';

import { ScriptData } from '@/lib/types/api';

interface AudioPlayerProps {
  audioUrl: string;
  script: ScriptData;
  duration: number;
}

export function AudioPlayer({ audioUrl, script }: AudioPlayerProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-primary-blue mb-6">{script.title}</h2>

      {/* Native Audio Player */}
      <div className="mb-8">
        <audio 
          controls 
          className="w-full"
          src={audioUrl}
          preload="metadata"
        >
          お使いのブラウザは音声タグをサポートしていません。
        </audio>
      </div>

      {/* Script Display */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-text-primary mb-4">スクリプト</h3>
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