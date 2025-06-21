import { NextRequest, NextResponse } from 'next/server';
import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter';
import path from 'path';

const outputStorage = new LocalStorageAdapter(process.env.LOCAL_OUTPUT_DIR || './output');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const filePath = pathSegments.join('/');

    // Security check - prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Check if file exists
    const exists = await outputStorage.exists(filePath);
    if (!exists) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Load file
    const fileBuffer = await outputStorage.load(filePath);

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.mp3') {
      contentType = 'audio/mpeg';
    } else if (ext === '.json') {
      contentType = 'application/json';
    }

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}