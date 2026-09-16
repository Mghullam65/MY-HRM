const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://fualeqgyjvflgkjgpohb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Yx_qmwQzE6x2NLmy9dJ44w_RotLBdbA';

async function seedSupabase() {
  console.log('🌱 Starting Master Data Upload to Supabase PostgreSQL...');

  const storePath = path.join(__dirname, '../server/data/hrm_store.json');
  if (!fs.existsSync(storePath)) {
    throw new Error('hrm_store.json not found at ' + storePath);
  }

  const rawStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const tableNames = Object.keys(rawStore);
  console.log(`Found ${tableNames.length} tables in local master store.`);

  // Upload in chunks of 15 tables
  const CHUNK_SIZE = 15;
  for (let i = 0; i < tableNames.length; i += CHUNK_SIZE) {
    const chunkNames = tableNames.slice(i, i + CHUNK_SIZE);
    const rows = chunkNames.map(name => ({
      id: name,
      data: rawStore[name],
      version: 1,
      updated_at: new Date().toISOString()
    }));

    const body = JSON.stringify(rows);
    await new Promise((resolve, reject) => {
      const req = https.request(`${SUPABASE_URL}/rest/v1/hrm_store`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        }
      }, res => {
        let respData = '';
        res.on('data', c => respData += c);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`  ✓ Uploaded chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(tableNames.length / CHUNK_SIZE)} (${chunkNames.join(', ')})`);
            resolve();
          } else {
            console.error(`  ✗ Chunk error (${res.statusCode}):`, respData);
            reject(new Error(`Failed with status ${res.statusCode}`));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  console.log('\n🎉 ALL 145 TABLES SUCCESSFULLY UPLOADED TO SUPABASE POSTGRESQL!');
}

seedSupabase().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
