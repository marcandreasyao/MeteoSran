import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'matches_state.json');

const ZEROED_STATS = {
    possession: { home: 50, away: 50 },
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
    yellowCards: { home: 0, away: 0 },
    corners: { home: 0, away: 0 }
};

// Preloaded matches reflecting the user's screenshots exactly
// Current time in system: 2026-06-16
const DEFAULT_MATCHES = [
    {
        id: "fra_sen_2026",
        group: "Group I",
        round: "Round 1",
        home: { name: "France", flag: "🇫🇷", code: "FR" },
        away: { name: "Senegal", flag: "🇸🇳", code: "SN" },
        kickoff: "2026-06-16T19:00:00Z",
        venue: { name: "MetLife Stadium", city: "East Rutherford" },
        votes: { home: 42000, draw: 12000, away: 8000 },
        status: "finished",
        score: { home: 3, away: 1 },
        elapsed: 90,
        stats: {
            possession: { home: 58, away: 42 },
            shots: { home: 16, away: 11 },
            shotsOnTarget: { home: 8, away: 4 },
            fouls: { home: 12, away: 15 },
            yellowCards: { home: 2, away: 3 },
            corners: { home: 6, away: 4 }
        }
    },
    {
        id: "irq_nor_2026",
        group: "Group I",
        round: "Round 1",
        home: { name: "Iraq", flag: "🇮🇶", code: "IQ" },
        away: { name: "Norway", flag: "🇳🇴", code: "NO" },
        kickoff: "2026-06-16T22:00:00Z",
        venue: { name: "Gillette Stadium", city: "Foxborough" },
        votes: { home: 15000, draw: 22000, away: 35000 },
        status: "finished",
        score: { home: 1, away: 4 },
        elapsed: 90,
        stats: {
            possession: { home: 38, away: 62 },
            shots: { home: 8, away: 19 },
            shotsOnTarget: { home: 3, away: 9 },
            fouls: { home: 14, away: 10 },
            yellowCards: { home: 2, away: 1 },
            corners: { home: 3, away: 8 }
        }
    },
    {
        id: "arg_alg_2026",
        group: "Group J",
        round: "Round 1",
        home: { name: "Argentina", flag: "🇦🇷", code: "AR" },
        away: { name: "Algeria", flag: "🇩🇿", code: "DZ" },
        kickoff: "2026-06-17T01:00:00Z",
        venue: { name: "Arrowhead Stadium", city: "Kansas City" },
        votes: { home: 115200, draw: 11520, away: 17280 },
        status: "finished",
        score: { home: 3, away: 0 },
        elapsed: 90,
        stats: {
            possession: { home: 65, away: 35 },
            shots: { home: 17, away: 6 },
            shotsOnTarget: { home: 9, away: 2 },
            fouls: { home: 9, away: 14 },
            yellowCards: { home: 1, away: 3 },
            corners: { home: 7, away: 2 }
        }
    },
    {
        id: "aut_jor_2026",
        group: "Group J",
        round: "Round 1",
        home: { name: "Austria", flag: "🇦🇹", code: "AT" },
        away: { name: "Jordan", flag: "🇯🇴", code: "JO" },
        kickoff: "2026-06-17T04:00:00Z",
        venue: { name: "Levi's Stadium", city: "Santa Clara" },
        votes: { home: 25000, draw: 15000, away: 8000 },
        status: "finished",
        score: { home: 0, away: 0 },
        elapsed: 90,
        stats: {
            possession: { home: 53, away: 47 },
            shots: { home: 11, away: 9 },
            shotsOnTarget: { home: 4, away: 3 },
            fouls: { home: 13, away: 12 },
            yellowCards: { home: 2, away: 2 },
            corners: { home: 5, away: 4 }
        }
    },
    {
        id: "por_cod_2026",
        group: "Group K",
        round: "Round 1",
        home: { name: "Portugal", flag: "🇵🇹", code: "PT" },
        away: { name: "DR Congo", flag: "🇨🇩", code: "CD" },
        kickoff: "2026-06-17T17:00:00Z",
        venue: { name: "NRG Stadium", city: "Houston" },
        votes: { home: 85000, draw: 14000, away: 21000 },
        status: "scheduled",
        score: { home: 0, away: 0 },
        elapsed: null,
        stats: { ...ZEROED_STATS }
    },
    {
        id: "eng_cro_2026",
        group: "Group L",
        round: "Round 1",
        home: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "GB-ENG" },
        away: { name: "Croatia", flag: "🇭🇷", code: "HR" },
        kickoff: "2026-06-17T20:00:00Z",
        venue: { name: "AT&T Stadium", city: "Arlington" },
        votes: { home: 64000, draw: 32000, away: 24000 },
        status: "scheduled",
        score: { home: 0, away: 0 },
        elapsed: null,
        stats: { ...ZEROED_STATS }
    },
    {
        id: "gha_pan_2026",
        group: "Group L",
        round: "Round 1",
        home: { name: "Ghana", flag: "🇬🇭", code: "GH" },
        away: { name: "Panama", flag: "🇵🇦", code: "PA" },
        kickoff: "2026-06-17T23:00:00Z",
        venue: { name: "BMO Field", city: "Toronto" },
        votes: { home: 45000, draw: 15000, away: 12000 },
        status: "scheduled",
        score: { home: 0, away: 0 },
        elapsed: null,
        stats: { ...ZEROED_STATS }
    },
    {
        id: "uzb_col_2026",
        group: "Group K",
        round: "Round 1",
        home: { name: "Uzbekistan", flag: "🇺🇿", code: "UZ" },
        away: { name: "Colombia", flag: "🇨🇴", code: "CO" },
        kickoff: "2026-06-18T02:00:00Z",
        venue: { name: "Estadio Azteca", city: "Mexico City" },
        votes: { home: 18000, draw: 25000, away: 52000 },
        status: "scheduled",
        score: { home: 0, away: 0 },
        elapsed: null,
        stats: { ...ZEROED_STATS }
    }
];

