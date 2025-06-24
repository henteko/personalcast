import { NextRequest, NextResponse } from 'next/server';
import { PersonalCast } from '@personalcast/core';
import { AnalyzeRequest, GenerationStatus, JobResponse } from '@/lib/types/api';
import { jobManager } from '@/lib/storage/JobManager';
import path from 'path';
import { createConvexJob, updateJobStatus, saveScriptData, recordJobError, completeJob } from '@/lib/convex/client';
import type { Id } from '@/convex/_generated/dataModel';
import { ConvexStorageAdapter } from '@/lib/storage/ConvexStorageAdapter';
import { promises as fs } from 'fs';
import { JOB_STATUS, STATUS_PROGRESS } from '@/lib/constants/jobStatus';

// Initialize temp directory path
const tempDir = process.env.LOCAL_TEMP_DIR || './temp';

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

    // Create job in Convex
    const convexJobId = await createConvexJob(body.activityLog, new Date().toISOString());
    
    // Also create in local job manager for backward compatibility
    const job = jobManager.createJob(body.activityLog, body.options);
    
    // Store mapping between local and Convex job IDs
    (global as any).jobIdMapping = (global as any).jobIdMapping || {};
    (global as any).jobIdMapping[job.id] = convexJobId;

    // Start processing asynchronously
    processJob(job.id, convexJobId).catch(async error => {
      console.error('Job processing error:', error);
      jobManager.updateJob(job.id, {
        status: GenerationStatus.FAILED,
        error: error.message
      });
      
      // Also update Convex
      await recordJobError(convexJobId, {
        message: error.message,
        code: 'PROCESSING_ERROR'
      });
    });

    // Return job response with Convex ID
    const response: JobResponse = {
      jobId: convexJobId as string,
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
export async function processJob(localJobId: string, convexJobId: Id<"jobs">) {
  const job = jobManager.getJob(localJobId);
  if (!job) return;

  try {
    // Update status to parsing
    jobManager.updateJob(localJobId, {
      status: GenerationStatus.PARSING,
      progress: STATUS_PROGRESS[JOB_STATUS.PARSING],
      message: 'メモを解析中...'
    });
    
    // Update Convex
    await updateJobStatus(convexJobId, JOB_STATUS.PARSING, STATUS_PROGRESS[JOB_STATUS.PARSING], 'メモを解析中...');

    // Initialize PersonalCast with API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      throw new Error('API key configuration error');
    }
    
    const personalCast = new PersonalCast();

    // Parse memo - save to temp file first
    const tempMemoPath = `${localJobId}_memo.txt`;
    const fullTempPath = path.resolve(tempDir, tempMemoPath);
    
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(fullTempPath, job.activityLog, 'utf-8');
    
    const parsedMemo = await personalCast.parseMemoFile(fullTempPath);

    // Update status to analyzing
    jobManager.updateJob(localJobId, {
      status: GenerationStatus.ANALYZING_MEMO,
      progress: STATUS_PROGRESS[JOB_STATUS.ANALYZING_MEMO],
      message: '活動を分析中...'
    });
    
    await updateJobStatus(convexJobId, JOB_STATUS.ANALYZING_MEMO, STATUS_PROGRESS[JOB_STATUS.ANALYZING_MEMO], '活動を分析中...');

    // Generate script
    jobManager.updateJob(localJobId, {
      status: GenerationStatus.GENERATING_SCRIPT,
      progress: STATUS_PROGRESS[JOB_STATUS.GENERATING_SCRIPT],
      message: '台本を生成中...'
    });
    
    await updateJobStatus(convexJobId, JOB_STATUS.GENERATING_SCRIPT, STATUS_PROGRESS[JOB_STATUS.GENERATING_SCRIPT], '台本を生成中...');

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

    jobManager.updateJob(localJobId, {
      status: GenerationStatus.SCRIPT_READY,
      script: scriptData,
      progress: STATUS_PROGRESS[JOB_STATUS.SCRIPT_READY],
      message: '台本が完成しました',
      scriptAvailable: true
    });
    
    // Save script to Convex
    await saveScriptData(convexJobId, {
      sections: scriptData.sections,
      title: scriptData.title,
      summary: parsedMemo.summary || ''
    });

    // Generate voice
    jobManager.updateJob(localJobId, {
      status: GenerationStatus.SYNTHESIZING_VOICE,
      progress: STATUS_PROGRESS[JOB_STATUS.SYNTHESIZING_VOICE],
      message: '音声を生成中...'
    });
    
    await updateJobStatus(convexJobId, JOB_STATUS.SYNTHESIZING_VOICE, STATUS_PROGRESS[JOB_STATUS.SYNTHESIZING_VOICE], '音声を生成中...');

    const audioBuffers = await personalCast.generateSpeechFromScript(script, {
      speed: job.options.speed
    });

    // Mix audio
    jobManager.updateJob(localJobId, {
      status: GenerationStatus.MIXING_AUDIO,
      progress: STATUS_PROGRESS[JOB_STATUS.MIXING_AUDIO],
      message: '音声を処理中...'
    });
    
    await updateJobStatus(convexJobId, JOB_STATUS.MIXING_AUDIO, STATUS_PROGRESS[JOB_STATUS.MIXING_AUDIO], '音声を処理中...');

    // Combine audio buffers
    const combinedAudio = await personalCast.combineAudioBuffers(audioBuffers);
    
    // Normalize volume
    const normalizedAudio = await personalCast.normalizeAudioVolume(combinedAudio);

    // Export to MP3
    const finalOutputFileName = `${localJobId}.mp3`;
    const outputDir = process.env.LOCAL_OUTPUT_DIR || './output';
    const finalOutputPath = path.resolve(outputDir, finalOutputFileName);
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    await personalCast.exportAudioToMP3(normalizedAudio, finalOutputPath);
    
    // Add BGM
    jobManager.updateJob(localJobId, {
      progress: 95,
      message: 'BGMを追加中...'
    });
    
    await updateJobStatus(convexJobId, JOB_STATUS.MIXING_AUDIO, 95, 'BGMを追加中...');
    
    const bgmPath = path.resolve(process.cwd(), 'public/audio/bgm.mp3');
    await personalCast.addBackgroundMusic(finalOutputPath, bgmPath);
    
    // Clean up temp files
    await fs.unlink(fullTempPath).catch(() => {});
    
    // Upload audio file to Convex
    let audioUrl = '';
    
    if (process.env.NEXT_PUBLIC_CONVEX_URL) {
      try {
        const convexStorage = new ConvexStorageAdapter(process.env.NEXT_PUBLIC_CONVEX_URL);
        
        // Read the audio file
        const audioData = await fs.readFile(finalOutputPath);
        const audioBase64 = audioData.toString('base64');
        
        // Upload to Convex storage
        const storageId = await convexStorage.uploadFile(
          convexJobId,
          audioBase64,
          finalOutputFileName,
          'audio/mpeg'
        );
        
        // Save audio file info in Convex
        await convexStorage.saveAudioFile(
          convexJobId,
          storageId,
          finalOutputFileName,
          'audio/mpeg',
          audioData.length
        );
        
        // Get Convex URL (this is set automatically by saveAudioFile)
        const convexUrl = await convexStorage.getFileUrl(storageId);
        if (convexUrl) {
          audioUrl = convexUrl;
        }
      } catch (uploadError) {
        console.error('Failed to upload audio to Convex:', uploadError);
        throw new Error('音声ファイルのアップロードに失敗しました');
      }
    } else {
      throw new Error('Convex URLが設定されていません');
    }

    // Update job as completed
    jobManager.updateJob(localJobId, {
      status: GenerationStatus.COMPLETED,
      audioPath: finalOutputFileName,
      progress: STATUS_PROGRESS[JOB_STATUS.COMPLETED],
      message: '生成が完了しました'
    });
    
    // Complete Convex job with audio URL
    await completeJob(convexJobId, audioUrl);

  } catch (error) {
    console.error('Job processing error:', error);
    jobManager.updateJob(localJobId, {
      status: GenerationStatus.FAILED,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'エラーが発生しました'
    });
    
    // Record error in Convex
    await recordJobError(convexJobId, {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'PROCESSING_ERROR'
    });
    
    // Update status to failed
    await updateJobStatus(convexJobId, JOB_STATUS.FAILED, STATUS_PROGRESS[JOB_STATUS.FAILED], 'エラーが発生しました');
  }
}