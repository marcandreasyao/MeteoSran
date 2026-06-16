import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'matches_state.json');

// Preloaded matches reflecting the user's screenshots exactly
// Current time in system: 2026-06-16
const DEFAULT_MATCHES = [
    {
        id: "fra_sen_2026",
        group: "Group A",
        round: "Round 1",
        home: { name: "France", flag: "🇫🇷", code: "FR" },
        away: { name: "Senegal", flag: "🇸🇳", code: "SN" },
        kickoff: "2026-06-16T19:00:00Z",
        venue: { name: "MetLife Stadium", city: "East Rutherford" },
        votes: { home: 42000, draw: 12000, away: 8000 }
    },
    {
        id: "irq_nor_2026",
        group: "Group A",
        round: "Round 1",
        home: { name: "Iraq", flag: "🇮🇶", code: "IQ" },
        away: { name: "Norway", flag: "🇳🇴", code: "NO" },
        kickoff: "2026-06-16T22:00:00Z",
        venue: { name: "Lumen Field", city: "Seattle" },
        votes: { home: 15000, draw: 22000, away: 35000 }
    },
    {
        id: "arg_alg_2026",
        group: "Group J",
        round: "Round 1",
        home: { name: "Argentina", flag: "🇦🇷", code: "AR" },
        away: { name: "Algeria", flag: "🇩🇿", code: "DZ" },
        kickoff: "2026-06-17T01:00:00Z",
        venue: { name: "Estadio Azteca", city: "Mexico City" },
        votes: { home: 115200, draw: 11520, away: 17280 } // Matches the 80% / 8% / 12% split
    },
    {
        id: "aut_jor_2026",
        group: "Group J",
        round: "Round 1",
        home: { name: "Austria", flag: "🇦🇹", code: "AT" },
        away: { name: "Jordan", flag: "🇯🇴", code: "JO" },
        kickoff: "2026-06-17T04:00:00Z",
        venue: { name: "BC Place", city: "Vancouver" },
        votes: { home: 25000, draw: 15000, away: 8000 }
    },
    {
        id: "por_cod_2026",
        group: "Group C",
        round: "Round 1",
        home: { name: "Portugal", flag: "🇵🇹", code: "PT" },
        away: { name: "DR Congo", flag: "🇨🇩", code: "CD" },
        kickoff: "2026-06-17T17:00:00Z",
        venue: { name: "NRG Stadium", city: "Houston" },
        votes: { home: 85000, draw: 14000, away: 21000 }
    },
    {
        id: "eng_cro_2026",
        group: "Group D",
        round: "Round 1",
        home: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "GB-ENG" },
        away: { name: "Croatia", flag: "🇭🇷", code: "HR" },
        kickoff: "2026-06-17T20:00:00Z",
        venue: { name: "Hard Rock Stadium", city: "Miami" },
        votes: { home: 64000, draw: 32000, away: 24000 }
    },
    {
        id: "gha_pan_2026",
        group: "Group E",
        round: "Round 1",
        home: { name: "Ghana", flag: "🇬🇭", code: "GH" },
        away: { name: "Panama", flag: "🇵🇦", code: "PA" },
        kickoff: "2026-06-17T23:00:00Z",
        venue: { name: "Mercedes-Benz Stadium", city: "Atlanta" },
        votes: { home: 45000, draw: 15000, away: 12000 }
    }
];

let matches = [...DEFAULT_MATCHES];

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
    return matches;
}

export function getMatchById(id) {
    loadState();
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