let matches = [...DEFAULT_MATCHES];

// Tracks the last time we successfully called the external API (ms epoch)
let lastApiSyncMs = 0;
// Minimum gap between two API calls (2 minutes)
const API_SYNC_MIN_INTERVAL_MS = 2 * 60 * 1000;

// Football-Data.org API key (populated from .env at runtime)
const FOOTBALL_DATA_TOKEN = process.env.FOOTBALL_DATA_TOKEN || '';

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

// ─────────────────────────────────────────────────────────────────────────────
// Layer 1 — Time-based auto-correction (zero API calls, always runs)
// ─────────────────────────────────────────────────────────────────────────────
function autoCorrectStatuses() {
    const now = Date.now();
    let changed = false;

    for (const m of matches) {
        const kickoffMs = new Date(m.kickoff).getTime();
        const elapsedSinceKickoffMs = now - kickoffMs;

        if (m.status === 'scheduled' && elapsedSinceKickoffMs >= 0) {
            // Kickoff time has passed — mark as live
            m.status = 'live';
            m.elapsed = Math.min(90, Math.floor(elapsedSinceKickoffMs / 60000));
            changed = true;
            console.log(`[MatchSync] Auto-started: ${m.home.name} vs ${m.away.name} (${m.elapsed}')`);
        } else if (m.status === 'live' && elapsedSinceKickoffMs >= 120 * 60 * 1000) {
            // More than 120 minutes after kickoff — safe to mark as finished
            m.status = 'finished';
            m.elapsed = 90;
            changed = true;
            console.log(`[MatchSync] Auto-finished (120min safety): ${m.home.name} vs ${m.away.name}`);
        } else if (m.status === 'live') {
            // Update elapsed for live matches
            m.elapsed = Math.min(90, Math.floor(elapsedSinceKickoffMs / 60000));
        }
    }

    if (changed) saveState();
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 2 — Football-Data.org API sync (only during active match windows)
// ─────────────────────────────────────────────────────────────────────────────
async function syncFromAPI() {
    if (!FOOTBALL_DATA_TOKEN) {
        console.warn('[MatchSync] No FOOTBALL_DATA_TOKEN set — skipping API sync.');
        return;
    }

    const now = Date.now();
    if (now - lastApiSyncMs < API_SYNC_MIN_INTERVAL_MS) {
        // Throttle: don't call more than once every 2 minutes
        return;
    }

    try {
        const url = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026&status=IN_PLAY,PAUSED,FINISHED';
        const res = await fetch(url, {
            headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN },
            signal: AbortSignal.timeout(8000) // 8s timeout
        });

        if (!res.ok) {
            console.warn(`[MatchSync] Football-Data.org returned ${res.status} — skipping sync.`);
            return;
        }

        const json = await res.json();
        lastApiSyncMs = now;

        const apiMatches = json.matches || [];
        let syncCount = 0;

        for (const apiMatch of apiMatches) {
            // Match our local match by home+away team name (partial, case-insensitive)
            const homeNameApi = (apiMatch.homeTeam?.shortName || apiMatch.homeTeam?.name || '').toLowerCase();
            const awayNameApi = (apiMatch.awayTeam?.shortName || apiMatch.awayTeam?.name || '').toLowerCase();

            const local = matches.find(m => {
                const h = m.home.name.toLowerCase();
                const a = m.away.name.toLowerCase();
                // Accept if either the full name or the code matches
                return (homeNameApi.includes(h) || h.includes(homeNameApi) || m.home.code.toLowerCase() === (apiMatch.homeTeam?.tla || '').toLowerCase())
                    && (awayNameApi.includes(a) || a.includes(awayNameApi) || m.away.code.toLowerCase() === (apiMatch.awayTeam?.tla || '').toLowerCase());
            });

            if (!local) continue;

            const newStatus = FD_STATUS_MAP[apiMatch.status] || local.status;
            const fullTime = apiMatch.score?.fullTime;
            const regularTime = apiMatch.score?.regularTime;
            const scoreData = fullTime || regularTime;

            if (newStatus !== local.status) {
                console.log(`[MatchSync] ${local.home.name} vs ${local.away.name}: ${local.status} -> ${newStatus}`);
                local.status = newStatus;
            }

            if (scoreData && scoreData.home != null && scoreData.away != null) {
                local.score = { home: scoreData.home, away: scoreData.away };
            }

            if (apiMatch.minute != null) {
                local.elapsed = apiMatch.minute;
            } else if (newStatus === 'finished') {
                local.elapsed = 90;
            }

            syncCount++;
        }

        if (syncCount > 0) {
            saveState();
            console.log(`[MatchSync] Synced ${syncCount} match(es) from Football-Data.org.`);
        } else {
            console.log('[MatchSync] API sync: no relevant matches found in response.');
        }

    } catch (err) {
        console.warn('[MatchSync] API sync failed (will retry next cycle):', err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart poller — runs every 60s, only calls the API when needed
// ─────────────────────────────────────────────────────────────────────────────
export function startSmartPoller() {
    console.log('[MatchSync] Smart match poller started (60s tick).');

    setInterval(async () => {
        // Layer 1 always runs (zero cost)
        autoCorrectStatuses();

        const now = Date.now();

        // Check if any match is currently live
        const hasLive = matches.some(m => m.status === 'live');

        // Check if any match finished within the last 30 minutes
        const hasRecentlyFinished = matches.some(m => {
            if (m.status !== 'finished') return false;
            const kickoffMs = new Date(m.kickoff).getTime();
            const finishMs = kickoffMs + 105 * 60 * 1000; // ~105 min after kickoff
            return (now - finishMs) < 30 * 60 * 1000;
        });

        if (hasLive || hasRecentlyFinished) {
            await syncFromAPI();
        }
        // Otherwise: completely silent — no API calls, no logs
    }, 60 * 1000); // every 60 seconds
}

function loadState() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (fs.existsSync(STATE_FILE)) {
            const raw = fs.readFileSync(STATE_FILE, 'utf8');
            matches = JSON.parse(raw);
            console.log("[MeteoSran Matches] Loaded match state successfully.");
        } else {
            saveState();
        }
    } catch (err) {
        console.error("[MeteoSran Matches] Error loading match state:", err);
    }
}

function saveState() {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(matches, null, 2), 'utf8');
    } catch (err) {
        console.error("[MeteoSran Matches] Error saving match state:", err);
    }
}

