import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { VoiceGenerator } from '../VoiceGenerator';
import { GoogleCloudTTSClient } from '../../../services/gcp-tts';
import {
  RadioScript,
  SegmentType,
  PersonalityType,
  VoiceConfig,
  AudioBuffer,
} from '../../../types';

jest.mock('../../../services/gcp-tts');
jest.mock('../../../config', () => ({
  config: {
    get: () => ({
      personalities: {
        host1: { name: 'あかり', voiceName: 'ja-JP-Wavenet-A' },
        host2: { name: 'けんた', voiceName: 'ja-JP-Wavenet-C' },
      },
      audio: { speed: 1.0 },
    }),
  },
}));

describe('VoiceGenerator', () => {
  let generator: VoiceGenerator;
  let mockTTSClient: jest.Mocked<GoogleCloudTTSClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTTSClient = new GoogleCloudTTSClient() as jest.Mocked<GoogleCloudTTSClient>;
    generator = new VoiceGenerator();
    // @ts-expect-error - Accessing private property for testing
    generator.ttsClient = mockTTSClient;
  });

  describe('generateSpeech', () => {
    it('should generate audio buffers for radio script', async () => {
      const script: RadioScript = {
        title: 'Test Radio',
        date: new Date(),
        duration: 10,
        segments: [
          {
            type: SegmentType.OPENING,
            dialogues: [
              { speaker: PersonalityType.AKARI, text: 'こんにちは！' },
              { speaker: PersonalityType.KENTA, text: '今日も頑張りましたね！' },
            ],
          },
        ],
      };

      const mockAudioData = Buffer.from('mock audio data');
      mockTTSClient.synthesizeSpeechWithRetry.mockResolvedValue(mockAudioData);
      mockTTSClient.estimateDuration.mockReturnValue(2.0);

      const result = await generator.generateSpeech(script);

      expect(result).toHaveLength(3); // 2 audio buffers + 1 pause
      expect(result[0].data).toBe(mockAudioData);
      expect(result[0].duration).toBe(2.0);
      expect(result[1].duration).toBe(0.5); // Default pause between dialogues
      expect(result[2].data).toBe(mockAudioData);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockTTSClient.synthesizeSpeechWithRetry).toHaveBeenCalledTimes(2);
    });

    it('should use custom voice config if provided', async () => {
      const script: RadioScript = {
        title: 'Test',
        date: new Date(),
        duration: 5,
        segments: [
          {
            type: SegmentType.MAIN,
            dialogues: [{ speaker: PersonalityType.AKARI, text: 'テスト' }],
          },
        ],
      };

      const customConfig: VoiceConfig = {
        languageCode: 'en-US',
        speakingRate: 1.5,
        pitch: 2,
        volumeGainDb: 5,
      };

      mockTTSClient.synthesizeSpeechWithRetry.mockResolvedValue(Buffer.from('audio'));
      mockTTSClient.estimateDuration.mockReturnValue(1.0);

      await generator.generateSpeech(script, customConfig);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockTTSClient.synthesizeSpeechWithRetry).toHaveBeenCalledWith({
        text: 'テスト',
        voiceName: 'ja-JP-Wavenet-A',
        languageCode: 'en-US',
        speakingRate: 1.5,
        pitch: 2,
        volumeGainDb: 5,
      });
    });
  });

  describe('synthesizeDialogue', () => {
    it('should synthesize dialogue for Akari', async () => {
      const dialogue = {
        speaker: PersonalityType.AKARI,
        text: 'こんにちは！CheerCastです！',
      };

      const mockAudio = Buffer.from('akari audio');
      mockTTSClient.synthesizeSpeechWithRetry.mockResolvedValue(mockAudio);
      mockTTSClient.estimateDuration.mockReturnValue(3.0);

      const result = await generator.synthesizeDialogue(dialogue);

      expect(result.data).toBe(mockAudio);
      expect(result.duration).toBe(3.0);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockTTSClient.synthesizeSpeechWithRetry).toHaveBeenCalledWith({
        text: 'こんにちは！CheerCastです！',
        voiceName: 'ja-JP-Wavenet-A',
        languageCode: 'ja-JP',
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0,
      });
    });

    it('should synthesize dialogue for Kenta', async () => {
      const dialogue = {
        speaker: PersonalityType.KENTA,
        text: '素晴らしい成果ですね！',
      };

      const mockAudio = Buffer.from('kenta audio');
      mockTTSClient.synthesizeSpeechWithRetry.mockResolvedValue(mockAudio);
      mockTTSClient.estimateDuration.mockReturnValue(2.5);

      const result = await generator.synthesizeDialogue(dialogue);

      expect(result.data).toBe(mockAudio);
      expect(result.duration).toBe(2.5);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockTTSClient.synthesizeSpeechWithRetry).toHaveBeenCalledWith({
        text: '素晴らしい成果ですね！',
        voiceName: 'ja-JP-Wavenet-C',
        languageCode: 'ja-JP',
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0,
      });
    });
  });

  describe('addPauses', () => {
    it('should add pauses between audio buffers', () => {
      const audioBuffers: AudioBuffer[] = [
        { data: Buffer.from('audio1'), duration: 2.0 },
        { data: Buffer.from('audio2'), duration: 3.0 },
      ];

      const script: RadioScript = {
        title: 'Test',
        date: new Date(),
        duration: 10,
        segments: [
          {
            type: SegmentType.OPENING,
            dialogues: [
              { speaker: PersonalityType.AKARI, text: 'Hello', pause: 1.5 },
              { speaker: PersonalityType.KENTA, text: 'Hi' },
            ],
          },
        ],
      };

      const result = generator.addPauses(audioBuffers, script);

      expect(result).toHaveLength(3); // 2 audio + 1 pause
      expect(result[1].data.length).toBeGreaterThan(0); // Pause buffer
      expect(result[1].duration).toBe(1.5);
    });

    it('should add default pauses between segments', () => {
      const audioBuffers: AudioBuffer[] = [
        { data: Buffer.from('opening'), duration: 5.0 },
        { data: Buffer.from('main'), duration: 10.0 },
      ];

      const script: RadioScript = {
        title: 'Test',
        date: new Date(),
        duration: 20,
        segments: [
          {
            type: SegmentType.OPENING,
            dialogues: [{ speaker: PersonalityType.AKARI, text: 'Opening' }],
          },
          {
            type: SegmentType.MAIN,
            dialogues: [{ speaker: PersonalityType.KENTA, text: 'Main' }],
          },
        ],
      };

      const result = generator.addPauses(audioBuffers, script);

      expect(result.length).toBeGreaterThan(audioBuffers.length);
      // Should have pause between segments
      const pauseBuffer = result.find((_, idx) => idx === 1);
      expect(pauseBuffer?.duration).toBeGreaterThan(0);
    });
  });
});
