import { GeminiAPIClient, ResponseSchema } from '../services/gemini-api/GeminiAPIClient';
import { config } from '../config';
import {
  ParsedMemo,
  RadioScript,
  ScriptSegment,
  DialogueLine,
  SegmentType,
  PersonalityType,
  AnalysisStyle,
  RadioConfig,
} from '../types';

export interface ScriptGeneratorConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

interface ScriptResponse {
  segments: Array<{
    type: string;
    dialogues: Array<{
      speaker: string;
      text: string;
    }>;
  }>;
}

export class ScriptGenerator {
  private geminiClient: GeminiAPIClient;

  constructor(generatorConfig?: ScriptGeneratorConfig) {
    this.geminiClient = new GeminiAPIClient(generatorConfig);
  }

  async generateScript(
    memo: ParsedMemo,
    customConfig?: Partial<RadioConfig>,
  ): Promise<RadioScript> {
    const radioConfig = this.mergeConfig(customConfig);
    const prompt = this.createPrompt(memo, radioConfig.style);
    const responseSchema = this.getResponseSchema();

    try {
      const response = await this.geminiClient.generateStructuredContent<ScriptResponse>(
        prompt, 
        responseSchema
      );
      const script = this.parseStructuredResponse(response);

      const radioShowName = config.get().radioShowName ?? 'CheerCast';
      return {
        ...script,
        title: `${memo.date.getFullYear()}年${memo.date.getMonth() + 1}月${memo.date.getDate()}日の${radioShowName}`,
        date: memo.date,
        duration: radioConfig.duration,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate script: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  createPrompt(memo: ParsedMemo, style: AnalysisStyle): string {
    const personalities = config.get().personalities;
    const styleDescription =
      style === AnalysisStyle.ANALYTICAL ? '分析的に詳細に' : '包括的に幅広く';

    const activitiesText = memo.activities
      .map((activity) => `- ${activity.description}`)
      .join('\n');

    const positiveElementsText = memo.positiveElements.map((element) => `- ${element}`).join('\n');

    // Calculate activity statistics
    const activityCount = memo.activities.length;

    const radioShowName = config.get().radioShowName ?? "Today's You";

    return `あなたはプロフェッショナルなニュース番組のキャスターです。
ユーザーのパーソナルデータを分析し、本日の活動レポートを作成してください。

【番組情報】
番組名: ${radioShowName}
放送日: ${memo.date.toLocaleDateString('ja-JP')}

【キャスター設定】
1. ${personalities.host1.name}（メインキャスター）: ${personalities.host1.character}
2. ${personalities.host2.name}（コメンテーター）: ${personalities.host2.character}

【分析方針】
${styleDescription}、データに基づいた客観的な分析を行ってください。

【本日の活動データ】
総活動数: ${activityCount}件
${activitiesText}

【注目ポイント】
${positiveElementsText}

【台本の構成】
必ず以下の3つのセクションで構成してください：

[オープニング]
- 番組開始の挨拶
- 「${radioShowName}」の紹介（ユーザーの日々の活動を分析するパーソナルニュース番組）
- 本日のハイライト（最も重要な3つの活動を簡潔に紹介）

[メイン]
- トップニュース: 最も重要な活動の詳細分析
- カテゴリー別分析: 仕事、学習、健康などのバランス
- 成果評価: 達成したこととその意義
- 継続性分析: 継続的な取り組みやパターン

[エンディング]
- 本日の総括（データに基づいた客観的な評価）
- 明日の予測・提言
- 番組終了の挨拶

【重要な注意事項】
- 各セクションのtypeは「opening」「main」「ending」のいずれか
- 各発言のspeakerは「${personalities.host1.name}」または「${personalities.host2.name}」
- ニュース番組としてのプロフェッショナルなトーンを保つ
- データや事実に基づいた客観的な分析を行う
- 具体的な数値や統計を交えた報告をする
- キャスター間での役割分担を明確に（メインキャスターが主導、コメンテーターが補足・深掘り）
- リスナーにとって有益な洞察を提供する

JSON形式で台本を作成してください：`;
  }

  parseGeminiResponse(response: string): Omit<RadioScript, 'title' | 'date' | 'duration'> {
    const segments: ScriptSegment[] = [];

    // More flexible regex to match section headers
    const sectionPattern = /\[(オープニング|メイン|エンディング)\]/g;
    const matches = Array.from(response.matchAll(sectionPattern));

    if (matches.length === 0) {
      throw new Error('Invalid script format: no sections found');
    }

    const sectionMap: Record<string, SegmentType> = {
      オープニング: SegmentType.OPENING,
      メイン: SegmentType.MAIN,
      エンディング: SegmentType.ENDING,
    };

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const sectionName = match[1];
      const startIndex = (match.index ?? 0) + match[0].length;
      const endIndex =
        i < matches.length - 1 ? (matches[i + 1].index ?? response.length) : response.length;

      const content = response.substring(startIndex, endIndex);
      const segmentType = sectionMap[sectionName];

      if (segmentType && content.trim()) {
        const dialogues = this.parseDialogues(content);

        if (dialogues.length > 0) {
          segments.push({
            type: segmentType,
            dialogues,
          });
        }
      }
    }

    if (segments.length === 0) {
      throw new Error('Invalid script format: no valid segments found');
    }

    // Extract all dialogues from segments
    const allDialogues = segments.flatMap((segment) => segment.dialogues);

    return { segments, dialogues: allDialogues };
  }

  private parseDialogues(content: string): DialogueLine[] {
    const dialogues: DialogueLine[] = [];
    const lines = content.split('\n').filter((line) => line.trim());

    const personalities = config.get().personalities;
    const speakerMap: Record<string, PersonalityType> = {
      [personalities.host1.name]: PersonalityType.AKARI,
      [personalities.host2.name]: PersonalityType.KENTA,
    };

    for (const line of lines) {
      // Match various formats: "name: text" or "name：text" or "name : text"
      const match = line.match(/^(.+?)\s*[:：]\s*(.+)$/);

      if (match) {
        const [, speakerName, text] = match;
        const speaker = speakerMap[speakerName.trim()];

        if (speaker) {
          dialogues.push({
            speaker,
            personality: speakerName.trim(),
            content: text.trim(),
            text: text.trim(),
          });
        }
      }
    }

    return dialogues;
  }

  private getResponseSchema(): ResponseSchema {
    const personalities = config.get().personalities;
    
    return {
      type: 'object',
      properties: {
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['opening', 'main', 'ending']
              },
              dialogues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    speaker: {
                      type: 'string',
                      enum: [personalities.host1.name, personalities.host2.name]
                    },
                    text: {
                      type: 'string'
                    }
                  },
                  required: ['speaker', 'text']
                }
              }
            },
            required: ['type', 'dialogues']
          }
        }
      },
      required: ['segments']
    };
  }

  private parseStructuredResponse(response: ScriptResponse): Omit<RadioScript, 'title' | 'date' | 'duration'> {
    const segments: ScriptSegment[] = [];
    const personalities = config.get().personalities;
    
    const speakerMap: Record<string, PersonalityType> = {
      [personalities.host1.name]: PersonalityType.AKARI,
      [personalities.host2.name]: PersonalityType.KENTA,
    };

    const segmentTypeMap: Record<string, SegmentType> = {
      'opening': SegmentType.OPENING,
      'main': SegmentType.MAIN,
      'ending': SegmentType.ENDING,
    };

    for (const segment of response.segments) {
      const segmentType = segmentTypeMap[segment.type];
      if (!segmentType) continue;

      const dialogues: DialogueLine[] = segment.dialogues.map(dialogue => ({
        speaker: speakerMap[dialogue.speaker] || PersonalityType.AKARI,
        personality: dialogue.speaker,
        content: dialogue.text,
        text: dialogue.text,
      }));

      if (dialogues.length > 0) {
        segments.push({
          type: segmentType,
          dialogues,
        });
      }
    }

    if (segments.length === 0) {
      throw new Error('Invalid script format: no valid segments found');
    }

    const allDialogues = segments.flatMap((segment) => segment.dialogues);
    return { segments, dialogues: allDialogues };
  }

  private mergeConfig(customConfig?: Partial<RadioConfig>): RadioConfig {
    const defaultConfig = config.get();

    return {
      duration: customConfig?.duration ?? defaultConfig.audio.duration,
      style: customConfig?.style ?? (defaultConfig.praise.style as AnalysisStyle),
      personalities: customConfig?.personalities ?? defaultConfig.personalities,
    };
  }
}
