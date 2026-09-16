const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 1. Ensure all standard Postgres environment variables are defined
const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (dbUrl) {
  process.env.POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL || dbUrl;
  process.env.POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING || dbUrl;
  process.env.DATABASE_URL = process.env.DATABASE_URL || dbUrl;
} else {
  process.env.POSTGRES_PRISMA_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
  process.env.POSTGRES_URL_NON_POOLING = 'postgresql://dummy:dummy@localhost:5432/dummy';
  process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
}

// Locate Prisma CLI JS file
let prismaBin = 'prisma';
const localServerPrisma = path.join(__dirname, '../server/node_modules/prisma/build/index.js');
const rootPrisma = path.join(__dirname, '../node_modules/prisma/build/index.js');

if (fs.existsSync(localServerPrisma)) {
  prismaBin = `"${process.execPath}" "${localServerPrisma}"`;
} else if (fs.existsSync(rootPrisma)) {
  prismaBin = `"${process.execPath}" "${rootPrisma}"`;
}

// 0. Ensure public directory exists and mirrors static assets for Vercel builds
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
try {
  fs.copyFileSync(path.join(__dirname, '../index.html'), path.join(publicDir, 'index.html'));
  const dirsToCopy = ['css', 'js', 'img', 'assets'];
  for (const d of dirsToCopy) {
    const src = path.join(__dirname, '..', d);
    const dest = path.join(publicDir, d);
    if (fs.existsSync(src)) {
      fs.cpSync(src, dest, { recursive: true, force: true });
    }
  }
  console.log('✅ [Build] Static assets mirrored to public/ directory for Vercel.');
} catch (e) {
  console.warn('⚠️ [Build] Notice on copying assets to public/:', e.message);
}

console.log('⚡ [Build] Generating Prisma client...');
try {
  execSync(`${prismaBin} generate --schema=server/prisma/schema.prisma`, {
    stdio: 'inherit',
    env: process.env
  });
  console.log('✅ [Build] Prisma client generated successfully.');
} catch (err) {
  console.error('❌ [Build] Prisma generate failed:', err.message);
  process.exit(1);
}

// 2. If real database credentials are present, sync schema
if (dbUrl && !dbUrl.includes('dummy')) {
  try {
    console.log('⚡ [Build] Syncing database schema to Vercel Postgres...');
    execSync(`${prismaBin} db push --schema=server/prisma/schema.prisma --accept-data-loss`, {
      stdio: 'inherit',
      env: process.env
    });
    console.log('✅ [Build] Database schema synced successfully.');
  } catch (err) {
    console.warn('⚠️ [Build] Notice: db push could not complete during build container step (will sync at runtime):', err.message);
  }
}


