const https = require('https');
const fs = require('fs');
const path = require('path');

const APP_URL = "https://my-hrm-rosy.vercel.app/";
const MANIFEST_URL = "https://my-hrm-rosy.vercel.app/manifest.json";

async function run() {
  console.log("🚀 Requesting Cloud APK build from Microsoft PWABuilder...");
  
  const payload = {
    appVersion: "3.1.0",
    appVersionCode: 310,
    backgroundColor: "#0f172a",
    display: "standalone",
    enableNotifications: true,
    enableSiteSettingsShortcut: true,
    fallbackType: "customtabs",
    features: {
      locationDelegation: { enabled: true },
      playBilling: { enabled: false }
    },
    host: "my-hrm-rosy.vercel.app",
    iconUrl: "https://my-hrm-rosy.vercel.app/assets/icon-512.png",
    includeSourceCode: true,
    isChromeOSOnly: false,
    launcherName: "HRM Pro",
    maskableIconUrl: "https://my-hrm-rosy.vercel.app/assets/icon-512.png",
    monochromeIconUrl: "https://my-hrm-rosy.vercel.app/assets/icon-512.png",
    name: "HRM Pro Enterprise",
    navigationColor: "#0f172a",
    navigationColorDark: "#0f172a",
    navigationDividerColor: "#0f172a",
    navigationDividerColorDark: "#0f172a",
    orientation: "default",
    packageId: "com.hrmpro.app",
    shareTarget: null,
    shortcuts: [],
    signingMode: "new",
    signing: {
      file: null,
      alias: "hrmpro-key",
      fullName: "HRM Pro Admin",
      organization: "HRM Pro Enterprise",
      organizationalUnit: "Engineering",
      countryCode: "PK",
      keyPassword: "hrmpro_secure_pass_2026",
      storePassword: "hrmpro_store_pass_2026"
    },
    splashScreenFadeOutDuration: 300,
    startUrl: "/",
    themeColor: "#2563eb",
    themeColorDark: "#0f172a",
    webManifestUrl: MANIFEST_URL
  };

  const data = JSON.stringify(payload);

  const jobId = await new Promise((resolve, reject) => {
    const req = https.request("https://pwabuilder-cloudapk.azurewebsites.net/enqueuePackageJob", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "platform-identifier": "ServerUI",
        "platform-identifier-version": "1.0.0",
        "content-length": Buffer.byteLength(data)
      }
    }, (res) => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body.trim());
        } else {
          reject(new Error(`Failed to enqueue: ${res.statusCode} ${body}`));
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });

  console.log(`✅ Job enqueued successfully. Job ID: ${jobId}`);
  console.log("⏳ Waiting for cloud compiler to assemble Android package...");

  let completed = false;
  let attempts = 0;
  while (!completed && attempts < 60) {
    await new Promise(r => setTimeout(r, 4000));
    attempts++;

    const job = await new Promise((resolve, reject) => {
      https.get(`https://pwabuilder-cloudapk.azurewebsites.net/getPackageJob?id=${encodeURIComponent(jobId)}`, (res) => {
        let body = "";
        res.on("data", c => body += c);
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      }).on("error", reject);
    });

    console.log(`   [${attempts * 4}s] Status: ${job.status}`);
    if (job.status === "Completed") {
      completed = true;
      break;
    } else if (job.status === "Failed") {
      console.error("Job logs:", job.logs);
      throw new Error("Cloud packaging job failed");
    }
  }

  if (!completed) throw new Error("Timed out waiting for Cloud APK build");

  console.log("📦 Downloading generated Android package zip...");
  const zipPath = path.join(__dirname, "..", "dist-packages", "android-cloud-package.zip");
  if (!fs.existsSync(path.dirname(zipPath))) {
    fs.mkdirSync(path.dirname(zipPath), { recursive: true });
  }

  await new Promise((resolve, reject) => {
    https.get(`https://pwabuilder-cloudapk.azurewebsites.net/downloadPackageZip?id=${encodeURIComponent(jobId)}`, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Download failed with ${res.statusCode}`));
      const fileStream = fs.createWriteStream(zipPath);
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
    }).on("error", reject);
  });

  console.log(`✅ Downloaded package zip (${fs.statSync(zipPath).size} bytes) to: ${zipPath}`);
}

run().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
