export { ProgressReporter, formatDuration } from './progress';
export * from './validation';

export async function findBGMFile(): Promise<string | null> {
  // TODO: Implement BGM file search logic
  // For now, return null
  return Promise.resolve(null);
}
