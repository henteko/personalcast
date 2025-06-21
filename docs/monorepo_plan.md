# PersonalCast モノレポ移行計画

## 📋 概要

PersonalCastプロジェクトをモノレポ環境に移行し、CLI版とWeb版の両方を効率的に開発・管理できる構造に変更する計画です。

## 🎯 目標

- **コードの再利用**: コアロジックを共通ライブラリ化
- **開発効率の向上**: CLI版とWeb版で同じ機能を提供
- **保守性の向上**: 機能追加・修正の影響範囲を明確化
- **独立したデプロイ**: CLI版とWeb版を独立してリリース可能

## 🏗️ 提案するディレクトリ構造

```
personalcast/
├── packages/
│   ├── core/                    # 共通ライブラリ（コアロジック）
│   │   ├── src/
│   │   │   ├── parser/          # MemoParser
│   │   │   ├── generator/       # ScriptGenerator
│   │   │   ├── voice/           # GeminiVoiceGenerator
│   │   │   ├── mixer/           # AudioMixer
│   │   │   ├── services/        # Gemini API, FFmpeg
│   │   │   ├── utils/           # ユーティリティ
│   │   │   ├── types/           # 型定義
│   │   │   ├── config/          # 設定管理
│   │   │   └── index.ts         # エクスポート
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── cli/                     # CLIアプリケーション
│   │   ├── src/
│   │   │   ├── commands/        # CLI コマンド
│   │   │   ├── PersonalCast.ts     # CLI用オーケストレーター
│   │   │   └── index.ts         # CLI エントリーポイント
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── web/                     # Webアプリケーション（Next.js）
│       ├── src/
│       │   ├── app/             # Next.js App Router
│       │   │   ├── api/         # API routes
│       │   │   ├── components/  # React コンポーネント
│       │   │   └── lib/         # Web固有のロジック
│       │   └── types/           # Web固有の型定義
│       ├── public/              # 静的ファイル
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── README.md
│
├── docs/                        # 共通ドキュメント
│   ├── monorepo_plan.md         # このファイル
│   ├── cloud-run-requirements.md
│   └── api-specification.md
├── scripts/                     # 共通ビルドスクリプト
├── .github/                     # CI/CD設定
│   └── workflows/
│       ├── ci.yml
│       ├── cli-release.yml
│       └── web-deploy.yml
├── package.json                 # ルートパッケージ（workspace設定）
├── tsconfig.json               # 共通TypeScript設定
├── jest.config.js              # 共通テスト設定
├── eslint.config.js            # 共通ESLint設定
└── README.md
```

## 📦 パッケージ構成

### 1. `packages/core` - 共通ライブラリ

#### package.json
```json
{
  "name": "@personalcast/core",
  "version": "0.1.0",
  "description": "PersonalCast core library for memo analysis and audio generation",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./parser": "./dist/parser/index.js",
    "./generator": "./dist/generator/index.js",
    "./voice": "./dist/voice/index.js",
    "./mixer": "./dist/mixer/index.js",
    "./types": "./dist/types/index.js",
    "./config": "./dist/config/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "fluent-ffmpeg": "^2.1.3",
    "dotenv": "^16.5.0"
  },
  "peerDependencies": {
    "typescript": "^5.8.3"
  }
}
```

#### エクスポート構造
```typescript
// packages/core/src/index.ts
export { PersonalCast } from './PersonalCast';
export { MemoParser } from './parser';
export { ScriptGenerator } from './generator';
export { GeminiVoiceGenerator } from './voice';
export { AudioMixer } from './mixer';
export * from './types';
export * from './config';
export * from './services';
export * from './utils';
```

### 2. `packages/cli` - CLIアプリケーション

#### package.json
```json
{
  "name": "personalcast",
  "version": "0.1.0",
  "description": "毎日のメモから2人のキャスターがあなたの活動を分析・紹介するパーソナルニュース番組を自動生成するCLIツール",
  "main": "dist/index.js",
  "bin": {
    "personalcast": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@personalcast/core": "workspace:*",
    "commander": "^14.0.0"
  }
}
```

#### CLI固有の実装
```typescript
// packages/cli/src/PersonalCast.ts
import { 
  PersonalCast as CorePersonalCast,
  type PersonalCastConfig 
} from '@personalcast/core';

export class PersonalCast extends CorePersonalCast {
  // CLI固有の機能（プログレスバー表示など）
  async generateWithCLIProgress(memoPath: string) {
    console.log('🎙️ PersonalCast を開始します...');
    
    const result = await this.generate(memoPath, {
      onProgress: (progress, status) => {
        console.log(`[${progress}%] ${status}`);
      }
    });
    
    console.log('✅ 生成が完了しました！');
    return result;
  }
}
```