export function getAllMatches() {
    loadState();
    autoCorrectStatuses();
    return matches;
}

export function getMatchById(id) {
    loadState();
    autoCorrectStatuses();
    return matches.find(m => m.id === id) || null;
}

export function recordVote(id, teamChoice) {
    loadState();
    const match = matches.find(m => m.id === id);
    if (!match) return null;

    if (teamChoice === 'home') match.votes.home += 1;
    else if (teamChoice === 'draw') match.votes.draw += 1;
    else if (teamChoice === 'away') match.votes.away += 1;

    saveState();
    return match;
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

export function getGroupStandings(groupName) {
    loadState();
    const groupMatches = matches.filter(
        m => m.group.toLowerCase() === groupName.toLowerCase() &&
             (m.status === 'finished' || m.status === 'live')
    );

    const teams = {};

    function ensureTeam(name) {
        if (!teams[name]) {
            teams[name] = {
                team: name,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0
            };
        }
    }

    for (const m of groupMatches) {
        const homeName = m.home.name;
        const awayName = m.away.name;
        ensureTeam(homeName);
        ensureTeam(awayName);

        teams[homeName].played += 1;
        teams[awayName].played += 1;
        teams[homeName].goalsFor += m.score.home;
        teams[homeName].goalsAgainst += m.score.away;
        teams[awayName].goalsFor += m.score.away;
        teams[awayName].goalsAgainst += m.score.home;

        if (m.score.home > m.score.away) {
            teams[homeName].won += 1;
            teams[homeName].points += 3;
            teams[awayName].lost += 1;
        } else if (m.score.home < m.score.away) {
            teams[awayName].won += 1;
            teams[awayName].points += 3;
            teams[homeName].lost += 1;
        } else {
            teams[homeName].drawn += 1;
            teams[awayName].drawn += 1;
            teams[homeName].points += 1;
            teams[awayName].points += 1;
        }
    }

    for (const t of Object.values(teams)) {
        t.goalDifference = t.goalsFor - t.goalsAgainst;
    }

    // Also include teams from scheduled matches in the group that have not yet played
    const allGroupMatches = matches.filter(
        m => m.group.toLowerCase() === groupName.toLowerCase()
    );
    for (const m of allGroupMatches) {
        ensureTeam(m.home.name);
        ensureTeam(m.away.name);
    }

    return Object.values(teams).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.goalDifference - a.goalDifference;
    });
}
