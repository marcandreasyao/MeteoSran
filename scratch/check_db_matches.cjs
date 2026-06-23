const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.worldCupMatch.findMany();
  const cities = new Set(matches.map(m => m.venueCity));
  const venues = new Set(matches.map(m => m.venueName));
  console.log('Unique Cities in DB:', Array.from(cities));
  console.log('Unique Venues in DB:', Array.from(venues));
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
