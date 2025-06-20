import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { config } from '../../config';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = config.getGeminiApiKey();
    this.genAI = new GoogleGenerativeAI(apiKey);
    const geminiConfig = config.get().gemini;
    this.model = this.genAI.getGenerativeModel({
      model: geminiConfig.model,
    });
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: config.get().gemini.temperature,
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
