import { StorageAdapter } from './StorageAdapter';
import { promises as fs } from 'fs';
import path from 'path';

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(baseDir: string = './') {
    this.baseDir = path.resolve(baseDir);
  }

  async save(filePath: string, data: Buffer): Promise<string> {
    const fullPath = path.join(this.baseDir, filePath);
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, data);
    
    return filePath;
  }

  async load(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, filePath);
    return await fs.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    await fs.unlink(fullPath);
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(filePath: string): Promise<string> {
    // For local storage, return a relative URL that will be served by Next.js API
    return `/api/files/${encodeURIComponent(filePath)}`;
  }
}