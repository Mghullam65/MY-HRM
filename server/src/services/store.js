const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');

function resolveStoreDir() {
  const localDir = path.join(__dirname, '../../data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, '.write_test');
    fs.writeFileSync(testFile, '1');
    fs.unlinkSync(testFile);
    return localDir;
  } catch (e) {
    const tmpDir = path.join(os.tmpdir(), 'hrm_store_data');
    if (!fs.existsSync(tmpDir)) {
      try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (err) {}
    }
    return tmpDir;
  }
}

class StoreService {
  constructor() {
    this.dataDir = resolveStoreDir();
    this.storePath = path.join(this.dataDir, 'hrm_store.json');
    this.metaPath = path.join(this.dataDir, 'hrm_meta.json');
    this.store = {};
    this.version = 1;
    this.updatedAt = Date.now();
    this.saveTimeout = null;
    this.sseClients = new Set();
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (e) {}

    if (fs.existsSync(this.storePath)) {
      try {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        this.store = JSON.parse(raw);
        if (fs.existsSync(this.metaPath)) {
          const meta = JSON.parse(fs.readFileSync(this.metaPath, 'utf8'));
          this.version = meta.version || 1;
          this.updatedAt = meta.updatedAt || Date.now();
        }
        console.log(`[StoreService] Loaded existing database from disk (${Object.keys(this.store).length} tables, version ${this.version})`);
      } catch (err) {
        console.error('[StoreService] Failed to read store, falling back to seed:', err.message);
        this.seedFromDataJs();
      }
    } else {
      console.log('[StoreService] No database found on disk, running master seed generation...');
      this.seedFromDataJs();
    }

    this.isInitialized = true;
    this.hydrateFromSupabase().catch(() => {});
  }

  seedFromDataJs() {
    try {
      const candidates = [
        path.join(__dirname, '../../../js/data.js'),
        path.join(process.cwd(), 'js/data.js'),
        path.join(process.cwd(), 'public/js/data.js'),
        path.join(__dirname, '../../data.js')
      ];
      let dataJsPath = candidates.find(p => fs.existsSync(p));
      if (!dataJsPath) {
        console.warn(`[StoreService] Master data file not found in candidates, starting with empty store.`);
        this.store = {};
        return;
      }

      const mockStorage = {};
      const sandbox = {
        localStorage: {
          getItem: (k) => mockStorage[k] || null,
          setItem: (k, v) => { mockStorage[k] = v; },
          removeItem: (k) => { delete mockStorage[k]; },
          clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
        },
        console: { log: () => {}, warn: () => {}, error: () => {} },
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Math: Math,
        Date: Date,
        JSON: JSON,
        parseInt: parseInt,
        parseFloat: parseFloat,
        isNaN: isNaN
      };
      sandbox.window = sandbox;
      sandbox.global = sandbox;

      const code = fs.readFileSync(dataJsPath, 'utf8') + '\n; this.DB = DB;';
      vm.createContext(sandbox);
      vm.runInContext(code, sandbox);
      sandbox.DB.init();

      const newStore = {};
      for (const [key, val] of Object.entries(mockStorage)) {
        if (key.startsWith('hrm_')) {
          const tableName = key.replace(/^hrm_/, '');
          if (tableName !== 'initialized') {
            try {
              newStore[tableName] = JSON.parse(val);
            } catch {
              newStore[tableName] = val;
            }
          }
        }
      }

      this.store = newStore;
      this.version = 1;
      this.updatedAt = Date.now();
      this.flushToDisk();
      console.log(`[StoreService] Master seed successful! Created ${Object.keys(this.store).length} tables.`);
    } catch (err) {
      console.error('[StoreService] Critical error during master seed:', err);
      this.store = {};
    }
  }

  flushToDisk() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    try {
      const tmpStore = this.storePath + '.tmp';
      const tmpMeta = this.metaPath + '.tmp';

      fs.writeFileSync(tmpStore, JSON.stringify(this.store), 'utf8');
      fs.renameSync(tmpStore, this.storePath);

      fs.writeFileSync(tmpMeta, JSON.stringify({ version: this.version, updatedAt: this.updatedAt }), 'utf8');
      fs.renameSync(tmpMeta, this.metaPath);
    } catch (err) {
      console.error('[StoreService] Disk save error:', err.message);
    }
  }

  scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.flushToDisk();
    }, 50);
  }

  getAll() {
    return {
      success: true,
      version: this.version,
      updatedAt: this.updatedAt,
      tables: this.store
    };
  }

  getVersion() {
    return {
      version: this.version,
      updatedAt: this.updatedAt
    };
  }

  getTable(name) {
    return this.store[name] || null;
  }

  getTables(names = []) {
    const result = {};
    names.forEach(name => {
      if (this.store[name] !== undefined) {
        result[name] = this.store[name];
      }
    });
    return result;
  }

  async pushToSupabase(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const supabaseUrl = 'https://fualeqgyjvflgkjgpohb.supabase.co';
    const supabaseKey = 'sb_publishable_Yx_qmwQzE6x2NLmy9dJ44w_RotLBdbA';
    try {
      if (typeof fetch !== 'undefined') {
        await fetch(`${supabaseUrl}/rest/v1/hrm_store`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(rows)
        });
      }
    } catch (err) {
      console.warn('[StoreService] Supabase cloud push notice:', err.message);
    }
  }

  async hydrateFromSupabase() {
    const supabaseUrl = 'https://fualeqgyjvflgkjgpohb.supabase.co';
    const supabaseKey = 'sb_publishable_Yx_qmwQzE6x2NLmy9dJ44w_RotLBdbA';
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch(`${supabaseUrl}/rest/v1/hrm_store?select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            rows.forEach(r => {
              if (r.id && r.data) {
                this.store[r.id] = r.data;
              }
            });
            console.log(`[StoreService] ⚡ Hydrated ${rows.length} master tables from Supabase Cloud!`);
          }
        }
      }
    } catch (err) {
      console.warn('[StoreService] Hydrate from Supabase notice:', err.message);
    }
  }

  setTable(name, data, senderClientId = null) {
    this.store[name] = data;
    this.version++;
    this.updatedAt = Date.now();
    this.scheduleSave();

    this.pushToSupabase([{
      id: name,
      data: data,
      version: this.version,
      updated_at: new Date().toISOString()
    }]).catch(() => {});

    this.broadcast('table_update', {
      table: name,
      version: this.version,
      updatedAt: this.updatedAt,
      senderClientId
    });

    return {
      success: true,
      table: name,
      version: this.version,
      updatedAt: this.updatedAt
    };
  }

  setBatch(tablesObj = {}, senderClientId = null) {
    const updatedNames = [];
    for (const [name, data] of Object.entries(tablesObj)) {
      this.store[name] = data;
      updatedNames.push(name);
    }
    this.version++;
    this.updatedAt = Date.now();
    this.scheduleSave();

    const rows = Object.entries(tablesObj).map(([t, d]) => ({
      id: t,
      data: d,
      version: this.version,
      updated_at: new Date().toISOString()
    }));
    this.pushToSupabase(rows).catch(() => {});

    this.broadcast('batch_update', {
      tables: updatedNames,
      version: this.version,
      updatedAt: this.updatedAt,
      senderClientId
    });

    return {
      success: true,
      tables: updatedNames,
      version: this.version,
      updatedAt: this.updatedAt
    };
  }

  subscribe(res) {
    this.sseClients.add(res);
    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  broadcast(event, payload) {
    const dataStr = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(dataStr);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }
}

const instance = new StoreService();
module.exports = instance;
