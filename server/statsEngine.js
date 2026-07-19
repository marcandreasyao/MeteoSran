import prisma from './db.js';

// Simple in-memory cache for aggregate statistics
let statsCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

function invalidateCache() {
    statsCache = null;
    lastCacheTime = 0;
}

/**
 * Normalizes a team name/alias to match the canonical names in our database.
 */
export function normalizeTeamName(inputName) {
    if (!inputName) return null;
    const clean = inputName.toLowerCase().trim();

    const aliasMap = {
        // France
        'france': 'France', 'les bleus': 'France', 'fra': 'France', 'français': 'France', 'francais': 'France',
        // Argentina
        'argentina': 'Argentina', 'argentine': 'Argentina', 'albiceleste': 'Argentina', 'arg': 'Argentina',
        // Algeria
        'algeria': 'Algeria', 'algérie': 'Algeria', 'algerie': 'Algeria', 'alg': 'Algeria', 'dz': 'Algeria',
        // Senegal
        'senegal': 'Senegal', 'sénégal': 'Senegal', 'sen': 'Senegal',
        // USA
        'usa': 'USA', 'united states': 'USA', 'états-unis': 'USA', 'etats-unis': 'USA', 'us': 'USA',
        // Iraq
        'iraq': 'Iraq', 'irak': 'Iraq', 'irq': 'Iraq',
        // Norway
        'norway': 'Norway', 'norvège': 'Norway', 'norvege': 'Norway', 'nor': 'Norway',
        // Austria
        'austria': 'Austria', 'autriche': 'Austria', 'aut': 'Austria',
        // Jordan
        'jordan': 'Jordan', 'jordanie': 'Jordan', 'jor': 'Jordan',
        // Portugal
        'portugal': 'Portugal', 'por': 'Portugal',
        // Congo DR
        'congo dr': 'Congo DR', 'rd congo': 'Congo DR', 'dr congo': 'Congo DR', 'congo': 'Congo DR', 'cod': 'Congo DR',
        // England
        'england': 'England', 'angleterre': 'England', 'eng': 'England',
        // Croatia
        'croatia': 'Croatia', 'croatie': 'Croatia', 'cro': 'Croatia',
        // Ghana
        'ghana': 'Ghana', 'gha': 'Ghana',
        // Panama
        'panama': 'Panama', 'pan': 'Panama',
        // Uzbekistan
        'uzbekistan': 'Uzbekistan', 'ouzbekistan': 'Uzbekistan', 'uzb': 'Uzbekistan',
        // Colombia
        'colombia': 'Colombia', 'colombie': 'Colombia', 'col': 'Colombia',
        // Mexico
        'mexico': 'Mexico', 'mexique': 'Mexico', 'mex': 'Mexico',
        // South Africa
        'south africa': 'South Africa', 'afrique du sud': 'South Africa', 'rsa': 'South Africa',
        // Korea Republic
        'korea republic': 'Korea Republic', 'south korea': 'Korea Republic', 'corée du sud': 'Korea Republic', 'coree du sud': 'Korea Republic', 'kor': 'Korea Republic',
        // Czechia
        'czechia': 'Czechia', 'czech republic': 'Czechia', 'république tchèque': 'Czechia', 'republique tcheque': 'Czechia', 'cze': 'Czechia',
        // Canada
        'canada': 'Canada', 'can': 'Canada',
        // Bosnia-H.
        'bosnia-h.': 'Bosnia-H.', 'bosnia': 'Bosnia-H.', 'bosnie': 'Bosnia-H.', 'bih': 'Bosnia-H.',
        // Paraguay
        'paraguay': 'Paraguay', 'par': 'Paraguay',
        // Qatar
        'qatar': 'Qatar', 'qat': 'Qatar',
        // Switzerland
        'switzerland': 'Switzerland', 'suisse': 'Switzerland', 'sui': 'Switzerland',
        // Brazil
        'brazil': 'Brazil', 'brésil': 'Brazil', 'bresil': 'Brazil', 'bra': 'Brazil',
        // Morocco
        'morocco': 'Morocco', 'maroc': 'Morocco', 'mar': 'Morocco',
        // Haiti
        'haiti': 'Haiti', 'haïti': 'Haiti', 'hai': 'Haiti',
        // Scotland
        'scotland': 'Scotland', 'écosse': 'Scotland', 'ecosse': 'Scotland', 'sco': 'Scotland',
        // Australia
        'australia': 'Australia', 'australie': 'Australia', 'aus': 'Australia',
        // Turkey
        'turkey': 'Turkey', 'turquie': 'Turkey', 'tur': 'Turkey',
        // Germany
        'germany': 'Germany', 'allemagne': 'Germany', 'ger': 'Germany',
        // Curaçao
        'curaçao': 'Curaçao', 'curacao': 'Curaçao', 'cuw': 'Curaçao',
        // Netherlands
        'netherlands': 'Netherlands', 'pays-bas': 'Netherlands', 'ned': 'Netherlands', 'holland': 'Netherlands',
        // Japan
        'japan': 'Japan', 'japon': 'Japan', 'jpn': 'Japan',
        // Ivory Coast
        'ivory coast': 'Ivory Coast', "cote d'ivoire": 'Ivory Coast', "côte d'ivoire": 'Ivory Coast', 'civ': 'Ivory Coast',
        // Ecuador
        'ecuador': 'Ecuador', 'équateur': 'Ecuador', 'equateur': 'Ecuador', 'ecu': 'Ecuador',
        // Sweden
        'sweden': 'Sweden', 'suède': 'Sweden', 'suede': 'Sweden', 'swe': 'Sweden',
        // Tunisia
        'tunisia': 'Tunisia', 'tunisie': 'Tunisia', 'tun': 'Tunisia',
        // Spain
        'spain': 'Spain', 'espagne': 'Spain', 'esp': 'Spain',
        // Cape Verde
        'cape verde': 'Cape Verde', 'cap vert': 'Cape Verde', 'cap-vert': 'Cape Verde', 'cpv': 'Cape Verde',
        // Belgium
        'belgium': 'Belgium', 'belgique': 'Belgium', 'bel': 'Belgium',
        // Egypt
        'egypt': 'Egypt', 'égypte': 'Egypt', 'egypte': 'Egypt', 'egy': 'Egypt',
        // Saudi Arabia
        'saudi arabia': 'Saudi Arabia', 'arabie saoudite': 'Saudi Arabia', 'ksa': 'Saudi Arabia',
        // Uruguay
        'uruguay': 'Uruguay', 'uru': 'Uruguay',
        // Iran
        'iran': 'Iran', 'irn': 'Iran',
        // New Zealand
        'new zealand': 'New Zealand', 'nouvelle-zélande': 'New Zealand', 'nouvelle zelande': 'New Zealand', 'nzl': 'New Zealand'
    };

    return aliasMap[clean] || null;
}

