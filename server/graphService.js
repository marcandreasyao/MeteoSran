import { getAllMatches, getVotePercentages, getGroupStandings } from './matchService.js';
import { getTournamentStats, getTeamStats, normalizeTeamName } from './statsEngine.js';

const TEAM_ALIASES = {
    // France
    'france': 'France', 'les bleus': 'France', 'fra': 'France',
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

const MATCH_KEYWORDS = [
    'score', 'résultat', 'resultat', 'result',
    'statistique', 'statistiques', 'stats', 'stat',
    'classement', 'standing', 'standings',
    'groupe', 'group',
    'match', 'matches',
    'gagné', 'gagne', 'perdu', 'victoire', 'défaite', 'defaite',
    'nul', 'draw',
    'goal', 'goals', 'but', 'buts',
    'tir', 'tirs', 'shot', 'shots',
    'possession',
    'carton', 'yellow', 'jaune',
    'corner', 'corners',
    'prochain', 'next', 'upcoming',
    'today', "aujourd'hui", 'aujourdhui',
    'live', 'en cours',
    'terminé', 'termine', 'finished', 'fini',
    'schedulé', 'programme', 'programmé', 'scheduled',
    'somme', 'combien', 'total', 'overall', 'all teams', 'top scorer', 'ranking', 'meilleur', 'leader'
];

const GROUP_PATTERN = /\b(?:group|groupe)\s+([a-l])\b/i;

function statusLabel(status) {
    if (status === 'finished') return 'Terminé';
    if (status === 'live') return 'En cours';
    return 'Programmé';
}

function formatMatchLine(m) {
    const s = m.score || { home: 0, away: 0 };
    if (m.status === 'finished') {
        return `${m.home.name} ${s.home} - ${s.away} ${m.away.name} [ID: ${m.id}] (${statusLabel(m.status)}, ${m.venue?.name || ''}, ${m.venue?.city || ''})`;
    }
    if (m.status === 'live') {
        return `${m.home.name} ${s.home} - ${s.away} ${m.away.name} [ID: ${m.id}] (${statusLabel(m.status)}, ${m.elapsed}', ${m.venue?.name || ''}, ${m.venue?.city || ''})`;
    }
    return `${m.home.name} vs ${m.away.name} [ID: ${m.id}] (${statusLabel(m.status)}, ${m.kickoff}, ${m.venue?.name || ''}, ${m.venue?.city || ''})`;
}

function formatStats(m) {
    if (!m.stats) return '';
    const st = m.stats;
    const lines = [
        `Possession: ${m.home.name} ${st.possession?.home || 50}% - ${m.away.name} ${st.possession?.away || 50}%`,
        `Tirs / Shots: ${st.shots?.home || 0} - ${st.shots?.away || 0}`,
        `Tirs cadrés / Shots on target: ${st.shotsOnTarget?.home || 0} - ${st.shotsOnTarget?.away || 0}`,
        `Fautes / Fouls: ${st.fouls?.home || 0} - ${st.fouls?.away || 0}`,
        `Cartons jaunes / Yellow cards: ${st.yellowCards?.home || 0} - ${st.yellowCards?.away || 0}`,
        `Corners: ${st.corners?.home || 0} - ${st.corners?.away || 0}`
    ];
    return lines.join('\n');
}

function formatStandingsTable(groupName, standings) {
    if (!standings || standings.length === 0) return '';
    let table = `Classement ${groupName}:\n`;
    table += 'Pos | Equipe | J | V | N | D | BP | BC | Diff | Pts\n';
    standings.forEach((t, i) => {
        table += `${i + 1}. | ${t.team} | ${t.played} | ${t.won} | ${t.drawn} | ${t.lost} | ${t.goalsFor} | ${t.goalsAgainst} | ${t.goalDifference} | ${t.points}\n`;
    });
    return table;
}

function matchInvolvesTeam(match, teamName) {
    return match.home.name === teamName || match.away.name === teamName;
}

export async function retrieveGraphContext(queryText) {
    if (!queryText) return '';

    const queryLower = queryText.toLowerCase();
    const allMatches = await getAllMatches();

    // Extract mentioned teams with clean word boundary matching
    const mentionedTeams = new Set();
    for (const [alias, canonical] of Object.entries(TEAM_ALIASES)) {
        const escaped = alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(?:^|[^a-zA-Z0-9àâäéèêëîïôöùûüç])${escaped}(?:$|[^a-zA-Z0-9àâäéèêëîïôöùûüç])`, 'i');
        if (regex.test(queryLower)) {
            mentionedTeams.add(canonical);
        }
    }

    // Extract mentioned groups
    const mentionedGroups = new Set();
    const groupMatch = queryLower.match(GROUP_PATTERN);
    if (groupMatch) {
        mentionedGroups.add(`Group ${groupMatch[1].toUpperCase()}`);
    }
    // Also detect bare group names mentioned in text
    const allGroups = [...new Set(allMatches.map(m => m.group))];
    for (const g of allGroups) {
        if (queryLower.includes(g.toLowerCase())) {
            mentionedGroups.add(g);
        }
    }

    // Detect keyword intents
    const wantsScore = ['score', 'résultat', 'resultat', 'result', 'gagné', 'gagne', 'perdu', 'victoire', 'défaite', 'defaite', 'nul', 'draw', 'goal', 'but'].some(k => queryLower.includes(k));
    const wantsStats = ['statistique', 'statistiques', 'stats', 'stat', 'possession', 'tir', 'tirs', 'shot', 'shots', 'carton', 'corner', 'corners', 'yellow', 'jaune', 'faute', 'foul'].some(k => queryLower.includes(k));
    const wantsStandings = ['classement', 'standing', 'standings', 'tableau', 'groupes', 'groups'].some(k => queryLower.includes(k));
    const wantsLive = ['live', 'en cours', 'direct'].some(k => queryLower.includes(k));
    const wantsNext = ['prochain', 'next', 'upcoming', 'programme', 'programmé', 'scheduled'].some(k => queryLower.includes(k));
    const wantsToday = ['today', "aujourd'hui", 'aujourdhui'].some(k => queryLower.includes(k));
    const wantsTotals = ['somme', 'combien', 'total', 'overall', 'all teams', 'top scorer', 'ranking', 'meilleur', 'leader', 'buts', 'goals'].some(k => queryLower.includes(k));

    const contextParts = [];

    // Inject aggregate tournament facts if requested
    if (wantsTotals || (queryLower.includes('goal') || queryLower.includes('but')) && mentionedTeams.size === 0) {
        try {
            const stats = await getTournamentStats();
            contextParts.push(`\n[COMPUTED TOURNAMENT STATISTICS — VERIFIED SERVER-SIDE, DO NOT RECALCULATE]`);
            contextParts.push(`Total matches scheduled/played: ${stats.totalMatches}`);
            contextParts.push(`Matches completed: ${stats.finishedCount}`);
            contextParts.push(`Total goals scored: ${stats.totalGoals}`);
            contextParts.push(`Average goals per match: ${stats.avgGoalsPerMatch}`);
            contextParts.push(`Top scoring team: ${stats.topScoringTeam} with ${stats.topScoringTeamGoals} goals`);
            contextParts.push(`Total yellow cards: ${stats.totalYellowCards}`);
            contextParts.push(`Total fouls committed: ${stats.totalFouls}`);
            
            // Goals leaderboard top 5
            contextParts.push(`\nGoal Scoring Leaderboard (Top 5):`);
            stats.goalLeaderboard.slice(0, 5).forEach((t, idx) => {
                contextParts.push(`${idx + 1}. ${t.name}: ${t.goals} goals (played ${t.played})`);
            });

            // Defensive Leaderboard (fewest goals conceded, top 5)
            contextParts.push(`\nBest Defenses (Fewest goals conceded, Top 5):`);
            stats.defensiveLeaderboard.slice(0, 5).forEach((t, idx) => {
                contextParts.push(`${idx + 1}. ${t.name}: Conceded ${t.goalsConceded} goals (avg ${t.avgGoalsConceded}/match, clean sheets: ${t.cleanSheets})`);
            });

            // Discipline Leaderboard (Top 3 yellow cards)
            contextParts.push(`\nMost Yellow Cards (Top 3):`);
            stats.disciplineLeaderboard.slice(0, 3).forEach((t, idx) => {
                contextParts.push(`${idx + 1}. ${t.name}: ${t.yellowCards} yellow cards, ${t.fouls} fouls`);
            });

            // Possession Averages (Top 3)
            contextParts.push(`\nBest Possession Averages (Top 3):`);
            stats.teamPerformanceAverages.slice(0, 3).forEach((t, idx) => {
                contextParts.push(`${idx + 1}. ${t.name}: ${t.avgPossession} average possession (avg corners: ${t.avgCorners})`);
            });

            // Highest Scoring Matches (Top 3)
            contextParts.push(`\nHighest Scoring Matches (Top 3):`);
            stats.highestScoringMatches.slice(0, 3).forEach((m, idx) => {
                contextParts.push(`${idx + 1}. ${m.home} ${m.scoreStr} ${m.away} (${m.totalGoals} goals) - Round: ${m.round} - Venue: ${m.venue}`);
            });

            // Biggest wins (Top 3)
            contextParts.push(`\nBiggest Win Margins (Top 3):`);
            stats.biggestWins.slice(0, 3).forEach((m, idx) => {
                contextParts.push(`${idx + 1}. ${m.home} ${m.scoreStr} ${m.away} (+${m.diff} diff) - Round: ${m.round}`);
            });

        } catch (err) {
            console.error('[GraphRAG] Failed to retrieve tournament stats:', err);
        }
    }

    // If specific teams are mentioned, provide their match data AND team-level computed stats
    if (mentionedTeams.size > 0) {
        for (const teamName of mentionedTeams) {
            try {
                const teamStats = await getTeamStats(teamName);
                if (teamStats) {
                    contextParts.push(`\n[COMPUTED TEAM STATISTICS — ${teamStats.name.toUpperCase()} — VERIFIED SERVER-SIDE, DO NOT RECALCULATE]`);
                    contextParts.push(`Matches played: ${teamStats.played} | Won: ${teamStats.won} | Drawn: ${teamStats.drawn} | Lost: ${teamStats.lost}`);
                    contextParts.push(`Goals scored (BP): ${teamStats.goalsFor} | Goals conceded (BC): ${teamStats.goalsAgainst} | Goal difference: ${teamStats.goalDiff}`);
                    
                    contextParts.push(`\nMatch history details for ${teamStats.name}:`);
                    teamStats.matchHistory.forEach((m, idx) => {
                        const scorePart = m.status === 'finished' || m.status === 'live' ? `(${m.scoreStr})` : '(vs)';
                        contextParts.push(`${idx + 1}. ${m.round}: ${teamStats.name} ${scorePart} ${m.opponent} - Result: ${m.outcome.toUpperCase()}`);
                    });
                }
            } catch (err) {
                console.error(`[GraphRAG] Failed to retrieve team stats for ${teamName}:`, err);
            }

            // Also format raw match entries for context fallback/weather rendering if requested
            const teamMatches = allMatches.filter(m => matchInvolvesTeam(m, teamName));
            for (const m of teamMatches) {
                contextParts.push(formatMatchLine(m));
                if ((wantsStats || mentionedTeams.size <= 2) && (m.status === 'finished' || m.status === 'live')) {
                    contextParts.push(formatStats(m));
                }
                const votes = getVotePercentages(m);
                contextParts.push(`Pronostics: Domicile ${votes.home}% - Nul ${votes.draw}% - Extérieur ${votes.away}% (${votes.total} votes)`);
            }
        }
    }

    // Live matches
    if (wantsLive || (mentionedTeams.size === 0 && !wantsNext && !wantsStandings && !wantsTotals)) {
        const liveMatches = allMatches.filter(m => m.status === 'live');
        if (liveMatches.length > 0) {
            contextParts.push('--- MATCHS EN DIRECT / LIVE MATCHES ---');
            for (const m of liveMatches) {
                contextParts.push(formatMatchLine(m));
                contextParts.push(formatStats(m));
            }
        }
    }

    // Scores / Results
    if (wantsScore && mentionedTeams.size === 0 && !wantsTotals) {
        const finishedMatches = allMatches.filter(m => m.status === 'finished');
        if (finishedMatches.length > 0) {
            contextParts.push('--- RESULTATS / RESULTS ---');
            for (const m of finishedMatches) {
                contextParts.push(formatMatchLine(m));
            }
        }
    }

    // Upcoming / scheduled
    if (wantsNext || wantsToday) {
        const scheduled = allMatches.filter(m => m.status === 'scheduled');
        if (scheduled.length > 0) {
            contextParts.push('--- PROCHAINS MATCHS / UPCOMING MATCHES ---');
            for (const m of scheduled) {
                contextParts.push(formatMatchLine(m));
            }
        }
    }

    // Group standings
    if (wantsStandings || mentionedGroups.size > 0) {
        const groupsToShow = mentionedGroups.size > 0 ? mentionedGroups : new Set(allGroups);
        for (const g of groupsToShow) {
            const standings = await getGroupStandings(g);
            if (standings.length > 0) {
                contextParts.push(formatStandingsTable(g, standings));
            }
        }
    }

    // Fallback: if no specific context was generated but query has match keywords, provide everything
    if (contextParts.length === 0) {
        const hasKeyword = MATCH_KEYWORDS.some(k => queryLower.includes(k));
        if (hasKeyword) {
            contextParts.push('--- TOUS LES MATCHS / ALL MATCHES ---');
            for (const m of allMatches) {
                contextParts.push(formatMatchLine(m));
            }
        }
    }

    return contextParts.join('\n');
}

