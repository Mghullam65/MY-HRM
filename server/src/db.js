// Support Vercel Postgres environment variables automatically
if (!process.env.DATABASE_URL && (process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL)) {
  process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
