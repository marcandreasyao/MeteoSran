import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Football-Data.org API key
const FOOTBALL_DATA_TOKEN = process.env.FOOTBALL_DATA_TOKEN || '';

// Tracks the last time we successfully called the external API (ms epoch)
let lastApiSyncMs = 0;
const API_SYNC_MIN_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

// Map Football-Data.org status strings to our internal status strings
const FD_STATUS_MAP = {
    SCHEDULED: 'scheduled',
    TIMED: 'scheduled',
    IN_PLAY: 'live',
    PAUSED: 'live',
    FINISHED: 'finished',
    AWARDED: 'finished',
    POSTPONED: 'scheduled',
    CANCELLED: 'scheduled',
    SUSPENDED: 'live',
};

// Map Football-Data.org group strings to our display format
function mapGroup(apiGroup) {
    if (!apiGroup) return 'Group Stage';
    // "GROUP_A" -> "Group A"
    return apiGroup.replace('GROUP_', 'Group ');
}

// Generate a stable internal ID from team codes and kickoff
function generateMatchId(homeCode, awayCode) {
    const h = (homeCode || 'unk').toLowerCase().replace(/[^a-z]/g, '');
    const a = (awayCode || 'unk').toLowerCase().replace(/[^a-z]/g, '');
    return `${h}_${a}_2026`;
}

// Country code mapping: Football-Data.org TLA -> ISO 2-letter code
const TLA_TO_ISO = {
    MEX: 'MX', RSA: 'ZA', KOR: 'KR', CZE: 'CZ',
    CAN: 'CA', QAT: 'QA', BIH: 'BA', SUI: 'CH',
    BRA: 'BR', MAR: 'MA', HAI: 'HT', SCO: 'GB-SCT',
    USA: 'US', PAR: 'PY', AUS: 'AU', TUR: 'TR',
    GER: 'DE', CUW: 'CW', NED: 'NL', JPN: 'JP',
    CIV: 'CI', ECU: 'EC', SWE: 'SE', TUN: 'TN',
    BEL: 'BE', EGY: 'EG', IRN: 'IR', NZL: 'NZ',
    ESP: 'ES', CPV: 'CV', KSA: 'SA', URY: 'UY',
    FRA: 'FR', SEN: 'SN', IRQ: 'IQ', NOR: 'NO',
    ARG: 'AR', ALG: 'DZ', AUT: 'AT', JOR: 'JO',
    POR: 'PT', COD: 'CD', ENG: 'GB-ENG', CRO: 'HR',
    GHA: 'GH', PAN: 'PA', UZB: 'UZ', COL: 'CO',
    // More will be auto-handled by fallback
};

