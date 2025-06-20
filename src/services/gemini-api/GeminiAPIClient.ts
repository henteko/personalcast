import { GoogleGenAI } from '@google/genai';
import { config } from '../../config';

export interface GeminiAPIClientConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export class GeminiAPIClient {
  private genAI: GoogleGenAI;
  private modelName: string;
  private temperature: number;

  constructor(clientConfig?: GeminiAPIClientConfig) {
    const apiKey = clientConfig?.apiKey ?? process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenAI({ apiKey });

    const geminiConfig = config.get().gemini;
    this.modelName = clientConfig?.model ?? geminiConfig.model;
    this.temperature = clientConfig?.temperature ?? geminiConfig.temperature;
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: this.temperature,
          maxOutputTokens: 8192,
        },
      });

      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = result.candidates[0];
      if (!candidate.content?.parts || candidate.content.parts.length === 0) {
        throw new Error('No content parts in response');
      }

      const textPart = candidate.content.parts.find((part) => 'text' in part);
      if (!textPart || !('text' in textPart) || !textPart.text) {
        throw new Error('No text content in response');
      }

      return textPart.text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while generating content');
    }
  }

  async generateContentWithRetry(prompt: string, maxRetries = 3): Promise<string> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.generateContent(prompt);
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError ?? new Error('Failed to generate content after retries');
  }
}
