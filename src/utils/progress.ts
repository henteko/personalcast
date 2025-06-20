export class ProgressReporter {
  private currentStep = 0;
  private totalSteps: number;
  private startTime: number;

  constructor(totalSteps: number) {
    this.totalSteps = totalSteps;
    this.startTime = Date.now();
  }

  start(message: string): void {
    console.log(`🎙️  ${message}`);
  }

  update(message: string): void {
    this.currentStep++;
    const progress = Math.round((this.currentStep / this.totalSteps) * 100);
    const progressBar = this.createProgressBar(progress);
    console.log(`${progressBar} ${progress}% - ${message}`);
  }

  complete(message: string): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`\n✅ ${message} (${elapsed}秒)`);
  }

  error(message: string): void {
    console.error(`\n❌ エラー: ${message}`);
  }

  info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  private createProgressBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'\u2588'.repeat(filled)}${'\u2591'.repeat(empty)}]`;
  }
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
