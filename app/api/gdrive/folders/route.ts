import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rootFolderId = searchParams.get('rootFolderId');

    if (!rootFolderId) {
      return NextResponse.json({ error: 'rootFolderId is required' }, { status: 400 });
    }

    const drive = await getDriveClient();
    const response = await drive.files.list({
      q: `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      orderBy: 'name desc',
    });

    return NextResponse.json({ files: response.data.files || [] });
  } catch (error: any) {
    console.error('Error fetching folders from Google Drive:', error.message);
    return NextResponse.json({ error: 'Error fetching folders' }, { status: 500 });
  }
}
