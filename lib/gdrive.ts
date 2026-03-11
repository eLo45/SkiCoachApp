import { google } from 'googleapis';

function getAuth() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set.');
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (error) {
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON. Ensure it is a valid JSON string.');
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
}

export async function getDriveClient() {
  const auth = getAuth();
  return google.drive({ version: 'v3', auth });
}
