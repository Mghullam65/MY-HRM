const { PrismaClient } = require('@prisma/client');
const seedDatabase = require('./seed-fn');

const prisma = new PrismaClient();

async function main() {
  await seedDatabase(prisma);
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
