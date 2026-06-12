const fs = require('fs');

const API_KEY = process.env.FOOTBALL_API_KEY;
const PL_COMP_CODE = 'PL'; // Premier League

async function fetchPremierLeagueScorers() {
    try {
        console.log("Fetching Premier League top scorers...");
        
        // Fetch Scorers (Top Goal Scorers)
        const scorersRes = await fetch(`https://api.football-data.org/v4/competitions/${PL_COMP_CODE}/scorers`, {
            headers: { 'X-Auth-Token': API_KEY }
        });
        
        if (!scorersRes.ok) {
            throw new Error(`Failed to fetch: ${scorersRes.status}`);
        }
        
        const scorersRawData = await scorersRes.json();
        const scorersData = (scorersRawData.scorers || []).slice(0, 10).map(s => ({
            name: s.player.name,
            goals: s.goals,
            team: s.team.name,
            photo: s.player.photo || null
        }));

        console.log("Fetched scorers:", JSON.stringify(scorersData, null, 2));

        // Create test live-data.json with scorers
        const testData = {
            fixturesData: [],
            groupsData: {},
            scorersData: scorersData,
            lastUpdated: new Date().toUTCString()
        };

        fs.writeFileSync('./live-data.json', JSON.stringify(testData, null, 2));
        console.log("Successfully generated test live-data.json with Premier League scorers!");

    } catch (error) {
        console.error("Error fetching Premier League data:", error);
        process.exit(1);
    }
}

fetchPremierLeagueScorers();
