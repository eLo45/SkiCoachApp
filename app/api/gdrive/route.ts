import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new NextResponse(JSON.stringify({ error: 'Authorization header is missing' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const accessToken = authHeader.split(' ')[1];

    if (!fileId) {
      return new NextResponse(JSON.stringify({ error: 'File ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const driveResponse = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    const readable = driveResponse.data as Readable;

    // In Next.js 13+, we can stream Node.js Readables directly in a NextResponse
    const response = new NextResponse(readable as any);
    
    response.headers.set('Content-Type', driveResponse.headers['content-type'] || 'video/mp4');
    if (driveResponse.headers['content-length']) {
      response.headers.set('Content-Length', driveResponse.headers['content-length']);
    }

    return response;

  } catch (error: any) {
    console.error('Error fetching file from Google Drive:', error.message);
    return new NextResponse(JSON.stringify({ error: 'Error fetching file from Google Drive' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
