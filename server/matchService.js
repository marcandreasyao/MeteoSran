import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Football-Data.org API key (dynamically evaluated to avoid ESM import order bugs)
const getFootballDataToken = () => process.env.FOOTBALL_DATA_TOKEN || '';

// Tracks the last time we successfully called the external API (ms epoch)
let lastApiSyncMs = 0;
const API_SYNC_MIN_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
let isSyncing = false;

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

const STADIUMS = [
    { name: "BC Place", city: "Vancouver" },
    { name: "Lumen Field", city: "Seattle" },
    { name: "Levi's Stadium", city: "Santa Clara" },
    { name: "SoFi Stadium", city: "Inglewood" },
    { name: "Estadio Akron", city: "Guadalajara" },
    { name: "Estadio Azteca", city: "Mexico City" },
    { name: "Estadio BBVA", city: "Monterrey" },
    { name: "NRG Stadium", city: "Houston" },
    { name: "AT&T Stadium", city: "Arlington" },
    { name: "Arrowhead Stadium", city: "Kansas City" },
    { name: "Mercedes-Benz Stadium", city: "Atlanta" },
    { name: "Hard Rock Stadium", city: "Miami" },
    { name: "Gillette Stadium", city: "Foxborough" },
    { name: "MetLife Stadium", city: "East Rutherford" },
    { name: "Lincoln Financial Field", city: "Philadelphia" },
    { name: "BMO Field", city: "Toronto" }
];