/**
 * Computes all tournament-wide aggregates. Caches results for performance.
 */
export async function getTournamentStats() {
    const now = Date.now();
    if (statsCache && (now - lastCacheTime < CACHE_TTL)) {
        return statsCache;
    }

    const matches = await prisma.worldCupMatch.findMany();
    const finishedMatches = matches.filter(m => m.status === 'finished');
    const liveMatches = matches.filter(m => m.status === 'live');
    const scheduledMatches = matches.filter(m => m.status === 'scheduled');

    let totalGoals = 0;
    let totalYellowCards = 0;
    let totalFouls = 0;
    const teamGoals = {};
    const teamConceded = {};
    const teamMatchesPlayed = {};
    const teamWins = {};
    const teamDraws = {};
    const teamLosses = {};
    const cleanSheets = {};
    const teamYellowCards = {};
    const teamFouls = {};
    const teamPossessionSum = {};
    const teamShotsSum = {};
    const teamCornersSum = {};

    // Initialize all teams found in matches
    const allTeams = new Set();
    matches.forEach(m => {
        if (m.homeName) allTeams.add(m.homeName);
        if (m.awayName) allTeams.add(m.awayName);
    });

    allTeams.forEach(t => {
        teamGoals[t] = 0;
        teamConceded[t] = 0;
        teamMatchesPlayed[t] = 0;
        teamWins[t] = 0;
        teamDraws[t] = 0;
        teamLosses[t] = 0;
        cleanSheets[t] = 0;
        teamYellowCards[t] = 0;
        teamFouls[t] = 0;
        teamPossessionSum[t] = 0;
        teamShotsSum[t] = 0;
        teamCornersSum[t] = 0;
    });

    finishedMatches.forEach(m => {
        const goalsHome = m.scoreHome || 0;
        const goalsAway = m.scoreAway || 0;
        totalGoals += goalsHome + goalsAway;

        // Populate team metrics
        teamGoals[m.homeName] = (teamGoals[m.homeName] || 0) + goalsHome;
        teamGoals[m.awayName] = (teamGoals[m.awayName] || 0) + goalsAway;

        teamConceded[m.homeName] = (teamConceded[m.homeName] || 0) + goalsAway;
        teamConceded[m.awayName] = (teamConceded[m.awayName] || 0) + goalsHome;

        teamMatchesPlayed[m.homeName] = (teamMatchesPlayed[m.homeName] || 0) + 1;
        teamMatchesPlayed[m.awayName] = (teamMatchesPlayed[m.awayName] || 0) + 1;

        if (goalsHome > goalsAway) {
            teamWins[m.homeName] = (teamWins[m.homeName] || 0) + 1;
            teamLosses[m.awayName] = (teamLosses[m.awayName] || 0) + 1;
        } else if (goalsHome < goalsAway) {
            teamWins[m.awayName] = (teamWins[m.awayName] || 0) + 1;
            teamLosses[m.homeName] = (teamLosses[m.homeName] || 0) + 1;
        } else {
            teamDraws[m.homeName] = (teamDraws[m.homeName] || 0) + 1;
            teamDraws[m.awayName] = (teamDraws[m.awayName] || 0) + 1;
        }

        // Clean sheets
        if (goalsAway === 0) cleanSheets[m.homeName]++;
        if (goalsHome === 0) cleanSheets[m.awayName]++;

        // Card / Foul / Possession / Shots aggregation if stats exist
        if (m.stats && typeof m.stats === 'object') {
            const st = m.stats;
            const yHome = st.yellowCards?.home || 0;
            const yAway = st.yellowCards?.away || 0;
            const fHome = st.fouls?.home || 0;
            const fAway = st.fouls?.away || 0;
            const pHome = st.possession?.home || 50;
            const pAway = st.possession?.away || 50;
            const sHome = st.shots?.home || 0;
            const sAway = st.shots?.away || 0;
            const cHome = st.corners?.home || 0;
            const cAway = st.corners?.away || 0;

            totalYellowCards += yHome + yAway;
            totalFouls += fHome + fAway;

            teamYellowCards[m.homeName] += yHome;
            teamYellowCards[m.awayName] += yAway;

            teamFouls[m.homeName] += fHome;
            teamFouls[m.awayName] += fAway;

            teamPossessionSum[m.homeName] += pHome;
            teamPossessionSum[m.awayName] += pAway;

            teamShotsSum[m.homeName] += sHome;
            teamShotsSum[m.awayName] += sAway;

            teamCornersSum[m.homeName] += cHome;
            teamCornersSum[m.awayName] += cAway;
        }
    });

    // Find top-scoring team
    let maxGoals = -1;
    let topScoringTeam = 'None';
    Object.entries(teamGoals).forEach(([team, goals]) => {
        if (goals > maxGoals) {
            maxGoals = goals;
            topScoringTeam = team;
        }
    });

    // Sort all teams by goals scored for a clean leaderboard
    const goalLeaderboard = Object.entries(teamGoals)
        .map(([name, goals]) => ({ name, goals, played: teamMatchesPlayed[name] || 0 }))
        .sort((a, b) => b.goals - a.goals || b.played - a.played);

    // Sort teams by points
    const teamPoints = {};
    allTeams.forEach(t => {
        teamPoints[t] = (teamWins[t] || 0) * 3 + (teamDraws[t] || 0) * 1;
    });
    const pointsLeaderboard = Object.entries(teamPoints)
        .map(([name, points]) => ({
            name,
            points,
            played: teamMatchesPlayed[name] || 0,
            won: teamWins[name] || 0,
            drawn: teamDraws[name] || 0,
            lost: teamLosses[name] || 0,
            goalsFor: teamGoals[name] || 0,
            goalsAgainst: teamConceded[name] || 0,
            goalDiff: (teamGoals[name] || 0) - (teamConceded[name] || 0),
            cleanSheets: cleanSheets[name] || 0
        }))
        .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);

    // Sort by defense (fewest goals conceded, most clean sheets)
    const defensiveLeaderboard = Object.entries(teamConceded)
        .map(([name, goals]) => ({
            name,
            goalsConceded: goals,
            played: teamMatchesPlayed[name] || 0,
            avgGoalsConceded: teamMatchesPlayed[name] > 0 ? (goals / teamMatchesPlayed[name]).toFixed(2) : '0.00',
            cleanSheets: cleanSheets[name] || 0
        }))
        .sort((a, b) => a.goalsConceded - b.goalsConceded || b.cleanSheets - a.cleanSheets);

    // Discipline Leaderboard (most cards)
    const disciplineLeaderboard = Object.entries(teamYellowCards)
        .map(([name, yellowCards]) => ({
            name,
            yellowCards,
            fouls: teamFouls[name] || 0,
            played: teamMatchesPlayed[name] || 0
        }))
        .sort((a, b) => b.yellowCards - a.yellowCards || b.fouls - a.fouls);

    // Team average match stats
    const teamPerformanceAverages = Object.entries(teamMatchesPlayed)
        .map(([name, played]) => ({
            name,
            played,
            avgPossession: played > 0 ? (teamPossessionSum[name] / played).toFixed(1) + '%' : '50.0%',
            avgShots: played > 0 ? (teamShotsSum[name] / played).toFixed(1) : '0.0',
            avgCorners: played > 0 ? (teamCornersSum[name] / played).toFixed(1) : '0.0'
        }))
        .sort((a, b) => parseFloat(b.avgPossession) - parseFloat(a.avgPossession));

    // Match Records list
    const matchRecordsList = finishedMatches.map(m => {
        const totalGoals = (m.scoreHome || 0) + (m.scoreAway || 0);
        const diff = Math.abs((m.scoreHome || 0) - (m.scoreAway || 0));
        let yellowCards = 0;
        let fouls = 0;
        let corners = 0;
        if (m.stats && typeof m.stats === 'object') {
            yellowCards = (m.stats.yellowCards?.home || 0) + (m.stats.yellowCards?.away || 0);
            fouls = (m.stats.fouls?.home || 0) + (m.stats.fouls?.away || 0);
            corners = (m.stats.corners?.home || 0) + (m.stats.corners?.away || 0);
        }
        return {
            id: m.id,
            home: m.homeName,
            away: m.awayName,
            scoreStr: `${m.scoreHome} - ${m.scoreAway}`,
            totalGoals,
            diff,
            yellowCards,
            fouls,
            corners,
            venue: `${m.venueName || ''} (${m.venueCity || ''})`
        };
    });

    const highestScoringMatches = [...matchRecordsList]
        .sort((a, b) => b.totalGoals - a.totalGoals)
        .slice(0, 5);

    const biggestWins = [...matchRecordsList]
        .sort((a, b) => b.diff - a.diff)
        .slice(0, 5);

    statsCache = {
        totalMatches: matches.length,
        finishedCount: finishedMatches.length,
        liveCount: liveMatches.length,
        scheduledCount: scheduledMatches.length,
        totalGoals,
        avgGoalsPerMatch: finishedMatches.length > 0 ? (totalGoals / finishedMatches.length).toFixed(2) : '0.00',
        totalYellowCards,
        totalFouls,
        topScoringTeam,
        topScoringTeamGoals: maxGoals,
        goalLeaderboard,
        pointsLeaderboard,
        defensiveLeaderboard,
        disciplineLeaderboard,
        teamPerformanceAverages,
        highestScoringMatches,
        biggestWins,
        teamGoals,
        teamConceded,
        teamMatchesPlayed,
        teamWins,
        teamDraws,
        teamLosses,
        cleanSheets
    };
    lastCacheTime = now;
    return statsCache;
}

