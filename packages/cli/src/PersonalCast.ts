import { 
  PersonalCast as CorePersonalCast,
  type GenerationOptions as CoreGenerationOptions
} from '@personalcast/core';

export interface CLIGenerationOptions extends CoreGenerationOptions {
  outputPath: string;
  voiceSpeed?: number;
  bgm?: {
    path: string;
    volume?: number;
    ducking?: number;
    fadeIn?: number;
    fadeOut?: number;
    intro?: number;
    outro?: number;
  };
}

export class PersonalCast extends CorePersonalCast {
  // CLI固有の機能（プログレスバー表示など）
  async generateFromFileWithCLIProgress(filePath: string, options: CLIGenerationOptions) {
    console.log('🎙️ PersonalCast を開始します...');
    
    const cliProgressHandler = (message: string) => {
      console.log(`📋 ${message}`);
    };

    try {
      await this.generateFromFile(filePath, {
        ...options,
        onProgress: cliProgressHandler
      });
      
      console.log('✅ 生成が完了しました！');
      console.log(`📁 出力ファイル: ${options.outputPath}`);
    } catch (error) {
      console.error('❌ 生成に失敗しました:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }


  async previewScriptWithCLI(filePath: string, options: Partial<CLIGenerationOptions>) {
    console.log('📝 台本をプレビューします...');
    
    const cliProgressHandler = (message: string) => {
      console.log(`📋 ${message}`);
    };

    try {
      const script = await this.previewScript(filePath, {
        ...options,
        onProgress: cliProgressHandler
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
    options: {
      output?: string;
      bgmVolume?: number;
      ducking?: number;
      fadeIn?: number;
      fadeOut?: number;
      intro?: number;
      outro?: number;
    }
  ) {
    console.log('🎵 BGMを追加します...');
    
    const cliProgressHandler = (message: string) => {
      console.log(`📋 ${message}`);
    };

    try {
      const outputPath = await this.addBackgroundMusic(audioPath, bgmPath, {
        ...options,
        onProgress: cliProgressHandler
      });
      
      console.log('✅ BGMの追加が完了しました！');
      console.log(`📁 出力ファイル: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('❌ BGM追加に失敗しました:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}