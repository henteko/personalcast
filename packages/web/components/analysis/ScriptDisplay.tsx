import { ScriptData } from '@/lib/types/api';

interface ScriptDisplayProps {
  script: ScriptData;
}

export function ScriptDisplay({ script }: ScriptDisplayProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-primary-blue">{script.title}</h2>
        <p className="text-sm text-text-secondary mt-1">生成されたスクリプト</p>
      </div>

      <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
        {script.sections.map((section, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                  section.speaker === 'あかり'
                    ? 'bg-[var(--akari-color)]'
                    : section.speaker === 'けんた'
                    ? 'bg-[var(--kenta-color)]'
                    : 'bg-gray-400'
                }`}
              >
                {section.speaker.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-script-speaker mb-1">
                {section.speaker}
              </p>
              <p className="text-script-text leading-relaxed whitespace-pre-wrap">
                {section.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-text-secondary">
          このスクリプトは音声生成が完了すると、音声と同期して表示されます
        </p>
      </div>
    </div>
  );
}