import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    try {
        console.log("Connecting to Supabase via Prisma...");
        const count = await prisma.worldCupMatch.count();
        console.log(`Connection successful! Total matches in database: ${count}`);
        
        const recentMatches = await prisma.worldCupMatch.findMany({
            orderBy: { lastSyncedAt: 'desc' },
            take: 3
        });
        
        console.log("\nMost recently synced matches:");
        recentMatches.forEach(m => {
            console.log(`- ${m.homeName} vs ${m.awayName} (${m.status}) | Last Synced: ${m.lastSyncedAt}`);
        });
        
        const liveMatches = await prisma.worldCupMatch.findMany({
            where: { status: 'live' }
        });
        console.log(`\nCurrently live matches: ${liveMatches.length}`);
        
    } catch (error) {
        console.error("Database connection failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
