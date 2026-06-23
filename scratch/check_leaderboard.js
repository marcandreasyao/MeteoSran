import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const predictions = await prisma.prediction.findMany();
    console.log('Predictions:', predictions);
    
    const matches = await prisma.worldCupMatch.findMany({
        select: { id: true, homeName: true, awayName: true, votesHome: true, votesDraw: true, votesAway: true }
    });
    console.log('Matches with votes:');
    for (const match of matches) {
        if (match.votesHome > 0 || match.votesDraw > 0 || match.votesAway > 0) {
            console.log(match);
        }
    }
}

check().then(() => prisma.$disconnect());
