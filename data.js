// ==========================================
// 1. COUNTRY ISO CODE MAPPER FOR FLAGS
// ==========================================
// Used by getFlagHtml() in app.js to pull the right flag from FlagCDN.
// Covers all World Cup 2026 qualified teams with their ISO codes.
const teamCodes = {
    // CONCACAF (North/Central America & Caribbean)
    "Mexico": "mx",
    "USA": "us",
    "United States": "us",
    "Canada": "ca",
    "Panama": "pa",
    "Jamaica": "jm",
    "Costa Rica": "cr",
    "Honduras": "hn",
    "Haiti": "ht",
    "Curaçao": "cw",
    
    // CONMEBOL (South America)
    "Argentina": "ar",
    "Brazil": "br",
    "Uruguay": "uy",
    "Colombia": "co",
    "Chile": "cl",
    "Paraguay": "py",
    "Peru": "pe",
    "Ecuador": "ec",
    "Bolivia": "bo",
    "Venezuela": "ve",
    
    // UEFA (Europe)
    "England": "gb-eng",
    "France": "fr",
    "Germany": "de",
    "Italy": "it",
    "Spain": "es",
    "Netherlands": "nl",
    "Belgium": "be",
    "Portugal": "pt",
    "Croatia": "hr",
    "Poland": "pl",
    "Czech Republic": "cz",
    "Czechia": "cz",
    "Austria": "at",
    "Switzerland": "ch",
    "Sweden": "se",
    "Denmark": "dk",
    "Norway": "no",
    "Finland": "fi",
    "Iceland": "is",
    "Greece": "gr",
    "Romania": "ro",
    "Serbia": "rs",
    "Bosnia": "ba",
    "Bosnia-Herzegovina": "ba",
    "Slovenia": "si",
    "Slovakia": "sk",
    "Hungary": "hu",
    "Ukraine": "ua",
    "Russia": "ru",
    "Scotland": "gb-sct",
    "Wales": "gb-wls",
    "Northern Ireland": "gb-nir",
    "Georgia": "ge",
    "Kosovo": "xk",
    "Albania": "al",
    "Bulgaria": "bg",
    "Lithuania": "lt",
    "Latvia": "lv",
    "Estonia": "ee",
    "Cyprus": "cy",
    "Malta": "mt",
    "Ireland": "ie",
    "Montenegro": "me",
    "North Macedonia": "mk",
    "Turkey": "tr",
    
    // AFC (Asia)
    "Japan": "jp",
    "South Korea": "kr",
    "China PR": "cn",
    "China": "cn",
    "Iran": "ir",
    "Saudi Arabia": "sa",
    "United Arab Emirates": "ae",
    "Qatar": "qa",
    "Uzbekistan": "uz",
    "Tajikistan": "tj",
    "Thailand": "th",
    "Vietnam": "vn",
    "India": "in",
    "Australia": "au",
    "Lebanon": "lb",
    "Oman": "om",
    "Iraq": "iq",
    "Jordan": "jo",
    "Kuwait": "kw",
    "Malaysia": "my",
    "Singapore": "sg",
    "Bangladesh": "bd",
    "Nepal": "np",
    "Pakistan": "pk",
    "Indonesia": "id",
    "Philippines": "ph",
    
    // CAF (Africa)
    "Morocco": "ma",
    "South Africa": "za",
    "Egypt": "eg",
    "Ghana": "gh",
    "Nigeria": "ng",
    "Cameroon": "cm",
    "Senegal": "sn",
    "Tunisia": "tn",
    "Ivory Coast": "ci",
    "Burkina Faso": "bf",
    "Mali": "ml",
    "Guinea": "gn",
    "Mauritania": "mr",
    "Congo DR": "cd",
    "Uganda": "ug",
    "Kenya": "ke",
    "Ethiopia": "et",
    "Algeria": "dz",
    "Sudan": "sd",
    "Benin": "bj",
    "Tanzania": "tz",
    "Zimbabwe": "zw",
    "Zambia": "zm",
    "Botswana": "bw",
    "Namibia": "na",
    "Angola": "ao",
    "Mozambique": "mz",
    "Malawi": "mw",
    "Lesotho": "ls",
    "Eswatini": "sz",
    "Gabon": "ga",
    "Congo": "cg",
    "Central African Republic": "cf",
    "Liberia": "lr",
    "Sierra Leone": "sl",
    "Guinea-Bissau": "gw",
    "Cape Verde Islands": "cv",
    "Cape Verde": "cv",
    "Seychelles": "sc",
    "Madagascar": "mg",
    "Mauritius": "mu",
    "Comoros": "km",
    
    // OFC (Oceania)
    "New Zealand": "nz",
    "Fiji": "fj",
    "Solomon Islands": "sb",
    "Papua New Guinea": "pg",
    "Samoa": "ws",
    "Tahiti": "pf",
    "Vanuatu": "vu",
    "Tonga": "to",
    "Kiribati": "ki"
};