function getDeterministicVenue(matchId) {
    let sum = 0;
    for (let i = 0; i < matchId.length; i++) {
        sum += matchId.charCodeAt(i);
    }
    return STADIUMS[sum % STADIUMS.length];
}

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
// World Cup squads for key teams to enable premium player timeline stats
// ─────────────────────────────────────────────────────────────────────────────
const TEAM_SQUADS = {
    FR: {
        forwards: ["K. Mbappé", "O. Dembélé", "M. Thuram", "R. Kolo Muani", "O. Giroud", "K. Coman"],
        midfielders: ["A. Griezmann", "A. Rabiot", "A. Tchouaméni", "E. Camavinga", "W. Zaïre-Emery", "Y. Fofana"],
        defenders: ["T. Hernandez", "W. Saliba", "D. Upamecano", "J. Koundé", "B. Pavard", "J. Clauss"],
        goalkeeper: ["M. Maignan"]
    },
    SN: {
        forwards: ["S. Mané", "N. Jackson", "I. Sarr", "B. Dia", "H. Diallo"],
        midfielders: ["I. Gueye", "P. Sarr", "L. Camara", "P. Gueye", "N. Mendy"],
        defenders: ["K. Koulibaly", "A. Diallo", "M. Niakhaté", "I. Jakobs", "Y. Sabaly"],
        goalkeeper: ["E. Mendy"]
    },
    AR: {
        forwards: ["L. Messi", "L. Martínez", "J. Álvarez", "A. Di María", "A. Correa"],
        midfielders: ["E. Fernández", "A. Mac Allister", "R. De Paul", "L. Paredes", "G. Lo Celso"],
        defenders: ["N. Otamendi", "C. Romero", "N. Tagliafico", "N. Molina", "G. Montiel"],
        goalkeeper: ["E. Martínez"]
    },
    DZ: {
        forwards: ["R. Mahrez", "B. Bounedjah", "I. Slimani", "A. Gouiri", "M. Amoura"],
        midfielders: ["I. Bennacer", "H. Aouar", "N. Bentaleb", "F. Chaïbi", "S. Feghouli"],
        defenders: ["R. Bensebaini", "A. Mandi", "Y. Atal", "R. Aït-Nouri", "A. Touba"],
        goalkeeper: ["A. Mandrea"]
    },
    PT: {
        forwards: ["C. Ronaldo", "J. Félix", "R. Leão", "G. Ramos", "D. Jota"],
        midfielders: ["B. Fernandes", "B. Silva", "Vitinha", "R. Neves", "J. Palhinha"],
        defenders: ["R. Dias", "J. Cancelo", "D. Dalot", "N. Mendes", "A. Silva"],
        goalkeeper: ["D. Costa"]
    },
    NO: {
        forwards: ["E. Haaland", "A. Sørloth", "J. Strand Larsen"],
        midfielders: ["M. Ødegaard", "S. Berge", "P. Nusa", "O. Bobb", "M. Elyounoussi"],
        defenders: ["J. Ryerson", "L. Østigård", "K. Ajer", "F. Bjørkan"],
        goalkeeper: ["Ø. Nyland"]
    },
    EG: {
        forwards: ["M. Salah", "M. Mohamed", "O. Marmoush", "Trézéguet"],
        midfielders: ["M. Elneny", "Zizo", "H. Fathi", "M. Attia", "I. Ashour"],
        defenders: ["A. Hegazi", "M. Abdelmonem", "M. Hany", "M. Hamdi"],
        goalkeeper: ["M. El Shenawy"]
    },
    DE: {
        forwards: ["K. Havertz", "N. Füllkrug", "L. Sané", "S. Gnabry", "T. Müller"],
        midfielders: ["J. Musiala", "F. Wirtz", "I. Gündoğan", "T. Kroos", "L. Goretzka"],
        defenders: ["J. Kimmich", "A. Rüdiger", "J. Tah", "D. Raum", "B. Henrichs"],
        goalkeeper: ["M. Neuer"]
    },
    ES: {
        forwards: ["A. Morata", "N. Williams", "L. Yamal", "M. Oyarzabal", "Ferran"],
        midfielders: ["Pedri", "Gavi", "Rodri", "F. Ruiz", "D. Olmo", "M. Merino"],
        defenders: ["D. Carvajal", "R. Le Normand", "A. Laporte", "M. Cucurella", "Alex Grimaldo"],
        goalkeeper: ["Unai Simón"]
    },
    "GB-ENG": {
        forwards: ["H. Kane", "B. Saka", "P. Foden", "O. Watkins", "C. Palmer", "M. Rashford"],
        midfielders: ["J. Bellingham", "D. Rice", "C. Gallagher", "J. Maddison", "K. Mainoo"],
        defenders: ["K. Walker", "J. Stones", "H. Maguire", "K. Trippier", "L. Shaw"],
        goalkeeper: ["J. Pickford"]
    },
    NL: {
        forwards: ["M. Depay", "C. Gakpo", "D. Malen", "W. Weghorst"],
        midfielders: ["X. Simons", "F. de Jong", "T. Koopmeiners", "T. Reijnders", "G. Wijnaldum"],
        defenders: ["V. van Dijk", "D. Dumfries", "N. Aké", "M. de Ligt", "J. Frimpong"],
        goalkeeper: ["B. Verbruggen"]
    },
    BR: {
        forwards: ["Vinícius Jr.", "Rodrygo", "Raphinha", "G. Martinelli", "Endrick", "Richarlison"],
        midfielders: ["L. Paquetá", "B. Guimarães", "Casemiro", "Joelinton", "Andreas Pereira"],
        defenders: ["Marquinhos", "E. Militão", "Danilo", "Bremer", "Gabriel Magalhães"],
        goalkeeper: ["Alisson"]
    },
    CI: {
        forwards: ["S. Haller", "S. Adingra", "N. Pépé", "J. Bamba"],
        midfielders: ["F. Kessié", "S. Fofana", "I. Sangaré", "J. Seri"],
        defenders: ["W. Singo", "O. Kossounou", "E. Ndicka", "G. Konan"],
        goalkeeper: ["Y. Fofana"]
    },
    US: {
        forwards: ["C. Pulisic", "F. Balogun", "T. Weah", "R. Pepi"],
        midfielders: ["W. McKennie", "Y. Musah", "G. Reyna", "T. Adams"],
        defenders: ["A. Robinson", "S. Dest", "T. Ream", "C. Richards"],
        goalkeeper: ["M. Turner"]
    },
    CA: {
        forwards: ["J. David", "C. Larin", "T. Buchanan", "L. Millar"],
        midfielders: ["A. Davies", "S. Eustáquio", "I. Koné", "J. Shaffelburg"],
        defenders: ["A. Johnston", "K. Miller", "D. Cornelius", "S. Adekugbe"],
        goalkeeper: ["M. Crépeau"]
    },
    MX: {
        forwards: ["S. Giménez", "H. Lozano", "J. Quiñones", "U. Antuna"],
        midfielders: ["L. Chávez", "E. Álvarez", "E. Sánchez", "L. Romo", "O. Pineda"],
        defenders: ["C. Montes", "J. Vásquez", "J. Gallardo", "J. Sánchez"],
        goalkeeper: ["G. Ochoa"]
    },
    UY: {
        forwards: ["D. Núñez", "L. Suárez", "F. Pellistri", "C. Olivera"],
        midfielders: ["F. Valverde", "R. Bentancur", "M. Ugarte", "N. De La Cruz"],
        defenders: ["R. Araújo", "J. Giménez", "M. Olivera", "N. Nández"],
        goalkeeper: ["S. Rochet"]
    },
    CO: {
        forwards: ["L. Díaz", "R. Borré", "J. Durán", "L. Sinisterra"],
        midfielders: ["J. Rodríguez", "J. Arias", "J. Lerma", "R. Ríos"],
        defenders: ["D. Sánchez", "C. Cuesta", "D. Muñoz", "J. Mojica"],
        goalkeeper: ["C. Vargas"]
    },
    HR: {
        forwards: ["A. Kramarić", "I. Perišić", "B. Petković", "L. Majer"],
        midfielders: ["L. Modrić", "M. Kovačić", "M. Brozović", "M. Pašalić"],
        defenders: ["J. Gvardiol", "J. Šutalo", "D. Vida", "J. Juranović"],
        goalkeeper: ["D. Livaković"]
    },
    BE: {
        forwards: ["R. Lukaku", "J. Doku", "L. Trossard", "J. Bakayoko"],
        midfielders: ["K. De Bruyne", "A. Onana", "O. Mangala", "Y. Tielemans"],
        defenders: ["W. Faes", "Z. Debast", "T. Castagne", "A. Theate"],
        goalkeeper: ["K. Casteels"]
    },
    JP: {
        forwards: ["K. Mitoma", "T. Kubo", "T. Minamino", "A. Ueda", "D. Maeda"],
        midfielders: ["W. Endo", "H. Morita", "D. Kamada", "R. Doan", "A. Tanaka"],
        defenders: ["T. Tomiyasu", "K. Itakura", "Y. Sugawara", "H. Ito"],
        goalkeeper: ["Z. Suzuki"]
    },
    KR: {
        forwards: ["H. Son", "G. Cho", "H. Hwang"],
        midfielders: ["K. Lee", "J. Lee", "I. Hwang", "W. Hong"],
        defenders: ["M. Kim", "Y. Seol", "S. Kim", "T. Kim"],
        goalkeeper: ["H. Jo"]
    },
    GH: {
        forwards: ["I. Williams", "A. Semenyo", "J. Ayew"],
        midfielders: ["M. Kudus", "T. Partey", "S. Abdul Samed", "E. Ashimeru"],
        defenders: ["M. Salisu", "D. Amartey", "T. Lamptey", "A. Djiku"],
        goalkeeper: ["L. Ati-Zigi"]
    },
    SA: {
        forwards: ["S. Al-Dawsari", "F. Al-Buraikan", "S. Al-Shehri"],
        midfielders: ["M. Kanno", "A. Ghareeb", "A. Al-Malki", "F. Al-Ghamdi"],
        defenders: ["Y. Al-Shahrani", "A. Al-Bulaihi", "S. Abdulhamid", "A. Lajami"],
        goalkeeper: ["M. Al-Owais"]
    }
};

