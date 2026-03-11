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

    // Forward the Range header if the browser sends it (crucial for video scrubbing/seeking)
    const rangeHeader = req.headers.get('range');
    const requestHeaders: any = {};
    if (rangeHeader) {
      requestHeaders['Range'] = rangeHeader;
    }

    const driveResponse = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream', headers: requestHeaders }
    );

    const readable = driveResponse.data as Readable;
    
    // Create the response and pass through the HTTP status (200 or 206)
    const response = new NextResponse(readable as any, {
      status: driveResponse.status,
    });
    
    // Copy essential headers for video streaming
    const headersToProxy = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    headersToProxy.forEach(header => {
      const value = driveResponse.headers[header];
      if (value) {
        response.headers.set(header, Array.isArray(value) ? value.join(', ') : value);
      }
    });

    return response;
  } catch (error: any) {
    console.error('Error downloading file from Google Drive:', error.message);
    // If it's a 416 Range Not Satisfiable, return that properly
    if (error.status === 416) {
        return new NextResponse(null, { status: 416 });
    }
    return NextResponse.json({ error: 'Error downloading file' }, { status: 500 });
  }
}
