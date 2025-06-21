import * as fs from 'fs/promises';
import * as path from 'path';
import { ParsedMemo, DailyActivity, ActivityCategory, MemoStatistics } from '../../types';

export class MemoParser {
  private readonly supportedExtensions = ['.txt', '.md', '.json', '.csv'];

  async parseFile(filePath: string): Promise<ParsedMemo> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.txt':
      case '.md':
        return this.parseTextFile(filePath);
      case '.json':
        return this.parseJSONFile(filePath);
      case '.csv':
        return this.parseCSVFile(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  async parseTextFile(filePath: string): Promise<ParsedMemo> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.parseContent(content, filePath);
    } catch {
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }

  async parseDirectory(dirPath: string): Promise<ParsedMemo[]> {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const memoFiles = files.filter(
      (file) => file.isFile() && this.supportedExtensions.includes(path.extname(file.name)),
    );

    if (memoFiles.length === 0) {
      throw new Error('No valid memo files found in directory');
    }

    const memos = await Promise.all(
      memoFiles.map((file) => this.parseFile(path.join(dirPath, file.name))),
    );

    return memos;
  }

  extractDailyActivities(content: string): DailyActivity[] {
    const lines = content.split('\n').filter((line) => line.trim());
    const activities: DailyActivity[] = [];

    for (const line of lines) {
      if (this.isActivityLine(line)) {
        const category = this.categorizeContent(line);
        const achievement = this.extractAchievement(line);

        activities.push({
          category,
          description: line.trim(),
          achievement,
        });
      }
    }

    return activities;
  }

  categorizeContent(content: string): ActivityCategory {
    const workKeywords = ['仕事', '会議', 'プロジェクト', 'タスク', 'プレゼン', '業務', '作業'];
    const learningKeywords = ['勉強', '学習', '読書', '本を読', '学んだ', '研究', '講座'];
    const healthKeywords = ['運動', 'ジム', 'ランニング', 'ウォーキング', '散歩', '筋トレ', 'ヨガ'];
    const personalKeywords = ['友達', '家族', '映画', '趣味', '料理', '掃除', '買い物'];

    if (workKeywords.some((keyword) => content.includes(keyword))) {
      return ActivityCategory.WORK;
    }
    if (learningKeywords.some((keyword) => content.includes(keyword))) {
      return ActivityCategory.LEARNING;
    }
    if (healthKeywords.some((keyword) => content.includes(keyword))) {
      return ActivityCategory.HEALTH;
    }
    if (personalKeywords.some((keyword) => content.includes(keyword))) {
      return ActivityCategory.PERSONAL;
    }

    return ActivityCategory.OTHER;
  }

