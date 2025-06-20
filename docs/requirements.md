# CheerCast MVP 要件定義書

## 📋 プロジェクト概要

**プロダクト名**: CheerCast  
**コンセプト**: 毎日のメモから2人のパーソナリティがあなたの頑張りを褒めてくれるラジオ番組を自動生成するCLIツール  
**ターゲット**: 日記やライフログの習慣があり、モチベーション維持に関心のある個人  
**形態**: TypeScript製のCLIツール（Node.js）

## 🎯 MVP目標

### 価値提案
- 毎日の小さな成果や努力を見つけて褒めることで、継続的なモチベーション向上を支援
- 手軽なCLIツールとして、既存のワークフローに組み込みやすい形で提供
- AI技術により、個人に最適化された応援メッセージを生成

### 成功指標
- コア機能（メモ→台本→音声）の動作確認
- 1分以内でのラジオ番組生成
- 自然で聞き取りやすい音声品質
- ユーザビリティテストでの肯定的フィードバック

## 🔧 技術仕様

### 技術スタック
- **言語**: TypeScript
- **ランタイム**: Node.js 18+
- **CLI框架**: Commander.js
- **AI台本生成**: Google Gemini API (gemini-2.5-flash)
- **音声生成**: Google Cloud Text-to-Speech API
- **音声編集**: FFmpeg (fluent-ffmpeg)
- **設定管理**: YAML (js-yaml)

### 開発環境
- TypeScript 5.0+
- ESLint + Prettier
- Jest (テスト)
- GitHub Actions (CI/CD)

## 📋 機能要件

### 🎵 コア機能

#### 1. メモファイル解析機能
**概要**: ローカルファイルを読み込んで内容を解析

```typescript
interface MemoParser {
  parseTextFile(filePath: string): Promise<ParsedMemo>
  parseDirectory(dirPath: string): Promise<ParsedMemo>
  extractDailyActivities(content: string): DailyActivity[]
  categorizeContent(content: string): ContentCategory
}
```

**対応形式**:
- テキストファイル (.txt, .md)
- JSON形式 (.json)
- CSV形式 (.csv)
- ディレクトリ（複数ファイル）

**処理内容**:
- 日付の抽出・正規化
- 活動内容の抽出
- ポジティブな要素の特定

#### 2. AI台本生成機能
**概要**: Gemini APIを使用して2人のパーソナリティによる台本を生成

```typescript
interface ScriptGenerator {
  generateScript(memo: ParsedMemo, config: RadioConfig): Promise<RadioScript>
  createPrompt(memo: ParsedMemo, style: PraiseStyle): string
  parseGeminiResponse(response: string): RadioScript
}
```

**台本構成**:
- オープニング（挨拶）
- メイン（活動の振り返りと褒め）
- エンディング（明日への励まし）

**パーソナリティ設定**:
- ホスト1: あかり（優しい女性、励まし上手）
- ホスト2: けんた（明るい男性、分析好き）

#### 3. 音声生成機能
**概要**: Google Cloud TTSで自然な音声を生成

```typescript
interface VoiceGenerator {
  generateSpeech(script: RadioScript, config: VoiceConfig): Promise<AudioBuffer[]>
  synthesizeDialogue(line: DialogueLine, voiceConfig: PersonalityVoice): Promise<Buffer>
  addPauses(audioBuffers: Buffer[], script: RadioScript): Buffer[]
}
```

**音声設定**:
- 言語: 日本語 (ja-JP)
- あかり: ja-JP-Wavenet-A (女性、温かみのある声)
- けんた: ja-JP-Wavenet-C (男性、明るい声)

#### 4. 音声合成機能
**概要**: 複数の音声を結合し、最適な音量に調整

```typescript
interface AudioMixer {
  combineAudio(audioBuffers: Buffer[]): Promise<Buffer>
  normalizeVolume(audio: Buffer): Buffer
  exportToMP3(audio: Buffer, outputPath: string): Promise<void>
}
```

### 🖥️ CLI機能

#### 基本コマンド
```bash
# メイン機能
cheercast generate -i memo.txt -o today.mp3

# プレビュー
cheercast preview -i memo.txt

# 初期設定
cheercast init
```

#### 必須オプション
- `-i, --input`: 入力ファイル/ディレクトリ（必須）
- `-o, --output`: 出力ファイル名（デフォルト: radio_{date}.mp3）

#### 基本オプション
- `-t, --type`: 番組タイプ (daily|weekly) [default: daily]
- `-s, --style`: 褒めスタイル (gentle|energetic) [default: gentle]
- `-d, --duration`: 番組長さ (5|10|15分) [default: 10]

### ⚙️ 設定管理機能

#### 設定ファイル (cheercast.config.yaml)
```yaml
radioShowName: "CheerCast"

personalities:
  host1:
    name: "あかり"
    voiceName: "ja-JP-Wavenet-A"
    character: "優しくて励まし上手"
  host2:
    name: "けんた" 
    voiceName: "ja-JP-Wavenet-C"
    character: "明るくて分析好き"

praise:
  style: "gentle"
  focusAreas: ["work", "learning", "health"]
  
audio:
  duration: 10
  speed: 1.0

gemini:
  model: "gemini-2.5-flash"
  temperature: 0.7
```

## 📊 非機能要件

### パフォーマンス
- **台本生成時間**: 30秒以内
- **音声生成時間**: 2分以内（10分番組）
- **総処理時間**: 5分以内
- **ファイルサイズ**: 10分番組で10MB以下

### 信頼性
- **エラーハンドリング**: API失敗時の適切なエラーメッセージ
- **リトライ機能**: ネットワークエラー時の自動リトライ（3回）
- **入力検証**: 不正なファイル形式の検出と警告

### セキュリティ
- **API Key管理**: 環境変数での管理
- **ローカル処理**: メモ内容はローカルでのみ処理
- **一時ファイル**: 処理後の自動削除

### ユーザビリティ
- **直感的なコマンド**: 最小限のオプションで動作
- **分かりやすいエラー**: 日本語での親切なエラーメッセージ
- **プログレス表示**: 処理状況の可視化

## 📝 制約事項

### 技術的制約
- Node.js 18+ 必須
- FFmpeg のシステムインストール必要
- Google Cloud アカウント・API Key 必須
- インターネット接続必須（API使用のため）

### 費用制約
- Gemini API: 無料枠内での利用想定
- Google Cloud TTS: 100万文字/月の無料枠
- その他のクラウドサービス利用なし

### 機能制約
- オフライン動作不可
- リアルタイム処理非対応
- 他言語サポートなし（日本語のみ）
- Web UI なし（CLI のみ）

