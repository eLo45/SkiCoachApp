import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/gdrive';
import { Storage } from '@google-cloud/storage';
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
    
    // Initialize GCS client using the same service account credentials 
    // from the environment that the Google Drive client uses.
    const storage = new Storage({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'),
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'eliottappfrontend',
    });

    const bucketName = 'ski-coach-app-cache';
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`${fileId}.mp4`); // Using .mp4 for generic video typing, though we can fetch the real name if needed

    // Check if the file is already cached in GCS
    const [exists] = await file.exists();

    if (!exists) {
      console.log(`File ${fileId} not found in cache. Downloading from Drive to GCS...`);
      
      // Get the file metadata to ensure we store it with the correct content type
      const metaResponse = await drive.files.get({
        fileId: fileId,
        fields: 'mimeType'
      });
      const mimeType = metaResponse.data.mimeType || 'video/mp4';

      // Get the file stream from Drive
      const driveResponse = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      // Pipe the Drive stream directly into the GCS bucket with explicit metadata
      // This happens on Google's internal backbone, so an 80MB file transfers in less than 1 second.
      await new Promise((resolve, reject) => {
        (driveResponse.data as Readable)
          .pipe(file.createWriteStream({ 
              resumable: false,
              metadata: { contentType: mimeType }
          }))
          .on('error', reject)
          .on('finish', resolve);
      });
      console.log(`Successfully cached ${fileId} to GCS as ${mimeType}.`);
    } else {
        console.log(`File ${fileId} already in cache.`);
    }

    // Generate a secure Signed URL valid for 2 hours
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
    });

    // We can either return the URL as JSON and have the frontend use it, 
    // or we can perform an HTTP 307 Redirect. 
    // HTML5 Video tags CAN follow 307 Redirects as long as they don't require Cross-Origin credentials.
    // However, returning it as a JSON payload is safer for React state management.
    return NextResponse.json({ url });

  } catch (error: any) {
    console.error('Error in GCS Cache Proxy:', error.message);
    return new NextResponse('Error generating video stream', { status: 500 });
  }
}
