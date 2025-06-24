import { NextRequest, NextResponse } from 'next/server';
import { PersonalCast } from '@personalcast/core';
import { AnalyzeRequest, GenerationStatus, JobResponse } from '@/lib/types/api';
import { jobManager } from '@/lib/storage/JobManager';
import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter';
import path from 'path';

// Initialize storage adapters
const tempStorage = new LocalStorageAdapter(process.env.LOCAL_TEMP_DIR || './temp');
const outputStorage = new LocalStorageAdapter(process.env.LOCAL_OUTPUT_DIR || './output');

// Validation function
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body.activityLog || typeof body.activityLog !== 'string') {
    return { valid: false, error: 'activityLog is required and must be a string' };
  }

  if (body.activityLog.length > 10000) {
    return { valid: false, error: 'activityLog must be less than 10,000 characters' };
  }

  if (!body.options || typeof body.options !== 'object') {
    return { valid: false, error: 'options is required and must be an object' };
  }

  const { analysisStyle, duration } = body.options;

  if (!analysisStyle || !['analytical', 'comprehensive'].includes(analysisStyle)) {
    return { valid: false, error: 'options.analysisStyle must be "analytical" or "comprehensive"' };
  }

  if (!duration || typeof duration !== 'number' || duration < 1 || duration > 10) {
    return { valid: false, error: 'options.duration must be a number between 1 and 10' };
  }

  if (body.options.speed !== undefined) {
    const speed = body.options.speed;
    if (typeof speed !== 'number' || speed < 0.5 || speed > 2.0) {
      return { valid: false, error: 'options.speed must be a number between 0.5 and 2.0' };
    }
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create job
    const job = jobManager.createJob(body.activityLog, body.options);

    // Start processing asynchronously
    processJob(job.id).catch(error => {
      console.error('Job processing error:', error);
      jobManager.updateJob(job.id, {
        status: GenerationStatus.FAILED,
        error: error.message
      });
    });

    // Return job response
    const response: JobResponse = {
      jobId: job.id,
      status: job.status,
      estimatedTime: job.estimatedTime
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Process job asynchronously
export async function processJob(jobId: string) {
  const job = jobManager.getJob(jobId);
  if (!job) return;

  try {
    // Update status to parsing
    jobManager.updateJob(jobId, {
      status: GenerationStatus.PARSING,
      progress: 10,
      message: 'メモを解析中...'
    });

    // Initialize PersonalCast with API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      throw new Error('API key configuration error');
    }
    
    const personalCast = new PersonalCast();

    // Parse memo - save to temp file first
    const tempMemoPath = `${jobId}_memo.txt`;
    await tempStorage.save(tempMemoPath, Buffer.from(job.activityLog, 'utf-8'));
    const fullTempPath = path.resolve(process.env.LOCAL_TEMP_DIR || './temp', tempMemoPath);
    
    const parsedMemo = await personalCast.parseMemoFile(fullTempPath);

    // Update status to analyzing
    jobManager.updateJob(jobId, {
      status: GenerationStatus.ANALYZING_MEMO,
      progress: 30,
      message: '活動を分析中...'
    });

    // Generate script
    jobManager.updateJob(jobId, {
      status: GenerationStatus.GENERATING_SCRIPT,
      progress: 50,
      message: '台本を生成中...'
    });

    const script = await personalCast.generateScriptFromMemo(parsedMemo, {
      style: job.options.analysisStyle,
      duration: job.options.duration
    });

    // Save script
    const scriptData = {
      title: script.title || `${new Date().toLocaleDateString('ja-JP')}の${job.options.newsShowName || 'PersonalCast'}`,
      sections: script.dialogues.map((dialogue) => ({
        speaker: dialogue.personality,
        text: dialogue.content || dialogue.text || ''
      }))
    };

    jobManager.updateJob(jobId, {
      status: GenerationStatus.SCRIPT_READY,
      script: scriptData,
      progress: 60,
      message: '台本が完成しました',
      scriptAvailable: true
    });

    // Generate voice
    jobManager.updateJob(jobId, {
      status: GenerationStatus.SYNTHESIZING_VOICE,
      progress: 70,
      message: '音声を生成中...'
    });

    const audioBuffers = await personalCast.generateSpeechFromScript(script, {
      speed: job.options.speed
    });

    // Mix audio
    jobManager.updateJob(jobId, {
      status: GenerationStatus.MIXING_AUDIO,
      progress: 90,
      message: '音声を処理中...'
    });

    // Combine audio buffers
    const combinedAudio = await personalCast.combineAudioBuffers(audioBuffers);
    
    // Normalize volume
    const normalizedAudio = await personalCast.normalizeAudioVolume(combinedAudio);

    // Export to MP3
    const finalOutputFileName = `${jobId}.mp3`;
    const finalOutputPath = path.resolve(process.env.LOCAL_OUTPUT_DIR || './output', finalOutputFileName);
    await personalCast.exportAudioToMP3(normalizedAudio, finalOutputPath);
    
    // Add BGM
    jobManager.updateJob(jobId, {
      progress: 95,
      message: 'BGMを追加中...'
    });
    
    const bgmPath = path.resolve(process.cwd(), 'public/audio/bgm.mp3');
    await personalCast.addBackgroundMusic(finalOutputPath, bgmPath);
    
    // Clean up temp files
    await tempStorage.delete(tempMemoPath);

    // Update job as completed
    jobManager.updateJob(jobId, {
      status: GenerationStatus.COMPLETED,
      audioPath: finalOutputFileName,
      progress: 100,
      message: '生成が完了しました'
    });

  } catch (error) {
    console.error('Job processing error:', error);
    jobManager.updateJob(jobId, {
      status: GenerationStatus.FAILED,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'エラーが発生しました'
    });
  }
}