// ==========================================
// 2. SWEEPSTAKE PLAYERS & ASSIGNED TEAMS
// ==========================================
// Each player has an array of 3 teams they picked in the sweepstake. We will update these with actual team names once we fetch the data from the API
const sweepstakeData = [
    { player: "Philip", teams: ["Croatia","Uzbekistan"], status: "In Tournament" },
    { player: "Kimberley", teams: ["USA","South Korea"], status: "In Tournament" },
    { player: "Oliver", teams: ["Belgium","DR Congo"], status: "In Tournament" },
    { player: "Felix", teams: ["England","Canada"], status: "In Tournament" },
    { player: "Tabitha", teams: ["France","Turkey"], status: "In Tournament" },
    { player: "Florence", teams: ["Argentina","Egypt"], status: "In Tournament" },
    { player: "David", teams: ["Netherlands","South Africa"], status: "In Tournament" },
    { player: "Eilidh", teams: ["Spain","Czechia"], status: "In Tournament" },
    { player: "Joanne", teams: ["Colombia","Curaçao"], status: "In Tournament" },
    { player: "Tony", teams: ["Portugal","Bosnia & Herzegovina"], status: "In Tournament" },
    { player: "Em", teams: ["Brazil","Sweden"], status: "In Tournament" },
    { player: "Hannah", teams: ["Morocco","Algeria"], status: "In Tournament" },
    { player: "Caz", teams: ["Uruguay","Norway"], status: "In Tournament" },
    { player: "Maz", teams: ["Germany","Jordan"], status: "In Tournament" },
    { player: "Malcolm", teams: ["Japan","Saudi Arabia"], status: "In Tournament" },
    { player: "Frances", teams: ["Mexico","Ecuador"], status: "In Tournament" },
    { player: "David and Madge", teams: ["Senegal","Ghana"], status: "In Tournament" }
];

// ==========================================
// 3. KNOCKOUT TREE BRACKET DATA
// ==========================================
// Automatically generated from API data. Shows knockout stage matches.
let bracketData = {
    quarters: [],
    semis: [],
    final: []
};

/**
 * Builds bracket data from fetched fixtures
 * Groups matches by stage: quarter-finals, semi-finals, final
 */
function generateBracketFromMatches(matches) {
    const quarters = [];
    const semis = [];
    const final = [];

    matches.forEach(m => {
        // Parse the match string (e.g., "Germany vs Argentina")
        const teams = m.match.split(" vs ");
        const team1 = teams[0] ? teams[0].trim() : "TBD";
        const team2 = teams[1] ? teams[1].trim() : "TBD";

        // Parse score - format is either "TBD" or "X - Y"
        let score1 = "TBD";
        let score2 = "TBD";
        if (m.score && m.score !== "TBD") {
            const scoreParts = m.score.split(" - ");
            if (scoreParts.length === 2) {
                score1 = scoreParts[0].trim();
                score2 = scoreParts[1].trim();
            }
        }

        const matchupObj = { team1, score1, team2, score2 };

        // Categorize by stage based on date proximity to tournament end
        // Typically: QF (Day 1), SF (Day 2), Final (Day 3)
        if (m.status === 'Finished' || m.status === 'Live' || m.score !== "TBD") {
            // If match has a result, determine stage by number of remaining matches
            if (final.length === 0 && quarters.length >= 4) {
                semis.push(matchupObj);
            } else if (final.length === 0 && semis.length >= 2) {
                final.push(matchupObj);
            } else {
                quarters.push(matchupObj);
            }
        } else {
            // Not played yet - add to stages sequentially
            if (quarters.length < 4) {
                quarters.push(matchupObj);
            } else if (semis.length < 2) {
                semis.push(matchupObj);
            } else {
                final.push(matchupObj);
            }
        }
    });

    // Ensure we always have placeholder slots for all rounds
    while (quarters.length < 4) {
        quarters.push({ team1: "TBD", score1: "TBD", team2: "TBD", score2: "TBD" });
    }
    while (semis.length < 2) {
        semis.push({ team1: "TBD", score1: "TBD", team2: "TBD", score2: "TBD" });
    }
    while (final.length < 1) {
        final.push({ team1: "TBD", score1: "TBD", team2: "TBD", score2: "TBD" });
    }

    bracketData = {
        quarters: quarters.slice(0, 4),
        semis: semis.slice(0, 2),
        final: final.slice(0, 1)
    };
}

// ==========================================
// 4. CUSTOM SQUAD ROSTERS
// ==========================================
// Displayed when someone clicks on a country name.
const squadsData = {
    "Mexico": [
        "Manager: Javier Aguirre",
        "Santiago Giménez (Forward)",
        "Edson Álvarez (Midfielder)",
        "Guillermo Ochoa (Goalkeeper)"
    ],
    "South Africa": [
        "Manager: Hugo Broos",
        "Ronwen Williams (Goalkeeper)",
        "Percy Tau (Forward)"
    ],
    "England": [
        "Manager: Thomas Tuchel",
        "Harry Kane (Forward)",
        "Jude Bellingham (Midfielder)",
        "Bukayo Saka (Forward)"
    ],
    "USA": [
        "Manager: Mauricio Pochettino",
        "Christian Pulisic (Forward)",
        "Weston McKennie (Midfielder)"
    ],
    "Argentina": [
        "Manager: Lionel Scaloni",
        "Lionel Messi (Forward)",
        "Lautaro Martínez (Forward)"
    ]
};
