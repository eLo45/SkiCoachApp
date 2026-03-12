import { NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const driveClient = await getDriveClient();
    const auth = driveClient.context._options.auth as any;
    const token = await auth.getAccessToken();
    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('Error generating token:', error.message);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}