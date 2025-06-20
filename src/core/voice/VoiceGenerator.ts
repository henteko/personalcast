import { GoogleCloudTTSClient } from '../../services/gcp-tts';
import { config } from '../../config';
import { RadioScript, DialogueLine, VoiceConfig, AudioBuffer, SegmentType } from '../../types';

export interface VoiceGeneratorConfig {
  projectId?: string;
  keyFilename?: string;
}

export class VoiceGenerator {
  private ttsClient: GoogleCloudTTSClient;
  private defaultVoiceConfig: VoiceConfig = {
    languageCode: 'ja-JP',
    speakingRate: 1.0,
    pitch: 0,
    volumeGainDb: 0,
  };

  constructor(generatorConfig?: VoiceGeneratorConfig) {
    this.ttsClient = new GoogleCloudTTSClient(generatorConfig);
  }

  async generateSpeech(script: RadioScript, options?: { speed?: number }): Promise<AudioBuffer[]> {
    const audioBuffers: AudioBuffer[] = [];
    const voiceConfig = { ...this.defaultVoiceConfig };

    if (options?.speed) {
      voiceConfig.speakingRate = options.speed;
    }

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

    // Add pauses between dialogues
    return this.addPauses(audioBuffers, script);
  }

  async synthesizeDialogue(
    dialogue: DialogueLine,
    voiceConfig?: VoiceConfig,
  ): Promise<AudioBuffer> {
    const personalities = config.get().personalities;
    const audioSpeed = config.get().audio.speed;

    const voiceName =
      dialogue.personality === personalities.host1.name
        ? personalities.host1.voiceName
        : personalities.host2.voiceName;

    const mergedConfig = voiceConfig ?? this.defaultVoiceConfig;

    try {
      const audioData = await this.ttsClient.synthesizeSpeechWithRetry({
        text: dialogue.content ?? dialogue.text ?? '',
        voiceName,
        languageCode: mergedConfig.languageCode,
        speakingRate: mergedConfig.speakingRate * audioSpeed,
        pitch: mergedConfig.pitch,
        volumeGainDb: mergedConfig.volumeGainDb,
      });

      const duration = this.ttsClient.estimateDuration(
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

  addPauses(audioBuffers: AudioBuffer[], script: RadioScript): AudioBuffer[] {
    const result: AudioBuffer[] = [];

    // If script has direct dialogues array, just add pauses between them
    if (script.dialogues && !script.segments) {
      for (let i = 0; i < audioBuffers.length; i++) {
        result.push(audioBuffers[i]);

        // Add pause between dialogues
        if (i < audioBuffers.length - 1) {
          result.push(this.createSilenceBuffer(0.5));
        }
      }
      return result;
    }

    // Handle segments-based scripts
    if (!script.segments) {
      return audioBuffers;
    }

    let dialogueIndex = 0;
    for (let segmentIndex = 0; segmentIndex < script.segments.length; segmentIndex++) {
      const segment = script.segments[segmentIndex];

      for (let i = 0; i < segment.dialogues.length; i++) {
        const dialogue = segment.dialogues[i];

        // Add the audio buffer
        if (dialogueIndex < audioBuffers.length) {
          result.push(audioBuffers[dialogueIndex]);
          dialogueIndex++;
        }

        // Add pause after dialogue if specified
        if (dialogue.pause && dialogue.pause > 0) {
          result.push(this.createSilenceBuffer(dialogue.pause));
        } else if (i < segment.dialogues.length - 1) {
          // Add default pause between dialogues within a segment
          result.push(this.createSilenceBuffer(0.5));
        }
      }

      // Add pause between segments
      if (segmentIndex < script.segments.length - 1) {
        const pauseDuration = this.getSegmentPauseDuration(
          segment.type,
          script.segments[segmentIndex + 1].type,
        );
        result.push(this.createSilenceBuffer(pauseDuration));
      }
    }

    return result;
  }

  private createSilenceBuffer(duration: number): AudioBuffer {
    // Create silence buffer (MP3 format)
    // For simplicity, we'll create a very small silent MP3
    // In production, you'd want to generate proper silence with the correct duration
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const silence = Buffer.alloc(numSamples * 2); // 16-bit audio

    return {
      data: silence,
      duration,
    };
  }

  private getSegmentPauseDuration(currentType: SegmentType, nextType: SegmentType): number {
    // Define pause durations between different segment types
    if (currentType === SegmentType.OPENING && nextType === SegmentType.MAIN) {
      return 1.0;
    }
    if (currentType === SegmentType.MAIN && nextType === SegmentType.ENDING) {
      return 1.5;
    }
    return 0.8; // Default pause
  }
}