### 3. `packages/web` - Webアプリケーション

#### package.json
```json
{
  "name": "@personalcast/web",
  "version": "0.1.0",
  "description": "PersonalCast Web Application",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "lint": "next lint"
  },
  "dependencies": {
    "@personalcast/core": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

#### Web固有の実装
```typescript
// packages/web/src/lib/personalcast.ts
import { 
  PersonalCast as CorePersonalCast,
  MemoParser,
  ScriptGenerator,
  GeminiVoiceGenerator,
  AudioMixer,
  type ParsedMemo,
  type GeneratedScript,
  type PersonalCastConfig
} from '@personalcast/core';

export class WebPersonalCast {
  private personalcast: CorePersonalCast;

  constructor(config: PersonalCastConfig) {
    this.personalcast = new CorePersonalCast(config);
  }

  // Web向けの非同期処理ラッパー
  async generateWithProgress(
    memoText: string,
    onProgress: (progress: number, status: string) => void
  ) {
    try {
      // 1. メモ解析
      onProgress(10, 'メモを解析中...');
      const parser = new MemoParser();
      const parsedMemo = await parser.parse(memoText);

      // 2. 台本生成
      onProgress(30, '台本を生成中...');
      const generator = new ScriptGenerator();
      const script = await generator.generate(parsedMemo);

      // 3. 音声生成
      onProgress(60, '音声を生成中...');
      const voiceGenerator = new GeminiVoiceGenerator();
      const audioFiles = await voiceGenerator.generate(script);

      // 4. 音声ミキシング
      onProgress(90, '音声をミキシング中...');
      const mixer = new AudioMixer();
      const finalAudio = await mixer.mix(audioFiles);

      onProgress(100, '完了');
      return { script, audioUrl: finalAudio };
    } catch (error) {
      throw new Error(`生成に失敗しました: ${error.message}`);
    }
  }

