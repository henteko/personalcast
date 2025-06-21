# CheerCast add-bgm コマンド開発計画書

## 概要

CheerCastで生成された音声ファイルにBGMを追加する `add-bgm` コマンドの開発計画書です。このコマンドは、BGMのボリュームを動的に調整し、プロフェッショナルなラジオ番組のような仕上がりを実現します。

## コマンド仕様

### 基本コマンド
```bash
cheercast add-bgm --bgm /path/to/bgm.mp3 --audio /path/to/audio.mp3
```

### オプション一覧
```bash
Options:
  --bgm, -b <path>         BGMファイルのパス (必須)
  --audio, -a <path>       音声ファイルのパス (必須)
  --output, -o <path>      出力ファイルパス (デフォルト: audio_with_bgm.mp3)
  --bgm-volume <number>    BGMの基本音量 (0-1, デフォルト: 0.3)
  --ducking <number>       音声時のBGM音量低下率 (0-1, デフォルト: 0.15)
  --fade-in <seconds>      BGMフェードイン時間 (デフォルト: 3)
  --fade-out <seconds>     BGMフェードアウト時間 (デフォルト: 3)
  --intro <seconds>        BGMのみの導入時間 (デフォルト: 3)
  --outro <seconds>        BGMのみの終了時間 (デフォルト: 2)
  --help, -h               ヘルプを表示
```

## 技術仕様

### BGM処理フロー

```
Timeline:
0s                3s                                    (end-3s)        end
|-----------------|-------------------------------------|--------------|
[BGM only (100%)] [BGM (15%) + Voice]                  [Fade out]
     Intro              Main Content                        Outro
```

### 主要な処理ステップ

1. **入力検証**
   - ファイル存在確認
   - 形式確認（MP3）
   - 音声長さ取得

2. **BGMループ処理**
   - BGMが音声より短い場合、自動ループ
   - シームレスなループ接続

3. **ダッキング処理**
   - 音声の音量レベル検出
   - BGMボリュームの動的調整
   - スムーズな音量遷移

4. **フェード処理**
   - イントロフェードイン
   - アウトロフェードアウト
   - エンベロープカーブ適用

## 実装計画

### Phase 1: 基本実装（3日）

#### Day 1: コマンド基盤とFFmpeg統合

**タスク:**
1. **CLIコマンド追加**
   ```typescript
   // src/cli/commands/add-bgm.ts
   export class AddBgmCommand {
     async execute(options: AddBgmOptions): Promise<void> {
       // 実装
     }
   }
   ```

2. **オプション定義**
   ```typescript
   interface AddBgmOptions {
     bgm: string;
     audio: string;
     output?: string;
     bgmVolume?: number;
     ducking?: number;
     fadeIn?: number;
     fadeOut?: number;
     intro?: number;
     outro?: number;
   }
   ```

3. **入力検証**
   ```typescript
   // バリデーション実装
   - ファイル存在確認
   - MP3形式確認
   - パラメータ範囲チェック
   ```

#### Day 2: FFmpegサービス拡張

**タスク:**
1. **BGMミキシング機能追加**
   ```typescript
   // src/services/ffmpeg/FFmpegService.ts
   class FFmpegService {
     async addBackgroundMusic(
       audioPath: string,
       bgmPath: string,
       options: BgmMixOptions
     ): Promise<string> {
       // 実装
     }
   }
   ```

2. **複雑なフィルターグラフ構築**
   ```bash
   # FFmpegフィルターグラフ例
   [0:a]volume=1[voice];
   [1:a]aloop=loop=-1:size=2e+09[bgm_loop];
   [bgm_loop]volume=0.3[bgm_vol];
   [bgm_vol]afade=t=in:st=0:d=3[bgm_fade];
   [voice][bgm_fade]amix=inputs=2:duration=longest
   ```

3. **音声解析機能**
   ```typescript
   // 音声レベル検出
   async detectAudioLevels(audioPath: string): Promise<AudioLevels[]>
   ```

#### Day 3: 基本動作確認とテスト

**タスク:**
1. **統合テスト作成**
   ```typescript
   // src/cli/commands/__tests__/add-bgm.test.ts
   - 基本的なBGM追加
   - 各種オプションの動作確認
   - エラーケース
   ```

2. **サンプル生成**
   - テスト用BGMファイル準備
   - 結果サンプルの確認

### Phase 2: 高度な機能実装（3日）

#### Day 4: ダッキング実装

**タスク:**
1. **音声検出アルゴリズム**
   ```typescript
   // src/core/audio/AudioAnalyzer.ts
   export class AudioAnalyzer {
     // RMS (Root Mean Square) による音量レベル検出
     async analyzeAudioLevels(
       audioPath: string,
       windowSize: number = 0.1 // 100ms
     ): Promise<AudioLevel[]> {
       // FFmpegのebur128フィルターを使用
     }
   }
   ```

2. **ダッキングカーブ生成**
   ```typescript
   // src/core/audio/DuckingProcessor.ts
   export class DuckingProcessor {
     generateDuckingCurve(
       audioLevels: AudioLevel[],
       threshold: number,
       ratio: number
     ): VolumeEnvelope {
       // スムーズなボリューム変化カーブを生成
     }
   }
   ```

3. **適応的ダッキング**
   - 音声の強弱に応じた動的調整
   - アタック/リリースタイムの設定

#### Day 5: BGMループとクロスフェード

**タスク:**
1. **シームレスループ実装**
   ```typescript
   // src/core/audio/BgmLooper.ts
   export class BgmLooper {
     async createSeamlessLoop(
       bgmPath: string,
       targetDuration: number
     ): Promise<Buffer> {
       // ループポイント検出
       // クロスフェード処理
     }
   }
   ```

