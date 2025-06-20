import { GoogleGenAI } from '@google/genai';

export interface GeminiAPITTSConfig {
  apiKey?: string;
  model?: string;
}

export interface VoiceConfig {
  voiceName: string;
  speakerId?: string;
}

export interface TTSRequest {
  text: string;
  voice: VoiceConfig;
  speakingRate?: number;
}

interface AudioPart {
  inlineData?: {
    data: string;
    mimeType?: string;
  };
}

export class GeminiAPITTSClient {
  private genAI: GoogleGenAI;
  private modelName: string;

  constructor(clientConfig?: GeminiAPITTSConfig) {
    const apiKey = clientConfig?.apiKey ?? process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Gemini API key is required for Gemini TTS');
    }

    this.genAI = new GoogleGenAI({ apiKey });
    this.modelName = clientConfig?.model ?? 'gemini-2.5-flash-preview-tts';
  }

  async synthesizeSpeech(request: TTSRequest): Promise<Buffer> {
    try {
      const result = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: request.text,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: request.voice.voiceName,
              },
            },
          },
        },
      });

      // Extract audio from response
      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No candidates in response');
      }

      const candidate = result.candidates[0];
      if (!candidate.content?.parts || candidate.content.parts.length === 0) {
        throw new Error('No content parts in response');
      }

      // Find the audio part
      const audioPart = candidate.content.parts.find(
        (part): part is AudioPart => !!(part as AudioPart).inlineData?.mimeType?.includes('audio'),
      );

      if (!audioPart?.inlineData?.data) {
        throw new Error('No audio data in response');
      }

      // Convert base64 audio data to Buffer
      const audioBuffer = Buffer.from(audioPart.inlineData.data, 'base64');

      return audioBuffer;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API TTS error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while generating speech');
    }
  }

  async synthesizeMultiSpeakerSpeech(
    dialogues: Array<{ speakerName: string; text: string; voiceName: string }>,
  ): Promise<Buffer> {
    try {
      // Create conversation text with speaker names
      let conversationText = dialogues.map((d) => `${d.speakerName}: ${d.text}`).join('\n\n');
      conversationText =
        'Please read aloud the following in a podcast interview style:\n\n' + conversationText;

      // Create speaker voice configs for multi-speaker synthesis
      const speakerVoiceConfigs = dialogues.map((d) => ({
        speaker: d.speakerName,
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: d.voiceName,
          },
        },
      }));

      // Remove duplicates by speaker name
      const uniqueSpeakerConfigs = speakerVoiceConfigs.filter(
        (config, index, self) => index === self.findIndex((c) => c.speaker === config.speaker),
      );

      const result = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: conversationText,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: uniqueSpeakerConfigs,
            },
          },
        },
      });

      // Extract audio from response
      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No candidates in response');
      }

      const candidate = result.candidates[0];
      if (!candidate.content?.parts || candidate.content.parts.length === 0) {
        throw new Error('No content parts in response');
      }

      // Find the audio part
      const audioPart = candidate.content.parts.find(
        (part): part is AudioPart => !!(part as AudioPart).inlineData?.mimeType?.includes('audio'),
      );

      if (!audioPart?.inlineData?.data) {
        throw new Error('No audio data in response');
      }

      // Convert base64 audio data to Buffer
      const audioBuffer = Buffer.from(audioPart.inlineData.data, 'base64');

      return audioBuffer;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API TTS multi-speaker error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while generating multi-speaker speech');
    }
  }
}
