// Normalize all Vercel Postgres environment variables
const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (dbUrl) {
  process.env.POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL || dbUrl;
  process.env.POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING || dbUrl;
  process.env.DATABASE_URL = process.env.DATABASE_URL || dbUrl;
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