2. **ループポイント最適化**
   - ゼロクロッシング検出
   - 位相整合性確保

3. **クロスフェード処理**
   - ループ接続部のスムーズ化
   - クリック音防止

#### Day 6: エフェクト処理

**タスク:**
1. **EQ処理**
   ```typescript
   // BGMと音声の周波数帯域調整
   interface EQSettings {
     highpass: number;  // 低域カット
     lowshelf: {
       frequency: number;
       gain: number;
     };
   }
   ```

2. **コンプレッサー適用**
   - 全体のダイナミクスを整える
   - 音量の均一化

3. **リミッター処理**
   - クリッピング防止
   - 最終音量調整

### Phase 3: UI/UX改善とプリセット（2日）

#### Day 7: プリセット機能

**タスク:**
1. **プリセット定義**
   ```typescript
   enum BgmPreset {
     GENTLE = 'gentle',      // 優しい（BGM控えめ）
     BALANCED = 'balanced',  // バランス型
     ENERGETIC = 'energetic', // 元気（BGM強め）
     PODCAST = 'podcast',    // ポッドキャスト風
     RADIO = 'radio'        // ラジオ番組風
   }
   ```

2. **プリセット実装**
   ```typescript
   const presets: Record<BgmPreset, BgmMixOptions> = {
     gentle: {
       bgmVolume: 0.2,
       ducking: 0.1,
       fadeIn: 3,
       fadeOut: 4
     },
     // ...
   };
   ```

3. **BGMライブラリ**
   - デフォルトBGM提供
   - カテゴリ別整理

#### Day 8: プログレス表示と最終調整

**タスク:**
1. **進捗表示実装**
   ```typescript
   // リアルタイム進捗表示
   - 処理ステップ表示
   - 推定残り時間
   - プログレスバー
   ```

2. **エラーハンドリング改善**
   - 詳細なエラーメッセージ
   - リカバリー提案

3. **ドキュメント作成**
   - 使用ガイド
   - BGM選択のコツ
   - トラブルシューティング

## 技術詳細

### FFmpegフィルターグラフ詳細

```bash
# 完全なフィルターグラフ例
ffmpeg -i voice.mp3 -i bgm.mp3 -filter_complex "
  # BGMをループ
  [1:a]aloop=loop=-1:size=2e+09[bgm_loop];
  
  # イントロ部分（BGMのみ、フェードイン）
  [bgm_loop]atrim=0:3,afade=t=in:st=0:d=3,volume=0.3[intro];
  
  # メイン部分のBGM（ダッキング適用）
  [bgm_loop]atrim=3,volume=0.15[main_bgm];
  
  # 音声とBGMをミックス
  [0:a]adelay=3000|3000[delayed_voice];
  [delayed_voice][main_bgm]amix=inputs=2:duration=first[main_mix];
  
  # イントロとメインを結合
  [intro][main_mix]concat=n=2:v=0:a=1[prefinal];
  
  # 最終フェードアウト
  [prefinal]afade=t=out:st=57:d=3[final]
" -map "[final]" output.mp3
```

### 音声レベル検出アルゴリズム

```typescript
// RMSベースの音声検出
function detectVoiceActivity(samples: Float32Array, threshold: number): boolean {
  const rms = Math.sqrt(
    samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length
  );
  return rms > threshold;
}

// ダッキングカーブ生成
function generateDuckingEnvelope(
  voiceActivity: boolean[],
  attackTime: number,
  releaseTime: number
): number[] {
  // スムーズな音量変化を生成
}
```

## テスト計画

### ユニットテスト
1. **AudioAnalyzer**
   - 音声レベル検出精度
   - 各種音声形式対応

2. **DuckingProcessor**
   - カーブ生成ロジック
   - エッジケース処理

3. **BgmLooper**
   - ループ接続の滑らかさ
   - 各種BGM長への対応

### 統合テスト
1. **エンドツーエンド**
   - 実際の音声ファイルでの動作
   - 各プリセットの確認

2. **パフォーマンス**
   - 処理時間測定
   - メモリ使用量確認

## リスクと対策

### 技術的リスク
1. **処理時間**
   - リスク: 大きなファイルで処理が遅い
   - 対策: ストリーミング処理、並列化

2. **音質劣化**
   - リスク: 複数回のエンコードで音質低下
   - 対策: 高ビットレート処理、ロスレス中間形式

3. **同期ズレ**
   - リスク: BGMと音声のタイミングずれ
   - 対策: 精密なタイムスタンプ管理

## 成功指標

1. **機能面**
   - 自然なBGMミックス
   - 違和感のないダッキング
   - シームレスなループ

2. **パフォーマンス**
   - 5分の音声: 処理時間 < 30秒
   - メモリ使用量 < 500MB

3. **ユーザビリティ**
   - 直感的なコマンドオプション
   - 分かりやすいエラーメッセージ
   - 豊富なプリセット

## 将来の拡張案

1. **AI駆動のBGM選択**
   - 内容に応じた自動BGM選択
   - ムード検出

2. **マルチトラック対応**
   - 複数BGMのレイヤリング
   - 効果音の追加

3. **Web UI統合**
   - BGMプレビュー機能
   - リアルタイム調整

## まとめ

この`add-bgm`コマンドにより、CheerCastで生成された音声をよりプロフェッショナルで魅力的なコンテンツに仕上げることができます。8日間の開発期間で、基本機能から高度な音声処理まで段階的に実装し、ユーザーフレンドリーなツールを提供します。