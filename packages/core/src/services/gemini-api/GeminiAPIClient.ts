import { GoogleGenAI } from '@google/genai';
import { config } from '../../config';

export interface GeminiAPIClientConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export interface ResponseSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
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

  async generateContent(prompt: string, schema: ResponseSchema): Promise<string> {
    try {
      const requestConfig: Record<string, unknown> = {
        temperature: this.temperature,
        maxOutputTokens: 8192,
      };

      requestConfig.responseSchema = schema;
      requestConfig.responseMimeType = 'application/json';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (this.genAI as any).models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: requestConfig,
      });

      if (!response?.text) {
        throw new Error('No text content returned from Gemini API');
      }

      return response.text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while generating content');
    }
  }

  async generateContentWithRetry(prompt: string, schema: ResponseSchema, maxRetries = 3): Promise<string> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.generateContent(prompt, schema);
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

  async generateStructuredContent<T>(prompt: string, schema: ResponseSchema, maxRetries = 3): Promise<T> {
    const response = await this.generateContentWithRetry(prompt, schema, maxRetries);

    try {
      return JSON.parse(response) as T;
    } catch (error) {
      throw new Error(`Failed to parse structured response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
