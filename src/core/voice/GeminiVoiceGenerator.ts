import { GeminiAPITTSClient } from '../../services/gemini-api/GeminiAPITTSClient';
import { config } from '../../config';
import { RadioScript, DialogueLine, VoiceConfig, AudioBuffer } from '../../types';

export interface VoiceGeneratorConfig {
  apiKey?: string;
}

export class GeminiVoiceGenerator {
  private ttsClient: GeminiAPITTSClient;
  private defaultVoiceConfig: VoiceConfig = {
    languageCode: 'ja-JP',
    speakingRate: 0.95, // Slightly slower for news broadcast clarity
    pitch: -1, // Slightly lower pitch for professional tone
    volumeGainDb: 0,
  };

  constructor(generatorConfig?: VoiceGeneratorConfig) {
    this.ttsClient = new GeminiAPITTSClient({
      apiKey: generatorConfig?.apiKey ?? process.env.GEMINI_API_KEY,
    });
  }

  async generateSpeech(script: RadioScript, options?: { speed?: number }): Promise<AudioBuffer[]> {
    const voiceConfig = { ...this.defaultVoiceConfig };

    if (options?.speed) {
      voiceConfig.speakingRate = options.speed;
    }

    // Try to use multi-speaker generation for better conversation flow
    try {
      const audioBuffer = await this.generateMultiSpeakerAudio(script, voiceConfig);
      return [audioBuffer];
    } catch (error) {
      console.warn('Multi-speaker generation failed, falling back to individual synthesis:', error);
      // Fallback to individual synthesis
      return this.generateIndividualAudios(script, voiceConfig);
    }
  }

  private async generateMultiSpeakerAudio(
    script: RadioScript,
    voiceConfig: VoiceConfig,
  ): Promise<AudioBuffer> {
    const personalities = config.get().personalities;
    const dialogues = script.dialogues || [];

    // Prepare dialogues for multi-speaker synthesis
    const multiSpeakerDialogues = dialogues.map((dialogue) => {
      // Use voice names from config for each personality
      const geminiVoiceName =
        dialogue.personality === personalities.host1.name
          ? personalities.host1.voiceName
          : personalities.host2.voiceName;

      return {
        speakerName: dialogue.personality,
        text: dialogue.content ?? dialogue.text ?? '',
        voiceName: geminiVoiceName,
      };
    });

    const audioData = await this.ttsClient.synthesizeMultiSpeakerSpeech(multiSpeakerDialogues);

    // Estimate total duration based on text length
    const totalText = dialogues.map((d) => d.content ?? d.text ?? '').join(' ');
    const duration = this.estimateDuration(totalText, voiceConfig.speakingRate);

    return {
      data: audioData,
      duration,
    };
  }

  private async generateIndividualAudios(
    script: RadioScript,
    voiceConfig: VoiceConfig,
  ): Promise<AudioBuffer[]> {
    const audioBuffers: AudioBuffer[] = [];

    // Handle script with dialogues array directly
    if (script.dialogues) {
      for (const dialogue of script.dialogues) {
        const audioBuffer = await this.synthesizeDialogue(dialogue, voiceConfig);
        audioBuffers.push(audioBuffer);
      }
    } else if (script.segments) {
      // Generate speech for each dialogue in segments
      for (const segment of script.segments) {
        for (const dialogue of segment.dialogues) {
          const audioBuffer = await this.synthesizeDialogue(dialogue, voiceConfig);
          audioBuffers.push(audioBuffer);
        }
      }
    }

    return audioBuffers;
  }

  async synthesizeDialogue(
    dialogue: DialogueLine,
    voiceConfig?: VoiceConfig,
  ): Promise<AudioBuffer> {
    const personalities = config.get().personalities;
    const audioSpeed = config.get().audio.speed;

    // Use voice names from config for each personality
    const geminiVoiceName =
      dialogue.personality === personalities.host1.name
        ? personalities.host1.voiceName
        : personalities.host2.voiceName;

    const mergedConfig = voiceConfig ?? this.defaultVoiceConfig;

    try {
      const audioData = await this.ttsClient.synthesizeSpeech({
        text: dialogue.content ?? dialogue.text ?? '',
        voice: {
          voiceName: geminiVoiceName,
          speakerId: dialogue.personality,
        },
        speakingRate: mergedConfig.speakingRate * audioSpeed,
      });

      const duration = this.estimateDuration(
        dialogue.content ?? dialogue.text ?? '',
        mergedConfig.speakingRate * audioSpeed,
      );

      return {
        data: audioData,
        duration,
      };
    } catch (error) {
      throw new Error(
        `Failed to synthesize dialogue: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private estimateDuration(text: string, speakingRate: number): number {
    // Estimate duration based on Japanese character count
    // Average speaking rate: ~300 characters per minute at normal speed
    const charCount = text.length;
    const baseRate = 300; // characters per minute
    const adjustedRate = baseRate * speakingRate;
    return (charCount / adjustedRate) * 60; // Convert to seconds
  }
}
