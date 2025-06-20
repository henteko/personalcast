import { MemoParser } from '../../core/parser';
import { ScriptGenerator } from '../../core/generator';
import { PraiseStyle, PersonalityType } from '../../types';
import { config } from '../../config';
import {
  validateInputPath,
  validateProgramType,
  validatePraiseStyle,
  validateEnvironmentVariables,
} from '../../utils/validation';

interface PreviewOptions {
  input: string;
  type: string;
  style: string;
}

export async function previewCommand(options: PreviewOptions): Promise<void> {
  // Validate environment variables first
  const envValidation = validateEnvironmentVariables();
  if (!envValidation.valid) {
    console.error(`❌ ${envValidation.error}`);
    process.exit(1);
  }

  // Validate inputs
  const validations = [
    await validateInputPath(options.input),
    validateProgramType(options.type),
    validatePraiseStyle(options.style),
  ];

  const invalidValidation = validations.find((v) => !v.valid);
  if (invalidValidation) {
    console.error(`❌ ${invalidValidation.error}`);
    process.exit(1);
  }

  try {
    console.log('📝 台本プレビューを生成中...\n');

    // Parse memo
    const parser = new MemoParser();
    const memo = await parser.parseTextFile(options.input);

    // Generate script
    const generator = new ScriptGenerator();
    const script = await generator.generateScript(memo, {
      style: options.style as PraiseStyle,
    });

    // Display script
    console.log('='.repeat(60));
    console.log(`📻 ${script.title}`);
    console.log(`📅 ${script.date.toLocaleDateString('ja-JP')}`);
    console.log(`⏱️  推定時間: ${script.duration}分`);
    console.log('='.repeat(60));
    console.log();

    const personalities = config.get().personalities;

    if (script.segments) {
      // セグメント形式の場合
      for (const segment of script.segments) {
        console.log(`【${getSegmentName(segment.type)}】`);
        console.log();

        for (const dialogue of segment.dialogues) {
          const speaker =
            dialogue.speaker === PersonalityType.AKARI
              ? personalities.host1.name
              : personalities.host2.name;
          console.log(`${speaker}: ${dialogue.text ?? dialogue.content}`);

          if (dialogue.pause) {
            console.log(`（間: ${dialogue.pause}秒）`);
          }
        }

        console.log();
      }
    } else {
      // dialogues配列形式の場合
      for (const dialogue of script.dialogues) {
        const speaker = dialogue.personality || 'ナレーター';
        console.log(`${speaker}: ${dialogue.text ?? dialogue.content}`);

        if (dialogue.pause) {
          console.log(`（間: ${dialogue.pause}秒）`);
        }
      }
      console.log();
    }

    console.log('='.repeat(60));
    console.log('\n✅ 台本プレビューの生成が完了しました');
  } catch (error) {
    console.error(`❌ エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    process.exit(1);
  }
}

function getSegmentName(type: string): string {
  const names: Record<string, string> = {
    opening: 'オープニング',
    main: 'メイン',
    ending: 'エンディング',
  };
  return names[type] || type;
}
