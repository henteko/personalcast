import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { config } from '../../config';

export interface GeminiClientConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private temperature: number;

  constructor(clientConfig?: GeminiClientConfig) {
    const apiKey = clientConfig?.apiKey ?? config.getGeminiApiKey();
    this.genAI = new GoogleGenerativeAI(apiKey);
    const geminiConfig = config.get().gemini;
    const modelName = clientConfig?.model ?? geminiConfig.model;
    this.model = this.genAI.getGenerativeModel({
      model: modelName,
    });
    this.temperature = clientConfig?.temperature ?? geminiConfig.temperature;
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: 8192,
        },
      });

      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      return text;
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
