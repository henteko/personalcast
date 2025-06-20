import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { config } from '../../config';

export interface TTSRequest {
  text: string;
  voiceName: string;
  languageCode?: string;
  speakingRate?: number;
  pitch?: number;
  volumeGainDb?: number;
}

export interface TTSClientConfig {
  projectId?: string;
  keyFilename?: string;
}

export class GoogleCloudTTSClient {
  private client: TextToSpeechClient;

  constructor(clientConfig?: TTSClientConfig) {
    const gcpConfig = config.get().googleCloud;
    const clientOptions: Record<string, string> = {};

    const projectId = clientConfig?.projectId ?? gcpConfig.projectId;
    const keyFilename = clientConfig?.keyFilename ?? gcpConfig.keyFilename;

    if (projectId) {
      clientOptions.projectId = projectId;
    }

    if (keyFilename) {
      clientOptions.keyFilename = keyFilename;
    }

    this.client = new TextToSpeechClient(clientOptions);
  }

  async synthesizeSpeech(request: TTSRequest): Promise<Buffer> {
    const {
      text,
      voiceName,
      languageCode = 'ja-JP',
      speakingRate = 1.0,
      pitch = 0,
      volumeGainDb = 0,
    } = request;

    try {
      const [response] = await this.client.synthesizeSpeech({
        input: { text },
        voice: {
          languageCode,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
          pitch,
          volumeGainDb,
        },
      });

      if (!response.audioContent) {
        throw new Error('No audio content in response');
      }

      // audioContent can be string or Uint8Array
      if (typeof response.audioContent === 'string') {
        return Buffer.from(response.audioContent, 'base64');
      } else {
        return Buffer.from(response.audioContent);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Google Cloud TTS error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while synthesizing speech');
    }
  }

  async synthesizeSpeechWithRetry(request: TTSRequest, maxRetries = 3): Promise<Buffer> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.synthesizeSpeech(request);
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError ?? new Error('Failed to synthesize speech after retries');
  }

  estimateDuration(text: string, speakingRate = 1.0): number {
    // Estimate based on Japanese speaking rate (approximately 5-7 characters per second)
    const averageCharsPerSecond = 6;
    const baseDuration = text.length / averageCharsPerSecond;
    return baseDuration / speakingRate;
  }
}
