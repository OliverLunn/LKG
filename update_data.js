// update_data.js
// Fetches live tournament data from football-data.org, normalises team names,
// and writes `live-data.json`. Includes retry logic for rate limits and
// sensible error handling for CI usage (GitHub Actions).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_BASE = 'https://api.football-data.org/v4';
const COMP_CODE = process.env.COMP_CODE || 'WC'; // update if football-data.org uses a different code
const API_KEY = process.env.FOOTBALL_API_KEY;

if (!API_KEY) {
    console.error('Missing FOOTBALL_API_KEY environment variable. Aborting.');
    process.exit(1);
}

const TEAM_NAME_MAP = {
    'Korea Republic': 'South Korea',
    'USA': 'USA',
    'United States of America': 'United States',
    'DR Congo': 'Congo DR',
    'Côte d\'Ivoire': 'Ivory Coast',
    // add more mappings as required
};

async function fetchWithRetry(url, options = {}, retries = 5, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.status === 429) {
                const retryAfter = res.headers.get('Retry-After');
                const wait = retryAfter ? parseInt(retryAfter, 10) * 1000 : backoff * (i + 1);
                console.warn(`Rate limited. Waiting ${wait}ms before retrying...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            if (res.status >= 500) {
                const wait = backoff * (i + 1);
                console.warn(`Server error ${res.status}. Retrying in ${wait}ms...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            if (!res.ok) {
                const body = await res.text();
                throw new Error(`HTTP ${res.status}: ${body}`);
            }
            return await res.json();
        } catch (err) {
            if (i === retries - 1) throw err;
            const wait = backoff * (i + 1);
            console.warn(`Fetch failed (${err.message}). Retrying in ${wait}ms...`);
            await new Promise(r => setTimeout(r, wait));
        }
    }
}

function normaliseTeamName(name) {
    if (!name) return name;
    if (TEAM_NAME_MAP[name]) return TEAM_NAME_MAP[name];
    // common normalisations
    if (name === 'Korea Republic') return 'South Korea';
    return name;
}

function mapMatchToFixture(m) {
    const home = normaliseTeamName(m.homeTeam?.name || (m.homeTeam && m.homeTeam));
    const away = normaliseTeamName(m.awayTeam?.name || (m.awayTeam && m.awayTeam));
    const date = m.utcDate ? m.utcDate.split('T')[0] : (m.matchdayDate || m.date || 'TBD');
    let score = 'TBD';
    if (m.score && typeof m.score === 'object' && m.score.fullTime) {
        const s1 = m.score.fullTime.home ?? m.score.fullTime.home ?? null;
        const s2 = m.score.fullTime.away ?? m.score.fullTime.away ?? null;
        if (s1 !== null && s2 !== null) score = `${s1} - ${s2}`;
    }
    const status = m.status || (m.score && m.score !== 'TBD' ? 'Finished' : 'Scheduled');
    return { match: `${home} vs ${away}`, date, score, status };
}

async function buildLiveData() {
    const headers = { 'X-Auth-Token': API_KEY };

    // 1) Matches
    const matchesUrl = `${API_BASE}/competitions/${COMP_CODE}/matches`;
    const matchesPayload = await fetchWithRetry(matchesUrl, { headers });
    const matches = (matchesPayload.matches || []).map(m => {
        // football-data.org v4 presents homeTeam/awayTeam objects
        const home = m.homeTeam?.name || (m.homeTeam && m.homeTeam);
        const away = m.awayTeam?.name || (m.awayTeam && m.awayTeam);
        return mapMatchToFixture({ homeTeam: { name: home }, awayTeam: { name: away }, utcDate: m.utcDate, score: m.score, status: m.status });
    });

    // 2) Standings (groups)
    const standingsUrl = `${API_BASE}/competitions/${COMP_CODE}/standings`;
    let groupsData = {};
    try {
        const standingsPayload = await fetchWithRetry(standingsUrl, { headers });
        if (standingsPayload && Array.isArray(standingsPayload.standings)) {
            standingsPayload.standings.forEach(section => {
                if (section.type === 'GROUP' && Array.isArray(section.table)) {
                    const groupName = section.group || section.stage || `Group ${section.group}`;
                    groupsData[groupName] = section.table.map(t => ({
                        team: normaliseTeamName(t.team?.name || t.team),
                        pts: t.points ?? t.pts ?? 0,
                        gd: (t.goalDifference ?? t.goalsFor ?? 0) - (t.goalsAgainst ?? 0)
                    }));
                }
            });
        }
    } catch (err) {
        console.warn('Could not fetch standings:', err.message);
    }

    // 3) Scorers
    const scorersUrl = `${API_BASE}/competitions/${COMP_CODE}/scorers`;
    let scorersData = [];
    try {
        const scorersPayload = await fetchWithRetry(scorersUrl, { headers });
        if (scorersPayload && Array.isArray(scorersPayload.scorers)) {
            scorersData = scorersPayload.scorers.map(s => ({
                name: s.player?.name || s.player,
                team: normaliseTeamName(s.team?.name || s.team),
                goals: s.numberOfGoals ?? s.goals ?? 0,
                photo: s.player?.photo || null
            }));
        }
    } catch (err) {
        console.warn('Could not fetch scorers:', err.message);
    }

    return { fixturesData: matches, groupsData, scorersData };
}

