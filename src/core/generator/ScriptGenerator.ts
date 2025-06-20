import { GeminiClient } from '../../services/gemini';
import { config } from '../../config';
import {
  ParsedMemo,
  RadioScript,
  ScriptSegment,
  DialogueLine,
  SegmentType,
  PersonalityType,
  PraiseStyle,
  RadioConfig,
} from '../../types';

export interface ScriptGeneratorConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
}

export class ScriptGenerator {
  private geminiClient: GeminiClient;

  constructor(generatorConfig?: ScriptGeneratorConfig) {
    this.geminiClient = new GeminiClient(generatorConfig);
  }

  async generateScript(
    memo: ParsedMemo,
    customConfig?: Partial<RadioConfig>,
  ): Promise<RadioScript> {
    const radioConfig = this.mergeConfig(customConfig);
    const prompt = this.createPrompt(memo, radioConfig.style);

    try {
      const response = await this.geminiClient.generateContentWithRetry(prompt);
      const script = this.parseGeminiResponse(response);

      return {
        ...script,
        title: `${memo.date.getFullYear()}年${memo.date.getMonth() + 1}月${memo.date.getDate()}日のCheerCast`,
        date: memo.date,
        duration: radioConfig.duration,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate script: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  createPrompt(memo: ParsedMemo, style: PraiseStyle): string {
    const personalities = config.get().personalities;
    const styleDescription =
      style === PraiseStyle.GENTLE ? '優しく温かく' : 'エネルギッシュに元気よく';

    const activitiesText = memo.activities
      .map((activity) => `- ${activity.description}`)
      .join('\n');

    const positiveElementsText = memo.positiveElements.map((element) => `- ${element}`).join('\n');

    return `あなたは2人のラジオパーソナリティです。
以下の設定で、リスナーの今日の活動を褒めるラジオ番組の台本を作成してください。

【パーソナリティ設定】
1. ${personalities.host1.name}（女性）: ${personalities.host1.character}
2. ${personalities.host2.name}（男性）: ${personalities.host2.character}

【褒めるスタイル】
${styleDescription}褒めてください。

【今日の活動】
${activitiesText}

【ポジティブな要素】
${positiveElementsText}

【台本の構成】
必ず以下の3つのセクションで構成してください：

[オープニング]
- 挨拶と番組の紹介
- 今日も頑張ったリスナーへの労い

[メイン]
- 具体的な活動について褒める
- それぞれの活動の価値や意味を伝える
- 励ましの言葉

[エンディング]
- 今日の総括
- 明日への励まし
- 締めの挨拶

【重要な注意事項】
- 各セクションは[セクション名]で始めてください
- 各発言は「${personalities.host1.name}: 」または「${personalities.host2.name}: 」で始めてください
- 自然な会話のキャッチボールを心がけてください
- 具体的な活動内容に言及してください
- ポジティブで前向きな内容にしてください

台本を作成してください：`;
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

  private mergeConfig(customConfig?: Partial<RadioConfig>): RadioConfig {
    const defaultConfig = config.get();

    return {
      duration: customConfig?.duration ?? defaultConfig.audio.duration,
      style: customConfig?.style ?? (defaultConfig.praise.style as PraiseStyle),
      personalities: customConfig?.personalities ?? defaultConfig.personalities,
    };
  }
}
