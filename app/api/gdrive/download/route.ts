import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/gdrive';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return new NextResponse('File ID is required', { status: 400 });
    }

    const drive = await getDriveClient();

    // 1. Get file metadata to know the total file size and MIME type
    const metaResponse = await drive.files.get({
        fileId: fileId,
        fields: 'size, mimeType'
    });
    
    const fileSize = parseInt(metaResponse.data.size || '0', 10);
    const mimeType = metaResponse.data.mimeType || 'video/mp4';

    // 2. Handle the Range header
    const rangeHeader = req.headers.get('range');
    let start = 0;
    let end = fileSize - 1;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    }
    
    // Ensure we don't go past the actual file size
    if (end > fileSize - 1) {
        end = fileSize - 1;
    }

    const chunksize = (end - start) + 1;

    // 3. Request ONLY the specific byte range from Google Drive as a complete array buffer
    const requestHeaders: any = {
        Range: `bytes=${start}-${end}`
    };

    const driveResponse = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'arraybuffer', headers: requestHeaders }
    );

    const buffer = Buffer.from(driveResponse.data as ArrayBuffer);

    // 4. Construct the HTTP 206 Partial Content response
    const headers = new Headers();
    headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Length', buffer.length.toString());
    headers.set('Content-Type', mimeType);

    // If it's a range request, respond with 206. If not, 200.
    const status = rangeHeader ? 206 : 200;

    return new NextResponse(buffer, {
      status,
      headers,
    });
  } catch (error: any) {
    console.error('Error streaming file from Google Drive:', error.message);
    if (error.status === 416) {
        return new NextResponse('Requested Range Not Satisfiable', { status: 416 });
    }
    return new NextResponse('Error streaming file', { status: 500 });
  }
}