  // 台本のみ生成（音声生成前のプレビュー用）
  async generateScriptOnly(memoText: string) {
    const parser = new MemoParser();
    const parsedMemo = await parser.parse(memoText);
    
    const generator = new ScriptGenerator();
    return await generator.generate(parsedMemo);
  }
}
```

### 4. ルート `package.json` - Workspace設定

```json
{
  "name": "personalcast-monorepo",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build:core && npm run build:cli && npm run build:web",
    "build:core": "npm run build -w packages/core",
    "build:cli": "npm run build -w packages/cli", 
    "build:web": "npm run build -w packages/web",
    "dev:cli": "npm run dev -w packages/cli",
    "dev:web": "npm run dev -w packages/web",
    "test": "npm run test --workspaces",
    "test:core": "npm run test -w packages/core",
    "test:cli": "npm run test -w packages/cli",
    "test:web": "npm run test -w packages/web",
    "lint": "npm run lint --workspaces",
    "typecheck": "npm run typecheck --workspaces",
    "clean": "rm -rf packages/*/dist packages/*/node_modules node_modules",
    "install:all": "npm install"
  },
  "devDependencies": {
    "@types/node": "^24.0.3",
    "@typescript-eslint/eslint-plugin": "^8.34.1",
    "@typescript-eslint/parser": "^8.34.1",
    "eslint": "^9.29.0",
    "eslint-config-prettier": "^10.1.5",
    "jest": "^29.7.0",
    "prettier": "^3.5.3",
    "typescript": "^5.8.3"
  }
}
```

## 🚀 移行手順

### Phase 1: プロジェクト構造の準備 (1-2日)

1. **ディレクトリ構造の作成**
   ```bash
   mkdir -p packages/{core,cli,web}
   mkdir -p packages/core/src/{parser,generator,voice,mixer,services,utils,types,config}
   mkdir -p packages/cli/src/{commands}
   mkdir -p packages/web/src/{app,components,lib}
   ```

2. **ルートworkspace設定**
   - ルート `package.json` をworkspace設定に更新
   - 共通設定ファイルの整理（tsconfig.json, eslint.config.js等）

3. **gitignoreの更新**
   ```gitignore
   # Dependencies
   node_modules/
   packages/*/node_modules/
   
   # Build outputs
   dist/
   packages/*/dist/
   .next/
   packages/web/.next/
   
   # Environment files
   .env*
   packages/*/.env*
   ```

### Phase 2: Core ライブラリの作成 (2-3日)

1. **既存コードの移動**
   ```bash
   # コアロジックをcoreパッケージに移動
   mv src/core/* packages/core/src/
   mv src/services/* packages/core/src/services/
   mv src/utils/* packages/core/src/utils/
   mv src/types/* packages/core/src/types/
   mv src/config/* packages/core/src/config/
   mv src/PersonalCast.ts packages/core/src/
   ```

2. **Core パッケージの設定**
   - `packages/core/package.json` 作成
   - `packages/core/tsconfig.json` 作成
   - エクスポート構造の整理

3. **依存関係の整理**
   - 外部ライブラリの依存関係を Core に集約
   - 型定義の整理

### Phase 3: CLI パッケージの分離 (1-2日)

1. **CLI固有コードの移動**
   ```bash
   mv src/cli/* packages/cli/src/
   ```

2. **CLI パッケージの設定**
   - `packages/cli/package.json` 作成
   - Core ライブラリへの依存設定
   - CLI固有のオーケストレータークラス作成

3. **動作確認**
   - CLI機能が正常に動作することを確認
   - 既存のテストケースを移行・実行

### Phase 4: Web パッケージの作成 (2-3日)

1. **Next.js プロジェクトの初期化**
   ```bash
   cd packages/web
   npx create-next-app@latest . --typescript --tailwind --eslint --app
   ```

2. **Core ライブラリの統合**
   - Web向けラッパークラスの作成
   - 非同期処理・進捗通知の実装

3. **基本的なWebUI作成**
   - 入力フォーム
   - 進捗表示
   - 結果表示

### Phase 5: CI/CD の調整 (1日)

1. **GitHub Actions の更新**
   - モノレポ対応のビルド設定
   - パッケージごとのテスト実行
   - 依存関係の変更検知

2. **リリース戦略の整理**
   - CLI版とWeb版の独立したリリース
   - Core ライブラリのバージョン管理

### Phase 6: 既存ファイルのクリーンアップ (半日)

1. **不要ファイルの削除**
   - 移動済みのソースファイル
   - 古い設定ファイル

2. **ドキュメントの更新**
   - README.md の更新
   - 開発ガイドの更新

## 📊 移行後のメリット

### 開発効率の向上
- **コードの重複排除**: 同じロジックを2回書く必要がない
- **統一されたAPI**: CLI版とWeb版で同じインターフェース
- **並行開発**: CLI版とWeb版を独立して開発可能

### 保守性の向上
- **影響範囲の明確化**: Core の変更が両方に影響することが明確
- **テストの一元化**: コアロジックのテストを共通化
- **型安全性**: TypeScriptによる型チェックを全体で統一

### デプロイメントの柔軟性
- **独立したリリース**: CLI版とWeb版を別々にリリース可能
- **環境固有の最適化**: それぞれの環境に最適化された設定
- **段階的な展開**: 一方に問題があっても他方は継続運用可能

## 🔄 継続的な開発フロー

### 新機能追加時
1. Core ライブラリに機能追加
2. CLI版での実装・テスト
3. Web版での実装・テスト
4. 両方での統合テスト

### バグ修正時
1. Core ライブラリでの修正
2. 両方のパッケージでテスト
3. 影響範囲の確認

### リリース時
1. Core ライブラリのバージョンアップ
2. CLI版とWeb版でのCore依存更新
3. 個別にリリース実行

## 📝 注意点

### 依存関係の管理
- Core ライブラリの変更は破壊的変更になりうる
- セマンティックバージョニングの厳密な運用が必要
- 変更ログの詳細な記録

### パフォーマンス考慮
- Web版では大きなファイルサイズに注意
- 必要な機能のみをインポートする設計
- Tree-shakingの活用

### 開発体験
- 開発時のホットリロード設定
- デバッグ時のソースマップ設定
- IDE での型補完の確保

## 🎯 成功指標

- [ ] CLI版の既存機能が全て動作
- [ ] Web版で同等の機能を提供
- [ ] テストカバレッジの維持・向上
- [ ] ビルド時間の短縮
- [ ] 開発者体験の向上
- [ ] CI/CDの安定稼働

この移行により、PersonalCastプロジェクトはより保守しやすく、拡張しやすい構造になり、CLI版とWeb版の両方を効率的に開発・運用できるようになります。