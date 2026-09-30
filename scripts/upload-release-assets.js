const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = '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';
const REPO = 'Mghullam65/MY-HRM';
const RELEASE_ID = 399974468;

async function uploadAsset(filePath, assetName, contentType) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  const stats = fs.statSync(filePath);
  console.log(`🚀 Uploading ${assetName} (${(stats.size / 1024 / 1024).toFixed(1)} MB)...`);

  return new Promise((resolve, reject) => {
    const uploadUrl = `https://uploads.github.com/repos/${REPO}/releases/${RELEASE_ID}/assets?name=${encodeURIComponent(assetName)}`;
    const parsed = new URL(uploadUrl);

    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'HRM-Pro-Uploader',
        'Content-Type': contentType,
        'Content-Length': stats.size
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const json = JSON.parse(body);
          console.log(`✅ Asset ${assetName} uploaded successfully!`);
          console.log(`   Download URL: ${json.browser_download_url}`);
          resolve(json);
        } else {
          console.error(`❌ Failed with status ${res.statusCode}:`, body);
          reject(new Error(`Upload failed: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);

    const stream = fs.createReadStream(filePath);
    stream.pipe(req);
  });
}

async function main() {
  const winZip = path.join(__dirname, '..', 'dist-packages', 'HRM-Pro-Windows-Desktop.zip');
  await uploadAsset(winZip, 'HRM-Pro-Windows-Desktop.zip', 'application/zip');
}

main().catch(err => {
  console.error("Upload error:", err.message);
  process.exit(1);
});
