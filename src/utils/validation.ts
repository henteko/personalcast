import * as fs from 'fs/promises';
import * as path from 'path';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateInputPath(inputPath: string): Promise<ValidationResult> {
  try {
    const stats = await fs.stat(inputPath);

    if (!stats.isFile() && !stats.isDirectory()) {
      return {
        valid: false,
        error: 'Input path must be a file or directory',
      };
    }

    if (stats.isFile()) {
      const ext = path.extname(inputPath).toLowerCase();
      const supportedExtensions = ['.txt', '.md', '.json', '.csv'];

      if (!supportedExtensions.includes(ext)) {
        return {
          valid: false,
          error: `Unsupported file type. Supported: ${supportedExtensions.join(', ')}`,
        };
      }
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: `Input path does not exist: ${inputPath}`,
    };
  }
}

export function validateProgramType(type: string): ValidationResult {
  const validTypes = ['daily', 'weekly'];

  if (!validTypes.includes(type)) {
    return {
      valid: false,
      error: `Invalid program type. Must be one of: ${validTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

export function validatePraiseStyle(style: string): ValidationResult {
  const validStyles = ['gentle', 'energetic'];

  if (!validStyles.includes(style)) {
    return {
      valid: false,
      error: `Invalid praise style. Must be one of: ${validStyles.join(', ')}`,
    };
  }

  return { valid: true };
}

export function validateDuration(duration: string): ValidationResult {
  const durationNum = parseInt(duration, 10);

  if (isNaN(durationNum)) {
    return {
      valid: false,
      error: 'Duration must be a number',
    };
  }

  if (durationNum < 1 || durationNum > 60) {
    return {
      valid: false,
      error: 'Duration must be between 1 and 60 minutes',
    };
  }

  return { valid: true };
}

export async function validateOutputPath(outputPath: string): Promise<ValidationResult> {
  const dir = path.dirname(outputPath);
  const ext = path.extname(outputPath).toLowerCase();

  if (ext !== '.mp3') {
    return {
      valid: false,
      error: 'Output file must have .mp3 extension',
    };
  }

  try {
    await fs.access(dir);
    return { valid: true };
  } catch {
    // Directory doesn't exist, but we can create it
    return { valid: true };
  }
}

export function validateEnvironmentVariables(): ValidationResult {
  const required = ['GEMINI_API_KEY'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required environment variables: ${missing.join(', ')}`,
    };
  }

  return { valid: true };
}
