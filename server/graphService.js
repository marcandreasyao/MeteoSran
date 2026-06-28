import { getAllMatches, getVotePercentages, getGroupStandings } from './matchService.js';

const TEAM_ALIASES = {
    'france':       'France',
    'les bleus':    'France',
    'fra':          'France',
    'argentina':    'Argentina',
    'argentine':    'Argentina',
    'albiceleste':  'Argentina',
    'arg':          'Argentina',
    'algeria':      'Algeria',
    'algérie':      'Algeria',
    'algerie':      'Algeria',
    'alg':          'Algeria',
    'dz':           'Algeria',
    'senegal':      'Senegal',
    'sénégal':      'Senegal',
    'sen':          'Senegal',
    'usa':          'USA',
    'united states':'USA',
    'états-unis':   'USA',
    'etats-unis':   'USA',
    'iraq':         'Iraq',
    'irak':         'Iraq',
    'norway':       'Norway',
    'norvège':      'Norway',
    'norvege':      'Norway',
    'austria':      'Austria',
    'autriche':     'Austria',
    'jordan':       'Jordan',
    'jordanie':     'Jordan',
    'portugal':     'Portugal',
    'por':          'Portugal',
    'dr congo':     'DR Congo',
    'rd congo':     'DR Congo',
    'congo':        'DR Congo',
    'england':      'England',
    'angleterre':   'England',
    'eng':          'England',
    'croatia':      'Croatia',
    'croatie':      'Croatia',
    'ghana':        'Ghana',
    'gha':          'Ghana',
    'panama':       'Panama',
    'pan':          'Panama',
    'uzbekistan':   'Uzbekistan',
    'ouzbekistan':  'Uzbekistan',
    'uzb':          'Uzbekistan',
    'colombia':     'Colombia',
    'colombie':     'Colombia',
    'col':          'Colombia'
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
    'schedulé', 'programme', 'programmé', 'scheduled'
];

const GROUP_PATTERN = /(?:group|groupe)\s*([a-z])/i;

function statusLabel(status) {
    if (status === 'finished') return 'Terminé';
    if (status === 'live') return 'En cours';
    return 'Programmé';
}

function formatMatchLine(m) {
    const s = m.score || { home: 0, away: 0 };
    if (m.status === 'finished') {
        return `${m.home.name} ${s.home} - ${s.away} ${m.away.name} [ID: ${m.id}] (${statusLabel(m.status)}, ${m.venue.name}, ${m.venue.city})`;
    }
    if (m.status === 'live') {
        return `${m.home.name} ${s.home} - ${s.away} ${m.away.name} [ID: ${m.id}] (${statusLabel(m.status)}, ${m.elapsed}', ${m.venue.name}, ${m.venue.city})`;
    }
    return `${m.home.name} vs ${m.away.name} [ID: ${m.id}] (${statusLabel(m.status)}, ${m.kickoff}, ${m.venue.name}, ${m.venue.city})`;
}

function formatStats(m) {
    if (!m.stats) return '';
    const st = m.stats;
    const lines = [
        `Possession: ${m.home.name} ${st.possession.home}% - ${m.away.name} ${st.possession.away}%`,
        `Tirs / Shots: ${st.shots.home} - ${st.shots.away}`,
        `Tirs cadrés / Shots on target: ${st.shotsOnTarget.home} - ${st.shotsOnTarget.away}`,
        `Fautes / Fouls: ${st.fouls.home} - ${st.fouls.away}`,
        `Cartons jaunes / Yellow cards: ${st.yellowCards.home} - ${st.yellowCards.away}`,
        `Corners: ${st.corners.home} - ${st.corners.away}`
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

    // Extract mentioned teams
    const mentionedTeams = new Set();
    for (const [alias, canonical] of Object.entries(TEAM_ALIASES)) {
        if (queryLower.includes(alias)) {
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
    const wantsStandings = ['classement', 'standing', 'standings', 'tableau'].some(k => queryLower.includes(k));
    const wantsLive = ['live', 'en cours', 'direct'].some(k => queryLower.includes(k));
    const wantsNext = ['prochain', 'next', 'upcoming', 'programme', 'programmé', 'scheduled'].some(k => queryLower.includes(k));
    const wantsToday = ['today', "aujourd'hui", 'aujourdhui'].some(k => queryLower.includes(k));

    const contextParts = [];

    // If specific teams are mentioned, provide their match data
    if (mentionedTeams.size > 0) {
        for (const teamName of mentionedTeams) {
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
    if (wantsLive || (mentionedTeams.size === 0 && !wantsNext && !wantsStandings)) {
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
    if (wantsScore && mentionedTeams.size === 0) {
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
