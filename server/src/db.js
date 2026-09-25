// Normalize all Vercel Postgres environment variables
const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (dbUrl) {
  process.env.POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL || dbUrl;
  process.env.POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING || dbUrl;
  process.env.DATABASE_URL = process.env.DATABASE_URL || dbUrl;
}

let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });
} catch (err) {
  console.warn('[DB] Prisma initialization warning (falling back to graceful proxy):', err.message);
  prisma = new Proxy({}, {
    get(target, prop) {
      if (prop === '$queryRaw') return async () => { throw new Error('Database not connected: ' + err.message); };
      if (prop === '$disconnect') return async () => {};
      return new Proxy({}, {
        get(mTarget, mProp) {
          return async () => { throw new Error(`Database unavailable: ${String(prop)}.${String(mProp)}`); };
        }
      });
    }
  });
}

module.exports = prisma;
