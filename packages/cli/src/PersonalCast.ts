import { 
  PersonalCast as CorePersonalCast,
  type GenerationOptions as CoreGenerationOptions,
  type AnalysisStyle
} from '@personalcast/core';

export interface CLIGenerationOptions extends CoreGenerationOptions {
  outputPath: string;
  voiceSpeed?: number;
  bgm?: {
    path: string;
  };
}

export class PersonalCast extends CorePersonalCast {
  // CLI固有の機能（プログレスバー表示など）
  async generateFromFileWithCLIProgress(filePath: string, options: CLIGenerationOptions) {
    console.log('🎙️ PersonalCast を開始します...');

    try {
      // Parse memo
      console.log('📋 メモファイルを解析中...');
      const memo = await this.parseMemoFile(filePath);

      // Generate script
      console.log('📋 ニュース台本を生成中...');
      const script = await this.generateScriptFromMemo(memo, {
        style: options.style as AnalysisStyle | undefined,
        duration: options.duration,
      });

      // Generate speech
      console.log('📋 音声を生成中...');
      const audioBuffers = await this.generateSpeechFromScript(script, {
        speed: options.voiceSpeed,
      });

      // Combine audio
      console.log('📋 音声を結合中...');
      let finalAudio = await this.combineAudioBuffers(audioBuffers);

      // Normalize volume
      console.log('📋 音声を正規化してエクスポート中...');
      finalAudio = await this.normalizeAudioVolume(finalAudio);

      // Export to file
      await this.exportAudioToMP3(finalAudio, options.outputPath);

      // Add BGM if specified
      if (options.bgm) {
        console.log('📋 BGMを追加中...');
        await this.addBackgroundMusic(options.outputPath, options.bgm.path);
        console.log('📋 BGMの追加が完了しました');
      }
      
      console.log('✅ 生成が完了しました！');
      console.log(`📁 出力ファイル: ${options.outputPath}`);
    } catch (error) {
      console.error('❌ 生成に失敗しました:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }


  async previewScriptWithCLI(filePath: string, options: Partial<CLIGenerationOptions>) {
    console.log('📝 台本をプレビューします...');

    try {
      // Parse memo
      console.log('📋 メモファイルを解析中...');
      const memo = await this.parseMemoFile(filePath);

      // Generate script
      console.log('📋 ラジオ台本を生成中...');
      const script = await this.generateScriptFromMemo(memo, {
        style: options.style as AnalysisStyle | undefined,
        duration: options.duration,
      });
      
      console.log('✅ 台本の生成が完了しました！');
      return script;
    } catch (error) {
      console.error('❌ 台本生成に失敗しました:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async addBackgroundMusicWithCLI(
    audioPath: string,
    bgmPath: string,
    outputPath?: string,
  ) {
    console.log('🎵 BGMを追加します...');

    try {
      const output = await this.addBackgroundMusic(audioPath, bgmPath, outputPath);
      
      console.log('✅ BGMの追加が完了しました！');
      console.log(`📁 出力ファイル: ${output}`);
      return output;
    } catch (error) {
      console.error('❌ BGM追加に失敗しました:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}