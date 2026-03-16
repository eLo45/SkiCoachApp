const { google } = require('googleapis');

async function list() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.list({ pageSize: 2, q: "mimeType contains 'video'" });
  console.log(res.data.files);
}
list().catch(console.error);
