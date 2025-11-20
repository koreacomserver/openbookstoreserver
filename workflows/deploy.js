const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase 초기화
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<YOUR_PROJECT_ID>.firebaseio.com"
});

// Google Drive API 초기화
const drive = google.drive('v3');
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/drive.file']
});

// Firebase Firestore 데이터 저장 예시
async function saveMetadataToFirestore(metadata) {
  const db = admin.firestore();
  const docRef = db.collection('books').doc();
  await docRef.set(metadata);
  console.log('Metadata saved to Firestore:', metadata);
}

// Google Drive에 파일 업로드 예시
async function uploadToDrive(filePath) {
  const authClient = await auth.getClient();
  const driveService = google.drive({ version: 'v3', auth: authClient });

  const fileMetadata = {
    name: path.basename(filePath),
    parents: ['<YOUR_GOOGLE_DRIVE_FOLDER_ID>'],
  };
  
  const media = {
    body: fs.createReadStream(filePath),
  };

  const res = await driveService.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id',
  });
  
  console.log('File uploaded to Drive with ID:', res.data.id);
  return res.data.id;
}

// main 함수에서 Firebase와 Google Drive 연동
async function main() {
  const filePath = './path/to/your/file.txt'; // 업로드할 파일 경로

  // Firestore에 메타데이터 저장
  const metadata = {
    title: 'Sample Book Title',
    description: 'Sample Book Description',
    type: 'application/pdf',
    uploaderId: 'user123',
    driveId: await uploadToDrive(filePath)  // 파일을 Google Drive에 업로드 후 ID 반환
  };
  await saveMetadataToFirestore(metadata);
}

main().catch(console.error);
