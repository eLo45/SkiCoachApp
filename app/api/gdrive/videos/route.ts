import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');

    if (!folderId) {
      return NextResponse.json({ error: 'folderId is required' }, { status: 400 });
    }

    const drive = await getDriveClient();
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`,
      fields: 'files(id, name, thumbnailLink, webContentLink)',
      orderBy: 'name asc',
    });

    return NextResponse.json({ files: response.data.files || [] });
  } catch (error: any) {
    console.error('Error fetching videos from Google Drive:', error.message);
    return NextResponse.json({ error: 'Error fetching videos' }, { status: 500 });
  }
}