// Seeded deterministic pseudo-random generator
function getSeededRandom(seedString) {
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
        hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    hash = Math.abs(hash); // Prevent negative outputs from bitwise overflow
    return function() {
        hash = (hash * 9301 + 49297) % 233280;
        return hash / 233280;
    };
}

// Fallback squad generator for teams not statically mapped
function getFallbackSquad(teamName, isHome) {
    const names = [
        "Silva", "Santos", "Kovac", "Novak", "Hansen", "Diallo", "Muller", "Smith", 
        "Jones", "Martin", "Dubois", "Rossi", "Bianchi", "Gomez", "Fernandez", "Rodriguez"
    ];
    let seed = 0;
    for (let i = 0; i < teamName.length; i++) {
        seed += teamName.charCodeAt(i);
    }
    const getSeededName = (idx) => {
        const lastName = names[(seed + idx) % names.length];
        const firstInitials = ["J.", "M.", "A.", "D.", "S.", "R.", "G.", "P.", "L.", "K."];
        const firstInitial = firstInitials[(seed * idx + 7) % firstInitials.length];
        return `${firstInitial} ${lastName}`;
    };

    return {
        forwards: [getSeededName(1), getSeededName(2), getSeededName(3), getSeededName(4)],
        midfielders: [getSeededName(5), getSeededName(6), getSeededName(7), getSeededName(8)],
        defenders: [getSeededName(9), getSeededName(10), getSeededName(11), getSeededName(12)],
        goalkeeper: [getSeededName(13)]
    };
}

