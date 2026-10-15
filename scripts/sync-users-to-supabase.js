const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://fualeqgyjvflgkjgpohb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Yx_qmwQzE6x2NLmy9dJ44w_RotLBdbA';

async function updateUsers() {
  console.log('🔄 Uploading updated users table to Supabase...');
  const storePath = path.join(__dirname, '../server/data/hrm_store.json');
  const rawStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const users = rawStore.users;

  const rows = [{
    id: 'users',
    data: users,
    version: 8,
    updated_at: new Date().toISOString()
  }];

  const body = JSON.stringify(rows);
  return new Promise((resolve, reject) => {
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
          console.log('✅ Users successfully updated in Supabase cloud PostgreSQL!');
          resolve();
        } else {
          console.error(`✗ Error (${res.statusCode}):`, respData);
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });
    req.on('error', err => {
      console.warn('⚠️ Supabase network notice:', err.message);
      resolve(); // Do not fail script if network is unavailable
    });
    req.write(body);
    req.end();
  });
}

updateUsers().catch(err => {
  console.error('Update failed:', err.message);
});
