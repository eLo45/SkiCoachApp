import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return new NextResponse('File ID is required', { status: 400 });
    }

    const drive = await getDriveClient();

    // The Google Drive API returns the actual thumbnail bytes if we request it via the files.get endpoint
    // by asking for alt: 'media' but targeting a thumbnail if possible, or we can just fetch the file directly
    // Actually, the thumbnailLink is usually publicly accessible if the file is shared, BUT since it's a service account,
    // the thumbnailLink often requires cookie auth. 
    // Best way: Use the Drive API to fetch the thumbnail data directly.

    const fileMeta = await drive.files.get({
        fileId: fileId,
        fields: 'thumbnailLink'
    });

    if (!fileMeta.data.thumbnailLink) {
        return new NextResponse('No thumbnail available', { status: 404 });
    }

    // Google Drive thumbnail links often just need a simple GET request, but sometimes they 403.
    // However, if we fetch the webContentLink or use the Drive API, it's safer.
    // The most robust way to get a thumbnail securely is actually to fetch the URL returned by the API using the auth token.
    
    const driveClient = await getDriveClient();
    const auth = driveClient.context._options.auth as any;
    const client = await auth.getClient();
    const response = await client.request({
        url: fileMeta.data.thumbnailLink,
        responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(response.data as ArrayBuffer);

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400' // Cache for a day
        }
    });

  } catch (error: any) {
    console.error('Error fetching thumbnail from Google Drive:', error.message);
    return new NextResponse('Error fetching thumbnail', { status: 500 });
  }
}