  private generateStatistics(activities: DailyActivity[], content: string): MemoStatistics {
    // Calculate category counts
    const categoryCounts: Record<ActivityCategory, number> = {
      [ActivityCategory.WORK]: 0,
      [ActivityCategory.LEARNING]: 0,
      [ActivityCategory.HEALTH]: 0,
      [ActivityCategory.PERSONAL]: 0,
      [ActivityCategory.OTHER]: 0,
    };

    activities.forEach((activity) => {
      categoryCounts[activity.category]++;
    });

    // Calculate top categories with percentages
    const totalActivities = activities.length;
    const topCategories = Object.entries(categoryCounts)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({
        category: category as ActivityCategory,
        count,
        percentage: totalActivities > 0 ? Math.round((count / totalActivities) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Extract keywords (nouns) from content
    const keywords = this.extractKeywords(content);

    return {
      totalActivities,
      categoryCounts,
      topCategories,
      keywords,
    };
  }

  private extractKeywords(content: string): Array<{ word: string; count: number }> {
    // Extract important keywords (simplified version)
    const importantWords = [
      'プロジェクト',
      '会議',
      'ミーティング',
      '開発',
      '実装',
      '設計',
      '勉強',
      '学習',
      '読書',
      '研究',
      '分析',
      '調査',
      '運動',
      'トレーニング',
      '健康',
      'ランニング',
      'ウォーキング',
      '完了',
      '達成',
      '成功',
      '改善',
      '解決',
      '進捗',
    ];

    const wordCounts: Record<string, number> = {};

    importantWords.forEach((word) => {
      const count = (content.match(new RegExp(word, 'g')) ?? []).length;
      if (count > 0) {
        wordCounts[word] = count;
      }
    });

    return Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 keywords
  }

  private parseContent(content: string, filePath: string): ParsedMemo {
    const date = this.extractDate(content, filePath);
    const activities = this.extractDailyActivities(content);
    const positiveElements = this.extractPositiveElements(content);
    const statistics = this.generateStatistics(activities, content);

    return {
      date,
      content,
      activities,
      positiveElements,
      statistics,
    };
  }

  private extractDate(content: string, filePath: string): Date {
    // 日付パターンを検索
    const datePatterns = [
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      /(\d{4})年(\d{1,2})月(\d{1,2})日/,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    ];

    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        if (pattern === datePatterns[2]) {
          // MM/DD/YYYY format
          const [, month, day, year] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // YYYY-MM-DD or YYYY年MM月DD日 format
          const [, year, month, day] = match;
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          // ローカルタイムゾーンで日付を設定
          return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }
      }
    }

    // ファイル名から日付を抽出
    const filename = path.basename(filePath);
    for (const pattern of datePatterns) {
      const match = filename.match(pattern);
      if (match) {
        if (pattern === datePatterns[2]) {
          const [, month, day, year] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          const [, year, month, day] = match;
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }
      }
    }

    // デフォルトは今日の日付
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  private isActivityLine(line: string): boolean {
    // 活動を表す行かどうかを判定
    const actionVerbs = [
      'した',
      'やった',
      '行った',
      '完了',
      '達成',
      '終了',
      '開始',
      '成功',
      'させた',
      '頑張った',
    ];
    // 空行や短すぎる行を除外
    if (line.trim().length < 5) return false;
    // 日付だけの行を除外
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(line.trim())) return false;

    return actionVerbs.some((verb) => line.includes(verb));
  }

  private extractAchievement(line: string): string | undefined {
    const achievementPatterns = [
      /(\d+時間.*?頑張った)/,
      /(\d+時間.*?達成)/,
      /(\d+分.*?頑張)/,
      /(\d+分.*?達成)/,
      /(.*?成功させた)/,
      /(.*?を完了)/,
      /(.*?を達成)/,
    ];

    for (const pattern of achievementPatterns) {
      const match = line.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  private extractPositiveElements(content: string): string[] {
    const positiveKeywords = [
      '完了',
      '達成',
      '成功',
      '解決',
      '頑張',
      '良い',
      'できた',
      '嬉しい',
      '楽しい',
      '充実',
      '進歩',
      '改善',
      '学べた',
      '理解',
      'クリア',
      '完成',
    ];

    const positiveElements: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      for (const keyword of positiveKeywords) {
        if (line.includes(keyword)) {
          // キーワードを含む文節を抽出
          const match = line.match(new RegExp(`[^。、]*${keyword}[^。、]*`, 'g'));
          if (match) {
            positiveElements.push(...match.map((m) => m.trim()));
          }
        }
      }
    }

    return [...new Set(positiveElements)]; // 重複を削除
  }

  async parseMarkdownFile(filePath: string): Promise<ParsedMemo> {
    // For now, treat markdown the same as text
    return this.parseTextFile(filePath);
  }

  async parseJSONFile(filePath: string): Promise<ParsedMemo> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as Record<string, unknown>;

    // Try to extract structured data
    const date = data.date ? new Date(data.date as string) : this.extractDate(content, filePath);
    const activities = data.activities
      ? (data.activities as DailyActivity[])
      : this.extractDailyActivities(content);
    const positiveElements = data.positiveElements
      ? (data.positiveElements as string[])
      : this.extractPositiveElements(content);

    return {
      date,
      content: JSON.stringify(data, null, 2),
      activities,
      positiveElements,
    };
  }

  async parseCSVFile(filePath: string): Promise<ParsedMemo> {
    const content = await fs.readFile(filePath, 'utf-8');
    // Simple CSV parsing for memo data
    const lines = content.split('\n').filter((line) => line.trim());
    const activities: DailyActivity[] = [];

    for (const line of lines) {
      const columns = line.split(',').map((col) => col.trim());
      if (columns.length >= 2) {
        const category = this.categorizeContent(columns[1]);
        activities.push({
          category,
          description: columns[1],
          achievement: columns[2],
        });
      }
    }

    return {
      date: this.extractDate(content, filePath),
      content,
      activities,
      positiveElements: this.extractPositiveElements(content),
    };
  }

  mergeMemos(memos: ParsedMemo[]): ParsedMemo {
    // 複数のメモを統合
    const activities = memos.flatMap((memo) => memo.activities);
    const positiveElements = [...new Set(memos.flatMap((memo) => memo.positiveElements))];
    const content = memos.map((memo) => memo.content).join('\n\n');

    // 最新の日付を使用
    const date = memos.reduce(
      (latest, memo) => (memo.date > latest ? memo.date : latest),
      memos[0].date,
    );

    return {
      date,
      content,
      activities,
      positiveElements,
    };
  }
}