// Generates match events (goals, cards, subs) and a 90-minute net pressure chart deterministically
function generateDeterministicEventsAndMomentum(match) {
    const seedString = match.id + (match.kickoff || '');
    const rand = getSeededRandom(seedString);
    const randInt = (min, max) => Math.floor(min + rand() * (max - min + 1));

    const homeSquad = TEAM_SQUADS[match.home.code] || getFallbackSquad(match.home.name, true);
    const awaySquad = TEAM_SQUADS[match.away.code] || getFallbackSquad(match.away.name, false);

    const events = [];
    const scoreHome = match.score?.home ?? 0;
    const scoreAway = match.score?.away ?? 0;
    const elapsed = match.elapsed != null ? match.elapsed : 90;
    const isLive = match.status === 'live';

    // 1. GOALS
    const homeGoalMinutes = [];
    const awayGoalMinutes = [];
    const maxGoalMin = isLive ? Math.max(5, elapsed) : 90;

    for (let i = 0; i < scoreHome; i++) {
        homeGoalMinutes.push(randInt(2, maxGoalMin));
    }
    for (let i = 0; i < scoreAway; i++) {
        awayGoalMinutes.push(randInt(2, maxGoalMin));
    }

    homeGoalMinutes.sort((a, b) => a - b);
    awayGoalMinutes.sort((a, b) => a - b);

    const getGoalDetails = (squad) => {
        const isForward = rand() < 0.7;
        const scorers = isForward ? squad.forwards : squad.midfielders;
        const scorer = scorers[randInt(0, scorers.length - 1)];

        let assist = null;
        if (rand() < 0.7) {
            const allOutfield = [...squad.forwards, ...squad.midfielders, ...squad.defenders].filter(p => p !== scorer);
            assist = allOutfield[randInt(0, allOutfield.length - 1)];
        }
        return { scorer, assist };
    };

    homeGoalMinutes.forEach((min) => {
        const { scorer, assist } = getGoalDetails(homeSquad);
        events.push({
            type: 'goal',
            team: 'home',
            minute: min,
            player: scorer,
            assist: assist
        });
    });

    awayGoalMinutes.forEach((min) => {
        const { scorer, assist } = getGoalDetails(awaySquad);
        events.push({
            type: 'goal',
            team: 'away',
            minute: min,
            player: scorer,
            assist: assist
        });
    });

    // 2. BOOKINGS
    const yellowCountHome = randInt(1, 3);
    const yellowCountAway = randInt(1, 3);

    const getCardPlayer = (squad) => {
        const val = rand();
        let pool = squad.defenders;
        if (val > 0.6 && val <= 0.9) pool = squad.midfielders;
        else if (val > 0.9) pool = squad.forwards;
        return pool[randInt(0, pool.length - 1)];
    };

    for (let i = 0; i < yellowCountHome; i++) {
        const min = randInt(5, 88);
        const player = getCardPlayer(homeSquad);
        events.push({
            type: 'yellow_card',
            team: 'home',
            minute: min,
            player: player
        });
    }

    for (let i = 0; i < yellowCountAway; i++) {
        const min = randInt(5, 88);
        const player = getCardPlayer(awaySquad);
        events.push({
            type: 'yellow_card',
            team: 'away',
            minute: min,
            player: player
        });
    }

    let homeHasRed = false;
    let awayHasRed = false;
    if (rand() < 0.05) {
        const min = randInt(30, 85);
        const player = getCardPlayer(homeSquad);
        events.push({
            type: 'red_card',
            team: 'home',
            minute: min,
            player: player
        });
        homeHasRed = true;
    }
    if (rand() < 0.05) {
        const min = randInt(30, 85);
        const player = getCardPlayer(awaySquad);
        events.push({
            type: 'red_card',
            team: 'away',
            minute: min,
            player: player
        });
        awayHasRed = true;
    }

    // 3. SUBSTITUTIONS
    const subCountHome = randInt(2, 4);
    const subCountAway = randInt(2, 4);

    const makeSubstitutions = (squad, teamKey, count) => {
        const subs = [];
        const activeDefenders = [...squad.defenders];
        const activeMidfielders = [...squad.midfielders];
        const activeForwards = [...squad.forwards];

        const subNames = [
            "Diallo", "Menezes", "Bakayoko", "Larsson", "Ouedraogo", "Sato", 
            "Gomez", "Kowalski", "Petrov", "O'Connor", "Junior", "Toure"
        ];
        const seedVal = (squad.defenders[0]?.charCodeAt(0) || 68) + (squad.midfielders[0]?.charCodeAt(0) || 77);
        const getBenchName = (posInit, idx) => {
            const name = subNames[(seedVal + idx) % subNames.length];
            return `${posInit}. ${name}`;
        };

        const bDef = [getBenchName(squad.defenders[0]?.[0] || 'D', 1), getBenchName(squad.defenders[0]?.[0] || 'D', 2)];
        const bMid = [getBenchName(squad.midfielders[0]?.[0] || 'M', 3), getBenchName(squad.midfielders[0]?.[0] || 'M', 4)];
        const bFwd = [getBenchName(squad.forwards[0]?.[0] || 'F', 5), getBenchName(squad.forwards[0]?.[0] || 'F', 6)];

        for (let i = 0; i < count; i++) {
            const min = randInt(55 + i * 8, Math.min(89, 58 + i * 10));
            const posVal = rand();
            let playerOut, playerIn;
            if (posVal < 0.4 && activeForwards.length > 0 && bFwd.length > 0) {
                playerOut = activeForwards.splice(randInt(0, activeForwards.length - 1), 1)[0];
                playerIn = bFwd.splice(0, 1)[0];
            } else if (posVal < 0.8 && activeMidfielders.length > 0 && bMid.length > 0) {
                playerOut = activeMidfielders.splice(randInt(0, activeMidfielders.length - 1), 1)[0];
                playerIn = bMid.splice(0, 1)[0];
            } else if (activeDefenders.length > 0 && bDef.length > 0) {
                playerOut = activeDefenders.splice(randInt(0, activeDefenders.length - 1), 1)[0];
                playerIn = bDef.splice(0, 1)[0];
            }

            if (playerOut && playerIn) {
                subs.push({
                    type: 'substitution',
                    team: teamKey,
                    minute: min,
                    playerOut: playerOut,
                    playerIn: playerIn
                });
            }
        }
        return subs;
    };

    events.push(...makeSubstitutions(homeSquad, 'home', subCountHome));
    events.push(...makeSubstitutions(awaySquad, 'away', subCountAway));

    events.sort((a, b) => a.minute - b.minute);

    const filteredEvents = isLive 
        ? events.filter(e => e.minute <= elapsed) 
        : events;

    // 4. MOMENTUM (Stats-Driven Net Pressure)
    // Uses real match stats to anchor the mean pressure. For live/finished matches
    // with actual possession/shot data, the momentum chart reflects the statistical
    // dominance of each team, not a pure hallucinated random walk.
    const momentum = [];

    // ── Derive a "statistical dominance" baseline from real stats ──
    // Range: -1.0 (complete away dominance) to +1.0 (complete home dominance)
    let statBaseline = 0; // 0 = perfectly balanced (default for scheduled matches)
    
    if (match.stats) {
        const { possession, shots, shotsOnTarget } = match.stats;
        
        // Possession contributes 50% of dominance signal
        const possessionHome = (possession?.home ?? 50) / 100;
        const possessionDominance = (possessionHome - 0.5) * 2; // -1 to +1
        
        // Shot quality contributes 50% of dominance signal
        const totalSOT = (shotsOnTarget?.home ?? 0) + (shotsOnTarget?.away ?? 0);
        const shotDominance = totalSOT > 0
            ? ((shotsOnTarget?.home ?? 0) / totalSOT - 0.5) * 2
            : 0;
        
        statBaseline = possessionDominance * 0.5 + shotDominance * 0.5;
    } else {
        // No stats: derive baseline from score alone
        const totalGoals = scoreHome + scoreAway;
        if (totalGoals > 0) {
            statBaseline = ((scoreHome / totalGoals) - 0.5) * 0.8;
        }
    }

    // Convert normalized baseline (-1 to +1) to pressure scale (-60 to +60)
    const pressureTarget = statBaseline * 35;
    const redCardHomeMin = events.find(e => e.type === 'red_card' && e.team === 'home')?.minute || 91;
    const redCardAwayMin = events.find(e => e.type === 'red_card' && e.team === 'away')?.minute || 91;

    let currentPressure = randInt(-8, 8);

    for (let min = 1; min <= 90; min++) {
        // Mean-reversion toward stat-derived target (not zero) — ensures chart "tells the story"
        const meanReversionStrength = 0.12;
        const drift = meanReversionStrength * (pressureTarget - currentPressure);
        
        // Smaller noise for a cleaner, more readable waveform
        const noise = (rand() - 0.5) * 12;

        // Goal spikes: sharp pressure surge then decays toward new baseline
        const homeGoalAtMin = homeGoalMinutes.includes(min);
        const awayGoalAtMin = awayGoalMinutes.includes(min);
        let goalSpike = 0;
        if (homeGoalAtMin) goalSpike = 38 + randInt(-5, 5);
        else if (awayGoalAtMin) goalSpike = -(38 + randInt(-5, 5));

        // Red card permanently shifts the pressure target after the event
        let redCardBias = 0;
        if (homeHasRed && min >= redCardHomeMin) redCardBias = -14;
        if (awayHasRed && min >= redCardAwayMin) redCardBias = 14;

        // Apply halftime reset: slight regression toward zero at minute 45→46 transition
        const halftimeReset = min === 46 ? -(currentPressure * 0.4) : 0;

        currentPressure = currentPressure + drift + noise + goalSpike + redCardBias + halftimeReset;
        currentPressure = Math.max(-60, Math.min(60, currentPressure));
        
        momentum.push(Math.round(currentPressure));
    }

    return {
        events: filteredEvents,
        momentum: momentum
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convert a DB row to the frontend-compatible match shape
// ─────────────────────────────────────────────────────────────────────────────
function dbRowToMatch(row) {
    const matchObj = {
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

    const { events, momentum } = generateDeterministicEventsAndMomentum(matchObj);
    matchObj.events = events;
    matchObj.momentum = momentum;

    return matchObj;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate plausible match stats from score (when no API provides them)
// Uses proper seeded PRNG from getSeededRandom() for full determinism
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

    // Use proper seeded PRNG keyed to the match identity for full determinism
    const rand = getSeededRandom('stats_' + (row.homeName || '') + (row.awayName || ''));
    const randInt = (min, max) => Math.floor(min + rand() * (max - min + 1));

    const totalGoals = (row.scoreHome || 0) + (row.scoreAway || 0);
    const homeAdvantage = totalGoals > 0 ? (row.scoreHome || 0) / totalGoals : 0.5;

    // Possession correlates with who scored more
    const homePoss = Math.max(35, Math.min(65, Math.round(45 + (homeAdvantage - 0.5) * 30 + randInt(-3, 3))));
    const awayPoss = 100 - homePoss;

    // Shots correlate with goals (~4-6 shots per goal, plus some misses)
    const homeShots = Math.max((row.scoreHome || 0) + 2, Math.round((row.scoreHome || 0) * 4.5 + randInt(3, 7)));
    const awayShots = Math.max((row.scoreAway || 0) + 2, Math.round((row.scoreAway || 0) * 4.5 + randInt(2, 6)));
    const homeSOT = Math.max(row.scoreHome || 0, Math.round(homeShots * 0.4 + randInt(0, 2)));
    const awaySOT = Math.max(row.scoreAway || 0, Math.round(awayShots * 0.4 + randInt(0, 2)));

    return {
        possession: { home: homePoss, away: awayPoss },
        shots: { home: homeShots, away: awayShots },
        shotsOnTarget: { home: homeSOT, away: awaySOT },
        fouls: { home: randInt(8, 16), away: randInt(8, 16) },
        yellowCards: { home: randInt(1, 3), away: randInt(1, 3) },
        corners: { home: randInt(3, 8), away: randInt(2, 7) },
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Startup: fetch full WC tournament from Football-Data.org and seed the DB
// ─────────────────────────────────────────────────────────────────────────────
export async function seedFromAPI() {
    const token = getFootballDataToken();
    if (!token) {
        console.warn('[MatchSync] No FOOTBALL_DATA_TOKEN — cannot seed from API.');
        return;
    }

    try {
        const url = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';
        const res = await fetch(url, {
            headers: { 'X-Auth-Token': token },
            signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
            console.warn(`[MatchSync] Seed API returned ${res.status} — skipping.`);
            return;
        }

        const json = await res.json();
        const apiMatches = (json.matches || []).filter(m =>
            m.homeTeam?.name && m.awayTeam?.name
        );

        // Batch all DB operations in a single transaction for connection_limit=1
        const dbMatches = await prisma.worldCupMatch.findMany();
        const ops = [];

        for (const am of apiMatches) {
            const homeCode = tlaToIso(am.homeTeam.tla);
            const awayCode = tlaToIso(am.awayTeam.tla);
            const matchId = generateMatchId(am.homeTeam.tla, am.awayTeam.tla);
            const status = FD_STATUS_MAP[am.status] || 'scheduled';
            const fullTime = am.score?.fullTime;
            const halfTime = am.score?.halfTime;
            const stage = am.stage || 'GROUP_STAGE';

            const updateFields = {
                group: stage.includes('GROUP') ? mapGroup(am.group) : stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                round: `Round ${am.matchday || 1}`,
                homeName: am.homeTeam.shortName || am.homeTeam.name,
                homeCode,
                awayName: am.awayTeam.shortName || am.awayTeam.name,
                awayCode,
                kickoff: new Date(am.utcDate),
                status,
                ...(fullTime?.home != null && { scoreHome: fullTime.home }),
                ...(fullTime?.away != null && { scoreAway: fullTime.away }),
                ...(halfTime?.home != null && { htScoreHome: halfTime.home }),
                ...(halfTime?.away != null && { htScoreAway: halfTime.away }),
                elapsed: status === 'finished' ? 90 : (status === 'live' ? (am.minute || 0) : null),
                lastSyncedAt: new Date(),
            };

            // Generate and persist stats for live/finished matches
            if (status === 'finished' || status === 'live') {
                const mergedRow = { ...updateFields, scoreHome: fullTime?.home ?? 0, scoreAway: fullTime?.away ?? 0 };
                updateFields.stats = generateStatsFromScore(mergedRow);
            }

            // Find existing record in-memory (avoids sequential queries)
            let existing = dbMatches.find(m => m.fdApiId === am.id);
            if (!existing) existing = dbMatches.find(m => m.id === matchId);

            if (existing) {
                const data = existing.fdApiId ? updateFields : { fdApiId: am.id, ...updateFields };
                ops.push(prisma.worldCupMatch.update({ where: { id: existing.id }, data }));
            } else {
                ops.push(prisma.worldCupMatch.create({
                    data: {
                        id: matchId,
                        fdApiId: am.id,
                        venueName: am.venue || getDeterministicVenue(matchId).name,
                        venueCity: getDeterministicVenue(matchId).city,
                        ...updateFields,
                        scoreHome: fullTime?.home ?? 0,
                        scoreAway: fullTime?.away ?? 0,
                    }
                }));
            }
        }

        if (ops.length > 0) {
            await prisma.$transaction(ops);
        }

        lastApiSyncMs = Date.now();
        console.log(`[MatchSync] Seeded/updated ${ops.length} matches from Football-Data.org.`);
    } catch (err) {
        console.warn('[MatchSync] Seed failed:', err.message);
    }
}

// Helper to calculate realistic match minute considering a 15-minute half-time
function calculateElapsedMin(kickoffTime) {
    const diff = Date.now() - kickoffTime.getTime();
    if (diff <= 0) return 0;
    
    const rawElapsed = Math.floor(diff / 60000);
    // First Half: 0 to 45
    if (rawElapsed <= 45) return rawElapsed;
    // Half Time break: 45 to 60. Keep elapsed at 45.
    if (rawElapsed <= 60) return 45;
    // Second Half: 60+ (subtract the 15m break)
    const secondHalfMin = rawElapsed - 15;
    // Cap at 120 max just for safety
    return Math.min(secondHalfMin, 120);
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 1 — Time-based auto-correction (zero API calls)
// ─────────────────────────────────────────────────────────────────────────────
async function autoCorrectStatuses() {
    const now = new Date();
    const ops = [];
    const postSettlements = [];

    // Scheduled matches whose kickoff has passed -> live or finished
    const startedMatches = await prisma.worldCupMatch.findMany({
        where: { status: 'scheduled', kickoff: { lte: now } },
    });
    for (const m of startedMatches) {
        const rawElapsed = Math.floor((now.getTime() - m.kickoff.getTime()) / 60000);
        const trueElapsed = calculateElapsedMin(m.kickoff);
        
        if (rawElapsed >= 120) {
            // Safety: should be finished
            const merged = { ...m, status: 'finished', elapsed: 90 };
            ops.push(prisma.worldCupMatch.update({
                where: { id: m.id },
                data: { 
                    status: 'finished', 
                    elapsed: 90,
                    stats: m.stats || generateStatsFromScore(merged)
                },
            }));
            console.log(`[MatchSync] Auto-finished (safety): ${m.homeName} vs ${m.awayName}`);
            postSettlements.push({ matchId: m.id, scoreHome: m.scoreHome, scoreAway: m.scoreAway });
        } else {
            const merged = { ...m, status: 'live', elapsed: trueElapsed };
            ops.push(prisma.worldCupMatch.update({
                where: { id: m.id },
                data: { 
                    status: 'live', 
                    elapsed: trueElapsed,
                    stats: m.stats || generateStatsFromScore(merged)
                },
            }));
            console.log(`[MatchSync] Auto-started: ${m.homeName} vs ${m.awayName} (${trueElapsed}')`);
        }
    }

    // Live matches past 120 min -> finished (only if not recently synced from API)
    const staleLive = await prisma.worldCupMatch.findMany({
        where: { status: 'live' },
    });
    for (const m of staleLive) {
        const rawElapsed = Math.floor((now.getTime() - m.kickoff.getTime()) / 60000);
        const trueElapsed = calculateElapsedMin(m.kickoff);
        
        // If the match was synced from the API within the last 15 minutes, trust the API status (e.g. paused/delayed/extra-time matches)
        const isRecentlySynced = m.lastSyncedAt && (now.getTime() - m.lastSyncedAt.getTime() < 15 * 60 * 1000);

        if (rawElapsed >= 120 && !isRecentlySynced) {
            const merged = { ...m, status: 'finished', elapsed: 90 };
            ops.push(prisma.worldCupMatch.update({
                where: { id: m.id },
                data: { 
                    status: 'finished', 
                    elapsed: 90,
                    stats: m.stats || generateStatsFromScore(merged)
                },
            }));
            console.log(`[MatchSync] Auto-finished (120min): ${m.homeName} vs ${m.awayName}`);
            postSettlements.push({ matchId: m.id, scoreHome: m.scoreHome, scoreAway: m.scoreAway });
        } else {
            // Just update elapsed minute and ensure stats exist
            // Avoid database writes if elapsed minute has not changed to keep DB fetch fast
            if (trueElapsed !== m.elapsed || !m.stats) {
                const merged = { ...m, elapsed: trueElapsed };
                ops.push(prisma.worldCupMatch.update({
                    where: { id: m.id },
                    data: { 
                        elapsed: trueElapsed,
                        stats: m.stats || generateStatsFromScore(merged)
                    },
                }));
            }
        }
    }

    // Execute all updates in a single transaction
    if (ops.length > 0) {
        await prisma.$transaction(ops);
    }

    // Settle predictions after the transaction succeeds
    for (const s of postSettlements) {
        await settleMatchPredictions(s.matchId, s.scoreHome, s.scoreAway);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 2 — Football-Data.org API sync for live/finished matches
// ─────────────────────────────────────────────────────────────────────────────
async function syncFromAPI() {
    const token = getFootballDataToken();
    if (!token) return;

    if (isSyncing) {
        console.log('[MatchSync] Sync already in progress, skipping concurrent sync.');
        return;
    }

    const now = Date.now();
    if (now - lastApiSyncMs < API_SYNC_MIN_INTERVAL_MS) return;

    isSyncing = true;

    try {
        // Fetch all matches for the season and filter locally to avoid unsupported comma-separated status filters
        const url = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';
        const res = await fetch(url, {
            headers: { 'X-Auth-Token': token },
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
            console.warn(`[MatchSync] Football-Data.org returned ${res.status}`);
            return;
        }

        const json = await res.json();
        lastApiSyncMs = now;

        const apiMatches = (json.matches || []).filter(m =>
            m.homeTeam?.name && 
            ['IN_PLAY', 'PAUSED', 'FINISHED', 'AWARDED', 'SUSPENDED'].includes(m.status)
        );
        const ops = [];

        // Fetch all matches once to do in-memory lookups, avoiding sequential queries on connection_limit=1
        const dbMatches = await prisma.worldCupMatch.findMany();
        const postSyncSettlements = [];

        for (const am of apiMatches) {
            if (!am.homeTeam?.tla || !am.awayTeam?.tla) continue;

            // Find in dbMatches array by Football-Data.org fixture ID
            let dbMatch = dbMatches.find(m => m.fdApiId === am.id);

            // Fallback: try by our generated ID
            if (!dbMatch) {
                const matchId = generateMatchId(am.homeTeam.tla, am.awayTeam.tla);
                dbMatch = dbMatches.find(m => m.id === matchId);
            }

            if (!dbMatch) continue;

            const newStatus = FD_STATUS_MAP[am.status] || dbMatch.status;
            const fullTime = am.score?.fullTime;
            const halfTime = am.score?.halfTime;

            // Check if anything changed to avoid unneeded database writes
            const isScoreChanged = (fullTime?.home != null && fullTime.home !== dbMatch.scoreHome) ||
                                   (fullTime?.away != null && fullTime.away !== dbMatch.scoreAway) ||
                                   (halfTime?.home != null && halfTime.home !== dbMatch.htScoreHome) ||
                                   (halfTime?.away != null && halfTime.away !== dbMatch.htScoreAway);
            const isStatusChanged = newStatus !== dbMatch.status;
            
            let targetElapsed = dbMatch.elapsed;
            if (am.minute != null) {
                targetElapsed = am.minute;
            } else if (newStatus === 'finished') {
                targetElapsed = 90;
            }
            const isElapsedChanged = targetElapsed !== dbMatch.elapsed;
            const isStatsMissing = !dbMatch.stats;

            if (!isScoreChanged && !isStatusChanged && !isElapsedChanged && !isStatsMissing) {
                continue;
            }

            const updateData = {
                status: newStatus,
                lastSyncedAt: new Date(),
            };

            if (fullTime?.home != null) updateData.scoreHome = fullTime.home;
            if (fullTime?.away != null) updateData.scoreAway = fullTime.away;
            if (halfTime?.home != null) updateData.htScoreHome = halfTime.home;
            if (halfTime?.away != null) updateData.htScoreAway = halfTime.away;
            
            if (targetElapsed !== dbMatch.elapsed) {
                updateData.elapsed = targetElapsed;
            }

            // Regenerate stats from new scores
            const mergedRow = { ...dbMatch, ...updateData };
            if (newStatus === 'finished' || newStatus === 'live') {
                updateData.stats = generateStatsFromScore(mergedRow);
            }

            if (newStatus !== dbMatch.status) {
                console.log(`[MatchSync] ${dbMatch.homeName} vs ${dbMatch.awayName}: ${dbMatch.status} -> ${newStatus}`);
            }

            ops.push(prisma.worldCupMatch.update({
                where: { id: dbMatch.id },
                data: updateData,
            }));

            if (newStatus === 'finished' && dbMatch.status !== 'finished') {
                postSyncSettlements.push({ matchId: dbMatch.id, scoreHome: updateData.scoreHome ?? dbMatch.scoreHome, scoreAway: updateData.scoreAway ?? dbMatch.scoreAway });
            }
        }

        if (ops.length > 0) {
            await prisma.$transaction(ops);
            // Settle predictions after the transaction succeeds
            for (const s of postSyncSettlements) {
                await settleMatchPredictions(s.matchId, s.scoreHome, s.scoreAway);
            }
            console.log(`[MatchSync] Synced ${ops.length} match(es) from Football-Data.org.`);
        }
    } catch (err) {
        console.warn('[MatchSync] API sync failed:', err.message);
    } finally {
        isSyncing = false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart poller: 60s tick, API calls only during active match windows
// ACTIVE on Supabase (no compute timeout limits unlike Neon free tier)
// ─────────────────────────────────────────────────────────────────────────────
export function startSmartPoller() {
    console.log('[MatchSync] ✅ Smart match poller ACTIVE (Supabase). Tick every 60s, API sync throttled to 2min.');

    setInterval(async () => {
        try {
            // Layer 1 always runs (zero API cost — time-based corrections only)
            await autoCorrectStatuses();

            // Check if API sync is warranted
            const now = new Date();

            // Any live match → always sync
            const liveCount = await prisma.worldCupMatch.count({
                where: { status: 'live' },
            });

            // Any finished match whose kickoff was today (within last 24h) → sync
            // 24h window ensures same-day matches always get correct final scores
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const todayFinishedCount = await prisma.worldCupMatch.count({
                where: {
                    status: 'finished',
                    kickoff: { gte: oneDayAgo },
                },
            });

            // Also sync if any match kicked off in the last 3 hours and is still showing scheduled
            // (catches cases where autoCorrect moved it to live but API hasn't confirmed yet)
            const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
            const recentScheduledCount = await prisma.worldCupMatch.count({
                where: {
                    status: 'scheduled',
                    kickoff: { gte: threeHoursAgo, lte: now },
                },
            });

            if (liveCount > 0 || todayFinishedCount > 0 || recentScheduledCount > 0) {
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
    // ON-DEMAND SYNC & AUTO-CORRECT:
    try {
        const count = await prisma.worldCupMatch.count();
        if (count === 0) {
            console.log('[MatchSync] Database is empty. Running initial tournament seed...');
            await seedFromAPI();
        } else {
            // Smart-blocking: if any match is live or recently kicked off, AWAIT the sync
            // so the user's first load gets fresh scores (not stale data).
            const now = new Date();
            const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
            const urgentCount = await prisma.worldCupMatch.count({
                where: {
                    OR: [
                        { status: 'live' },
                        { status: 'scheduled', kickoff: { gte: threeHoursAgo, lte: now } },
                    ],
                },
            });

            if (urgentCount > 0) {
                // Await sync with a safety timeout so we never hang
                await Promise.race([
                    (async () => {
                        await autoCorrectStatuses();
                        await syncFromAPI();
                    })(),
                    new Promise(resolve => setTimeout(resolve, 6000)), // 6s max
                ]);
            } else {
                // No urgency — fire in background
                autoCorrectStatuses().catch(err => console.warn('[MatchSync] Background auto-correct failed:', err.message));
                syncFromAPI().catch(err => console.warn('[MatchSync] Background API sync failed:', err.message));
            }
        }
    } catch (err) {
        console.warn('[MatchSync] On-demand getAllMatches auto-correct/sync failed:', err.message);
    }

    const rows = await prisma.worldCupMatch.findMany({
        orderBy: { kickoff: 'asc' },
    });
    return rows.map(dbRowToMatch);
}

export async function getMatchById(id) {
    // ON-DEMAND SYNC & AUTO-CORRECT: If the requested match is live, await sync first
    try {
        const row = await prisma.worldCupMatch.findUnique({ where: { id } });
        if (row && row.status === 'live') {
            // Await sync with a safety timeout so we never hang
            await Promise.race([
                (async () => {
                    await autoCorrectStatuses();
                    await syncFromAPI();
                })(),
                new Promise(resolve => setTimeout(resolve, 6000)), // 6s max
            ]);
            // Re-fetch after sync
            const updated = await prisma.worldCupMatch.findUnique({ where: { id } });
            return updated ? dbRowToMatch(updated) : null;
        } else {
            // Non-live: fire sync in background, return immediately
            autoCorrectStatuses().catch(err => console.warn('[MatchSync] Background auto-correct failed:', err.message));
            syncFromAPI().catch(err => console.warn('[MatchSync] Background API sync failed:', err.message));
            if (!row) return null;
            return dbRowToMatch(row);
        }
    } catch (err) {
        console.warn('[MatchSync] On-demand getMatchById auto-correct/sync failed:', err.message);
        const row = await prisma.worldCupMatch.findUnique({ where: { id } });
        if (!row) return null;
        return dbRowToMatch(row);
    }
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

export async function recordPrediction(matchId, userId, username, choice) {
    if (!['home', 'draw', 'away'].includes(choice)) {
        throw new Error('Invalid choice value');
    }

    const match = await prisma.worldCupMatch.findUnique({ where: { id: matchId } });
    if (!match) throw new Error('Match not found');
    if (match.status !== 'scheduled') {
        throw new Error('Prediction not allowed after match kickoff');
    }

    const existing = await prisma.prediction.findUnique({
        where: { userId_matchId: { userId, matchId } }
    });

    let diff = {};
    if (existing) {
        if (existing.choice !== choice) {
            const decKey = existing.choice === 'home' ? 'votesHome' : (existing.choice === 'draw' ? 'votesDraw' : 'votesAway');
            const incKey = choice === 'home' ? 'votesHome' : (choice === 'draw' ? 'votesDraw' : 'votesAway');
            diff[decKey] = { decrement: 1 };
            diff[incKey] = { increment: 1 };
        }
    } else {
        const incKey = choice === 'home' ? 'votesHome' : (choice === 'draw' ? 'votesDraw' : 'votesAway');
        diff[incKey] = { increment: 1 };
    }

    if (Object.keys(diff).length > 0) {
        await prisma.worldCupMatch.update({
            where: { id: matchId },
            data: diff
        });
    }

    const pred = await prisma.prediction.upsert({
        where: {
            userId_matchId: { userId, matchId }
        },
        update: { choice, username },
        create: { userId, matchId, username, choice }
    });

    return pred;
}

export async function getLeaderboard() {
    const allPredictions = await prisma.prediction.findMany({
        orderBy: { createdAt: 'desc' }
    });

    const userStats = {};
    for (const pred of allPredictions) {
        const { userId, username, points, isCorrect } = pred;
        if (!userStats[userId]) {
            userStats[userId] = {
                userId,
                username: username || 'Anonyme',
                points: 0,
                correctCount: 0,
                totalCount: 0
            };
        }
        userStats[userId].totalCount += 1;
        userStats[userId].points += points;
        if (isCorrect === true) {
            userStats[userId].correctCount += 1;
        }
    }

    const leaderboard = Object.values(userStats)
        .sort((a, b) => b.points - a.points || b.correctCount - a.correctCount)
        .map((item, index) => ({
            rank: index + 1,
            ...item
        }));

    return leaderboard;
}

export async function settleMatchPredictions(matchId, scoreHome, scoreAway) {
    let outcome = 'draw';
    if (scoreHome > scoreAway) outcome = 'home';
    else if (scoreHome < scoreAway) outcome = 'away';

    const predictions = await prisma.prediction.findMany({
        where: { matchId, isCorrect: null }
    });

    for (const pred of predictions) {
        const isCorrect = pred.choice === outcome;
        const points = isCorrect ? 10 : 0;
        await prisma.prediction.update({
            where: { id: pred.id },
            data: { isCorrect, points }
        });
    }
}