async function main() {
    try {
        const liveData = await buildLiveData();
        const outPath = path.join(process.cwd(), 'live-data.json');
        const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : null;
        const newContent = JSON.stringify(liveData, null, 2) + '\n';

        if (JSON.stringify(existing) !== JSON.stringify(liveData)) {
            fs.writeFileSync(outPath, newContent, 'utf8');
            console.log('Wrote updated live-data.json');
            // Git commit/push handled by CI workflow
        } else {
            console.log('No changes detected for live-data.json');
        }
    } catch (err) {
        console.error('Failed to update live data:', err);
        process.exit(1);
    }
}

// Node 18+ has global fetch; if not available, fail early with instructions
if (typeof fetch === 'undefined') {
    console.error('This script requires Node 18+ (global fetch). Please run with Node 18 or later.');
    process.exit(1);
}

main();
const fs = require('fs');

const API_KEY = process.env.FOOTBALL_API_KEY;
const COMP_CODE = 'WC'; // FIFA World Cup Identifier

async function fetchLiveWorldCupData() {
    try {
        console.log("Fetching latest matches and tables...");
        
        // 1. Fetch Master Fixture List
        const matchRes = await fetch(`https://api.football-data.org/v4/competitions/${COMP_CODE}/matches`, {
            headers: { 'X-Auth-Token': API_KEY }
        });
        const matchData = await matchRes.json();

        // 2. Fetch Live Group Standings
        const tableRes = await fetch(`https://api.football-data.org/v4/competitions/${COMP_CODE}/standings`, {
            headers: { 'X-Auth-Token': API_KEY }
        });
        const tableData = await tableRes.json();

        // 3. Fetch Scorers (Top Goal Scorers)
        let scorersData = [];
        try {
            const scorersRes = await fetch(`https://api.football-data.org/v4/competitions/${COMP_CODE}/scorers`, {
                headers: { 'X-Auth-Token': API_KEY }
            });
            const scorersRawData = await scorersRes.json();
            scorersData = (scorersRawData.scorers || []).slice(0, 10).map(s => ({
                name: s.player.name,
                goals: s.goals,
                team: s.team.name,
                photo: s.player.photo || null
            }));
        } catch (err) {
            console.warn("Could not fetch scorers data:", err.message);
        }

        // 4. Translate API Matches into your website's exact format
        const fixturesData = matchData.matches.map(m => {
            const dateObj = new Date(m.utcDate);
            const localizedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const ukTime = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
            
            let scoreStr = "TBD";
            if (m.score.fullTime.home !== null) {
                scoreStr = `${m.score.fullTime.home} - ${m.score.fullTime.away}`;
            }

            return {
                date: localizedDate,
                utcDate: m.utcDate,
                time: ukTime,
                match: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
                score: scoreStr,
                status: m.status === 'FINISHED' ? 'Finished' : m.status === 'IN_PLAY' ? 'Live' : 'Scheduled'
            };
        });

        // 5. Translate API Standings into your website's exact group format
        const groupsData = {};
        tableData.standings.forEach(grp => {
            const groupName = grp.group.replace('_', ' '); // Converted from GROUP_A to GROUP A
            groupsData[groupName] = grp.table.map(t => ({
                team: t.team.name,
                pld: t.playedGames,
                gd: t.goalDifference,
                pts: t.points
            }));
        });

        // 6. Compile everything into a single payload file
        const finalPayload = {
            fixturesData,
            groupsData,
            scorersData,
            lastUpdated: new Date().toUTCString()
        };

        fs.writeFileSync('./live-data.json', JSON.stringify(finalPayload, null, 2));
        console.log("Successfully generated fresh live-data.json!");

    } catch (error) {
        console.error("Automation error compiling data sets:", error);
        process.exit(1);
    }
}

fetchLiveWorldCupData();