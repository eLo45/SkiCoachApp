import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Return the API Key from the server runtime environment instead of relying on build-time NEXT_PUBLIC replacement
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found in server environment");
    }
    return NextResponse.json({ apiKey });
  } catch (error: any) {
    console.error('Error retrieving API key:', error.message);
    return NextResponse.json({ error: 'Failed to retrieve API key' }, { status: 500 });
  }
}