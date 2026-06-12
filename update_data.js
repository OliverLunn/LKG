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
