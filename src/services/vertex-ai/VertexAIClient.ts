import { VertexAI } from '@google-cloud/vertexai';
import { config } from '../../config';

export interface VertexAIClientConfig {
  projectId?: string;
  location?: string;
  model?: string;
  temperature?: number;
}

interface VertexAIModel {
  generateContent(request: {
    contents: Array<{ role: string; parts: Array<{ text: string }> }>;
    generationConfig?: { temperature?: number; maxOutputTokens?: number };
  }): Promise<{
    response: {
      candidates: Array<{
        content: {
          parts: Array<{ text: string }>;
        };
      }>;
    };
  }>;
}

export class VertexAIClient {
  private vertexAI: VertexAI;
  private model: VertexAIModel;
  private temperature: number;

  constructor(clientConfig?: VertexAIClientConfig) {
    const projectId = clientConfig?.projectId ?? process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = clientConfig?.location ?? process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';

    if (!projectId) {
      throw new Error('Google Cloud Project ID is required for Vertex AI');
    }

    // Set Google Application Default Credentials if keyfile is provided
    if (process.env.GOOGLE_CLOUD_KEYFILE) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_CLOUD_KEYFILE;
    }

    this.vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });

    const geminiConfig = config.get().gemini;
    const modelName = clientConfig?.model ?? geminiConfig.model;

    this.model = this.vertexAI.preview.getGenerativeModel({
      model: modelName,
    }) as VertexAIModel;

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
      const candidates = response.candidates;

      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates returned from Vertex AI');
      }

      const text = candidates[0].content.parts[0].text;

      if (!text) {
        throw new Error('Empty response from Vertex AI');
      }

      return text;
    } catch (error) {
      if (error instanceof Error) {
        // Check for permission errors
        if (error.message.includes('Permission') && error.message.includes('denied')) {
          throw new Error(
            `Vertex AI 権限エラー: サービスアカウントに「Vertex AI ユーザー」ロールを付与してください。\n` +
              `また、プロジェクトでVertex AI APIが有効になっていることを確認してください。\n` +
              `詳細: ${error.message}`,
          );
        }
        throw new Error(`Vertex AI error: ${error.message}`);
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
