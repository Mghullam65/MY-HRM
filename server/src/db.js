// Normalize all Vercel Postgres environment variables
const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (dbUrl) {
  process.env.POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL || dbUrl;
  process.env.POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING || dbUrl;
  process.env.DATABASE_URL = process.env.DATABASE_URL || dbUrl;
}

let basePrisma;
let isDbAvailable = null; // null = untested, true = online, false = offline

try {
  const { PrismaClient } = require('@prisma/client');
  basePrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });
} catch (err) {
  console.warn('[DB] Prisma initialization warning (falling back to graceful proxy):', err.message);
  isDbAvailable = false;
}

function withTimeout(promise, ms = 800) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timed out')), ms))
  ]);
}

const prisma = new Proxy(basePrisma || {}, {
  get(target, prop) {
    if (!basePrisma) {
      return new Proxy({}, {
        get() {
          return async () => { throw new Error('Database unavailable'); };
        }
      });
    }

    if (prop === '$queryRaw' || prop === '$executeRaw') {
      return async (...args) => {
        if (isDbAvailable === false) throw new Error('Database offline');
        try {
          const res = await withTimeout(basePrisma[prop](...args));
          isDbAvailable = true;
          return res;
        } catch (e) {
          isDbAvailable = false;
          throw e;
        }
      };
    }

    if (prop === '$disconnect' || prop === '$connect') {
      return basePrisma[prop]?.bind(basePrisma);
    }

    const model = basePrisma[prop];
    if (!model || typeof model !== 'object') {
      return model;
    }

    return new Proxy(model, {
      get(mTarget, mProp) {
        const fn = mTarget[mProp];
        if (typeof fn !== 'function') return fn;
        return async (...args) => {
          if (isDbAvailable === false) {
            throw new Error('Database offline (fast fallback)');
          }
          try {
            const result = await withTimeout(fn.apply(mTarget, args));
            isDbAvailable = true;
            return result;
          } catch (e) {
            isDbAvailable = false;
            throw e;
          }
        };
      }
    });
  }
});

module.exports = prisma;