function tlaToIso(tla) {
    if (!tla) return 'UN';
    return TLA_TO_ISO[tla] || tla;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convert a DB row to the frontend-compatible match shape
// ─────────────────────────────────────────────────────────────────────────────
function dbRowToMatch(row) {
    return {
        id: row.id,
        fdApiId: row.fdApiId,
        group: row.group,
        round: row.round,
        home: { name: row.homeName, code: row.homeCode },
        away: { name: row.awayName, code: row.awayCode },
        kickoff: row.kickoff.toISOString(),
        venue: { name: row.venueName || '', city: row.venueCity || '' },
        status: row.status,
        score: { home: row.scoreHome, away: row.scoreAway },
        htScore: row.htScoreHome != null ? { home: row.htScoreHome, away: row.htScoreAway } : null,
        elapsed: row.elapsed,
        votes: { home: row.votesHome, draw: row.votesDraw, away: row.votesAway },
        stats: row.stats || generateStatsFromScore(row),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate plausible match stats from score (when no API provides them)
// Uses seeded randomness from team names for consistency
// ─────────────────────────────────────────────────────────────────────────────
function generateStatsFromScore(row) {
    if (row.status !== 'finished' && row.status !== 'live') {
        return {
            possession: { home: 50, away: 50 },
            shots: { home: 0, away: 0 },
            shotsOnTarget: { home: 0, away: 0 },
            fouls: { home: 0, away: 0 },
            yellowCards: { home: 0, away: 0 },
            corners: { home: 0, away: 0 },
        };
    }

    // Simple seed from team name chars for consistent pseudo-random
    const seed = (row.homeName + row.awayName).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const seededRand = (min, max) => min + ((seed * 7 + max * 13) % (max - min + 1));

    const totalGoals = row.scoreHome + row.scoreAway;
    const homeAdvantage = totalGoals > 0 ? row.scoreHome / totalGoals : 0.5;

    // Possession correlates with who scored more
    const homePoss = Math.max(35, Math.min(65, Math.round(45 + (homeAdvantage - 0.5) * 30 + seededRand(-3, 3))));
    const awayPoss = 100 - homePoss;

    // Shots correlate with goals (~4-6 shots per goal, plus some misses)
    const homeShots = Math.max(row.scoreHome + 2, Math.round(row.scoreHome * 4.5 + seededRand(3, 7)));
    const awayShots = Math.max(row.scoreAway + 2, Math.round(row.scoreAway * 4.5 + seededRand(2, 6)));
    const homeSOT = Math.max(row.scoreHome, Math.round(homeShots * 0.4 + seededRand(0, 2)));
    const awaySOT = Math.max(row.scoreAway, Math.round(awayShots * 0.4 + seededRand(0, 2)));

    return {
        possession: { home: homePoss, away: awayPoss },
        shots: { home: homeShots, away: awayShots },
        shotsOnTarget: { home: homeSOT, away: awaySOT },
        fouls: { home: seededRand(8, 16), away: seededRand(8, 16) },
        yellowCards: { home: seededRand(1, 3), away: seededRand(1, 3) },
        corners: { home: seededRand(3, 8), away: seededRand(2, 7) },
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Startup: fetch full WC tournament from Football-Data.org and seed the DB
// ─────────────────────────────────────────────────────────────────────────────
export async function seedFromAPI() {
    if (!FOOTBALL_DATA_TOKEN) {
        console.warn('[MatchSync] No FOOTBALL_DATA_TOKEN — cannot seed from API.');
        return;
    }

    try {
        const url = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';
        const res = await fetch(url, {
            headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN },
            signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
            console.warn(`[MatchSync] Seed API returned ${res.status} — skipping.`);
            return;
        }

        const json = await res.json();
        const apiMatches = (json.matches || []).filter(m =>
            m.stage === 'GROUP_STAGE' && m.homeTeam?.name && m.awayTeam?.name
        );

        let upsertCount = 0;
        for (const am of apiMatches) {
            const homeCode = tlaToIso(am.homeTeam.tla);
            const awayCode = tlaToIso(am.awayTeam.tla);
            const matchId = generateMatchId(am.homeTeam.tla, am.awayTeam.tla);
            const status = FD_STATUS_MAP[am.status] || 'scheduled';
            const fullTime = am.score?.fullTime;
            const halfTime = am.score?.halfTime;

            await prisma.worldCupMatch.upsert({
                where: { id: matchId },
                create: {
                    id: matchId,
                    fdApiId: am.id,
                    group: mapGroup(am.group),
                    round: `Round ${am.matchday || 1}`,
                    homeName: am.homeTeam.shortName || am.homeTeam.name,
                    homeCode,
                    awayName: am.awayTeam.shortName || am.awayTeam.name,
                    awayCode,
                    kickoff: new Date(am.utcDate),
                    venueName: am.venue || null,
                    venueCity: null,
                    status,
                    scoreHome: fullTime?.home ?? 0,
                    scoreAway: fullTime?.away ?? 0,
                    htScoreHome: halfTime?.home ?? null,
                    htScoreAway: halfTime?.away ?? null,
                    elapsed: status === 'finished' ? 90 : (status === 'live' ? (am.minute || 0) : null),
                    lastSyncedAt: new Date(),
                },
                update: {
                    fdApiId: am.id,
                    group: mapGroup(am.group),
                    round: `Round ${am.matchday || 1}`,
                    homeName: am.homeTeam.shortName || am.homeTeam.name,
                    homeCode,
                    awayName: am.awayTeam.shortName || am.awayTeam.name,
                    awayCode,
                    kickoff: new Date(am.utcDate),
                    status,
                    scoreHome: fullTime?.home ?? 0,
                    scoreAway: fullTime?.away ?? 0,
                    htScoreHome: halfTime?.home ?? null,
                    htScoreAway: halfTime?.away ?? null,
                    elapsed: status === 'finished' ? 90 : (status === 'live' ? (am.minute || 0) : null),
                    lastSyncedAt: new Date(),
                },
            });
            upsertCount++;
        }

        lastApiSyncMs = Date.now();
        console.log(`[MatchSync] Seeded/updated ${upsertCount} group-stage matches from Football-Data.org.`);
    } catch (err) {
        console.warn('[MatchSync] Seed failed:', err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 1 — Time-based auto-correction (zero API calls)
// ─────────────────────────────────────────────────────────────────────────────
async function autoCorrectStatuses() {
    const now = new Date();

    // Scheduled matches whose kickoff has passed -> live
    const startedMatches = await prisma.worldCupMatch.findMany({
        where: { status: 'scheduled', kickoff: { lte: now } },
    });
    for (const m of startedMatches) {
        const elapsedMin = Math.floor((now.getTime() - m.kickoff.getTime()) / 60000);
        if (elapsedMin >= 120) {
            // Safety: should be finished
            await prisma.worldCupMatch.update({
                where: { id: m.id },
                data: { status: 'finished', elapsed: 90 },
            });
            console.log(`[MatchSync] Auto-finished (safety): ${m.homeName} vs ${m.awayName}`);
        } else {
            await prisma.worldCupMatch.update({
                where: { id: m.id },
                data: { status: 'live', elapsed: Math.min(90, elapsedMin) },
            });
            console.log(`[MatchSync] Auto-started: ${m.homeName} vs ${m.awayName} (${Math.min(90, elapsedMin)}')`);
        }
    }

    // Live matches past 120 min -> finished
    const staleLive = await prisma.worldCupMatch.findMany({
        where: { status: 'live' },
    });
    for (const m of staleLive) {
        const elapsedMin = Math.floor((now.getTime() - m.kickoff.getTime()) / 60000);
        if (elapsedMin >= 120) {
            await prisma.worldCupMatch.update({
                where: { id: m.id },
                data: { status: 'finished', elapsed: 90 },
            });
            console.log(`[MatchSync] Auto-finished (120min): ${m.homeName} vs ${m.awayName}`);
        } else {
            // Just update elapsed minute
            await prisma.worldCupMatch.update({
                where: { id: m.id },
                data: { elapsed: Math.min(90, elapsedMin) },
            });
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 2 — Football-Data.org API sync for live/finished matches
// ─────────────────────────────────────────────────────────────────────────────
async function syncFromAPI() {
    if (!FOOTBALL_DATA_TOKEN) return;

    const now = Date.now();
    if (now - lastApiSyncMs < API_SYNC_MIN_INTERVAL_MS) return;

    try {
        const url = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026&status=IN_PLAY,PAUSED,FINISHED';
        const res = await fetch(url, {
            headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN },
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
            console.warn(`[MatchSync] Football-Data.org returned ${res.status}`);
            return;
        }

        const json = await res.json();
        lastApiSyncMs = now;

        const apiMatches = (json.matches || []).filter(m =>
            m.stage === 'GROUP_STAGE' && m.homeTeam?.name
        );
        let syncCount = 0;

        for (const am of apiMatches) {
            if (!am.homeTeam?.tla || !am.awayTeam?.tla) continue;

            // Find in DB by Football-Data.org fixture ID
            let dbMatch = await prisma.worldCupMatch.findUnique({
                where: { fdApiId: am.id },
            });

            // Fallback: try by our generated ID
            if (!dbMatch) {
                const matchId = generateMatchId(am.homeTeam.tla, am.awayTeam.tla);
                dbMatch = await prisma.worldCupMatch.findUnique({
                    where: { id: matchId },
                });
            }

            if (!dbMatch) continue;

            const newStatus = FD_STATUS_MAP[am.status] || dbMatch.status;
            const fullTime = am.score?.fullTime;
            const halfTime = am.score?.halfTime;

            const updateData = {
                status: newStatus,
                lastSyncedAt: new Date(),
            };

            if (fullTime?.home != null) updateData.scoreHome = fullTime.home;
            if (fullTime?.away != null) updateData.scoreAway = fullTime.away;
            if (halfTime?.home != null) updateData.htScoreHome = halfTime.home;
            if (halfTime?.away != null) updateData.htScoreAway = halfTime.away;

            if (am.minute != null) {
                updateData.elapsed = am.minute;
            } else if (newStatus === 'finished') {
                updateData.elapsed = 90;
            }

            // Regenerate stats from new scores
            const mergedRow = { ...dbMatch, ...updateData };
            if (newStatus === 'finished' || newStatus === 'live') {
                updateData.stats = generateStatsFromScore(mergedRow);
            }

            if (newStatus !== dbMatch.status) {
                console.log(`[MatchSync] ${dbMatch.homeName} vs ${dbMatch.awayName}: ${dbMatch.status} -> ${newStatus}`);
            }

            await prisma.worldCupMatch.update({
                where: { id: dbMatch.id },
                data: updateData,
            });
            syncCount++;
        }

        if (syncCount > 0) {
            console.log(`[MatchSync] Synced ${syncCount} match(es) from Football-Data.org.`);
        }
    } catch (err) {
        console.warn('[MatchSync] API sync failed:', err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart poller: 60s tick, API calls only during active match windows
// ─────────────────────────────────────────────────────────────────────────────
export function startSmartPoller() {
    console.log('[MatchSync] Smart match poller started (60s tick).');

    setInterval(async () => {
        try {
            // Layer 1 always runs (zero cost)
            await autoCorrectStatuses();

            // Check if API sync is warranted
            const now = new Date();
            const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

            const liveCount = await prisma.worldCupMatch.count({
                where: { status: 'live' },
            });

            // Also check recently-finished: finished AND kickoff was < 2.5 hours ago
            const twoHoursAgo = new Date(now.getTime() - 150 * 60 * 1000);
            const recentlyFinishedCount = await prisma.worldCupMatch.count({
                where: {
                    status: 'finished',
                    kickoff: { gte: twoHoursAgo },
                    OR: [
                        { lastSyncedAt: null },
                        { lastSyncedAt: { lt: thirtyMinAgo } },
                    ],
                },
            });

            if (liveCount > 0 || recentlyFinishedCount > 0) {
                await syncFromAPI();
            }
        } catch (err) {
            console.warn('[MatchSync] Poller tick error:', err.message);
        }
    }, 60 * 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — same function signatures as the old file-based matchService
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllMatches() {
    const rows = await prisma.worldCupMatch.findMany({
        orderBy: { kickoff: 'asc' },
    });
    return rows.map(dbRowToMatch);
}

export async function getMatchById(id) {
    const row = await prisma.worldCupMatch.findUnique({ where: { id } });
    if (!row) return null;
    return dbRowToMatch(row);
}

export async function recordVote(id, teamChoice) {
    const row = await prisma.worldCupMatch.findUnique({ where: { id } });
    if (!row) return null;

    const updateData = {};
    if (teamChoice === 'home') updateData.votesHome = { increment: 1 };
    else if (teamChoice === 'draw') updateData.votesDraw = { increment: 1 };
    else if (teamChoice === 'away') updateData.votesAway = { increment: 1 };

    const updated = await prisma.worldCupMatch.update({
        where: { id },
        data: updateData,
    });

    return dbRowToMatch(updated);
}

export function getVotePercentages(match) {
    const total = match.votes.home + match.votes.draw + match.votes.away;
    if (total === 0) return { home: 33, draw: 33, away: 34, total };
    return {
        home: Math.round((match.votes.home / total) * 100),
        draw: Math.round((match.votes.draw / total) * 100),
        away: Math.round((match.votes.away / total) * 100),
        total
    };
}

export async function getGroupStandings(groupName) {
    const groupMatches = await prisma.worldCupMatch.findMany({
        where: {
            group: { equals: groupName, mode: 'insensitive' },
            status: { in: ['finished', 'live'] },
        },
    });

    const allGroupMatches = await prisma.worldCupMatch.findMany({
        where: {
            group: { equals: groupName, mode: 'insensitive' },
        },
    });

    const teams = {};

    function ensureTeam(name) {
        if (!teams[name]) {
            teams[name] = {
                team: name,
                played: 0, won: 0, drawn: 0, lost: 0,
                goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
            };
        }
    }

    for (const m of groupMatches) {
        ensureTeam(m.homeName);
        ensureTeam(m.awayName);

        teams[m.homeName].played += 1;
        teams[m.awayName].played += 1;
        teams[m.homeName].goalsFor += m.scoreHome;
        teams[m.homeName].goalsAgainst += m.scoreAway;
        teams[m.awayName].goalsFor += m.scoreAway;
        teams[m.awayName].goalsAgainst += m.scoreHome;

        if (m.scoreHome > m.scoreAway) {
            teams[m.homeName].won += 1;
            teams[m.homeName].points += 3;
            teams[m.awayName].lost += 1;
        } else if (m.scoreHome < m.scoreAway) {
            teams[m.awayName].won += 1;
            teams[m.awayName].points += 3;
            teams[m.homeName].lost += 1;
        } else {
            teams[m.homeName].drawn += 1;
            teams[m.awayName].drawn += 1;
            teams[m.homeName].points += 1;
            teams[m.awayName].points += 1;
        }
    }

    for (const t of Object.values(teams)) {
        t.goalDifference = t.goalsFor - t.goalsAgainst;
    }

    // Include teams from scheduled matches that haven't played yet
    for (const m of allGroupMatches) {
        ensureTeam(m.homeName);
        ensureTeam(m.awayName);
    }

    return Object.values(teams).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.goalDifference - a.goalDifference;
    });
}
