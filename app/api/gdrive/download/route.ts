import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/gdrive';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const drive = await getDriveClient();

    const driveResponse = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    const readable = driveResponse.data as Readable;

    // Stream directly in Next.js 13+
    const response = new NextResponse(readable as any);
    
    response.headers.set('Content-Type', driveResponse.headers['content-type'] || 'video/mp4');
    if (driveResponse.headers['content-length']) {
      response.headers.set('Content-Length', driveResponse.headers['content-length']);
    }

    return response;
  } catch (error: any) {
    console.error('Error downloading file from Google Drive:', error.message);
    return NextResponse.json({ error: 'Error downloading file' }, { status: 500 });
  }
}