/**
 * Retrieves pre-computed stats for a single team.
 */
export async function getTeamStats(teamName) {
    const canonical = normalizeTeamName(teamName);
    if (!canonical) return null;

    const stats = await getTournamentStats();
    
    // Find all matches involving this team
    const matches = await prisma.worldCupMatch.findMany({
        where: {
            OR: [
                { homeName: canonical },
                { awayName: canonical }
            ]
        },
        orderBy: { kickoff: 'asc' }
    });

    const matchHistory = matches.map(m => {
        const isHome = m.homeName === canonical;
        const opponent = isHome ? m.awayName : m.homeName;
        const goalsFor = isHome ? m.scoreHome : m.scoreAway;
        const goalsAgainst = isHome ? m.scoreAway : m.scoreHome;
        let outcome = 'scheduled';
        if (m.status === 'finished') {
            if (goalsFor > goalsAgainst) outcome = 'won';
            else if (goalsFor < goalsAgainst) outcome = 'lost';
            else outcome = 'drawn';
        } else if (m.status === 'live') {
            outcome = 'live';
        }

        return {
            id: m.id,
            opponent,
            isHome,
            goalsFor,
            goalsAgainst,
            status: m.status,
            scoreStr: m.status === 'finished' || m.status === 'live' ? `${m.scoreHome} - ${m.scoreAway}` : 'vs',
            round: m.round,
            outcome
        };
    });

    return {
        name: canonical,
        played: stats.teamMatchesPlayed[canonical] || 0,
        won: stats.teamWins[canonical] || 0,
        drawn: stats.teamDraws[canonical] || 0,
        lost: stats.teamLosses[canonical] || 0,
        goalsFor: stats.teamGoals[canonical] || 0,
        goalsAgainst: stats.teamConceded[canonical] || 0,
        goalDiff: (stats.teamGoals[canonical] || 0) - (stats.teamConceded[canonical] || 0),
        matchHistory
    };
}
