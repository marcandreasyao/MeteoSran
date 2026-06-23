import { PrismaClient } from '@prisma/client';
import { settleMatchPredictions } from '../server/matchService.js';

const prisma = new PrismaClient();

async function check() {
    // 1. Fetch current leaderboard
    const preds = await prisma.prediction.findMany();
    console.log("Current Predictions:", preds);

    // 2. Make arg_aut_2026 finished with home winning 2-0
    const updatedMatch = await prisma.worldCupMatch.update({
        where: { id: 'arg_aut_2026' },
        data: { status: 'finished', scoreHome: 2, scoreAway: 0 }
    });
    console.log("Updated match to finished:", updatedMatch.id);

    // 3. Settle predictions manually
    await settleMatchPredictions('arg_aut_2026', 2, 0);
    console.log("Settled predictions.");

    // 4. Check predictions again
    const settledPreds = await prisma.prediction.findMany();
    console.log("Settled Predictions:", settledPreds);

    // 5. Restore match status to scheduled so the app works properly
    await prisma.worldCupMatch.update({
        where: { id: 'arg_aut_2026' },
        data: { status: 'scheduled', scoreHome: 0, scoreAway: 0 }
    });
    console.log("Restored match back to scheduled.");
    
    await prisma.prediction.updateMany({
        where: { matchId: 'arg_aut_2026' },
        data: { isCorrect: null, points: 0 }
    });
    console.log("Restored predictions points back to 0.");
}

check().then(() => prisma.$disconnect());
