export interface StorageAdapter {
  save(path: string, data: Buffer): Promise<string>;
  load(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  getUrl(path: string): Promise<string>;
}