// =========================================================================
// 1. GLOBAL VARIABLES & ACCESSIBILITY PLACEHOLDERS
// =========================================================================
let fixturesData = [];
let groupsData = {};
let scorersData = [];
let globalSquadsData = null;      
let currentDashboardTab = 'sweepstake'; 

// =========================================================================
// 2. RENDERING ENGINES (HTML GENERATORS)
// =========================================================================

function getFlagHtml(teamName) {
    const code = teamCodes[teamName];
    if (!code) return ''; 
    return `<img src="https://flagcdn.com/24x18/${code}.png" class="flag-icon" alt="${teamName} flag">`;
}

function getMatchGroup(team1, team2) {
    for (const [groupName, teams] of Object.entries(groupsData)) {
        const teamNames = teams.map(t => t.team);
        if (teamNames.includes(team1) && teamNames.includes(team2)) {
            return groupName;
        }
    }
    return 'Knockout Stage';
}

function renderBracket() {
    const bracketContainer = document.getElementById('bracket-container');
    if (!bracketContainer) return;
    
    const createMatchupHtml = (m) => `
        <div class="bracket-matchup">
            <div class="bracket-team-row">
                <span class="team-link" onclick="showTeamDetail('${m.team1}')">${getFlagHtml(m.team1)} ${m.team1}</span>
                <span class="bracket-score-box">${m.score1}</span>
            </div>
            <div class="bracket-team-row">
                <span class="team-link" onclick="showTeamDetail('${m.team2}')">${getFlagHtml(m.team2)} ${m.team2}</span>
                <span class="bracket-score-box">${m.score2}</span>
            </div>
        </div>
    `;

    bracketContainer.innerHTML = `
        <div class="bracket-round">
            <h4>Quarter-Finals</h4>
            ${bracketData.quarters.map(createMatchupHtml).join('')}
        </div>
        <div class="bracket-round">
            <h4>Semi-Finals</h4>
            ${bracketData.semis.map(createMatchupHtml).join('')}
        </div>
        <div class="bracket-round">
            <h4>World Cup Final</h4>
            ${bracketData.final.map(createMatchupHtml).join('')}
        </div>
    `;
}

function renderSquadCards() {
    const container = document.getElementById('squad-cards-container');
    if (!container) return;

    let activeTeams = [];
    if (globalSquadsData) {
        activeTeams = Object.keys(globalSquadsData);
    } else if (groupsData && Object.keys(groupsData).length > 0) {
        Object.values(groupsData).forEach(group => {
            group.forEach(row => activeTeams.push(row.team));
        });
    } else {
        activeTeams = Object.keys(teamCodes);
    }

    activeTeams = [...new Set(activeTeams)].filter(t => t !== "TBD" && t !== "USA").sort();
    if (!activeTeams.includes("United States") && teamCodes["United States"]) activeTeams.push("United States");
    activeTeams.sort();

    container.innerHTML = activeTeams.map(nation => `
        <div class="squad-card" onclick="showTeamDetail('${nation.replace(/'/g, "\\'")}')">
            ${getFlagHtml(nation)}
            <h3>${nation}</h3>
            <span class="view-roster-link">View Squad Roster →</span>
        </div>
    `).join('');
}

function renderApp() {
    const sweepstakeDiv = document.getElementById('sweepstake-list');
    if (sweepstakeDiv) {
        sweepstakeDiv.innerHTML = sweepstakeData.map(p => `
            <div class="sweepstake-card">
                <div class="player-name">${p.player}</div>
                <div class="player-teams">
                    ${(p.teams || []).map(team => `
                        <div class="team-item" onclick="this.textContent.trim() !== 'TBD' && showTeamDetail('${team}')">
                            ${getFlagHtml(team)}
                            <span>${team}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="player-status">${p.status}</div>
            </div>
        `).join('');
    }

    const fixturesDiv = document.getElementById('fixtures-list');
    if (fixturesDiv) {
        const sortedFixtures = [...fixturesData].sort((a, b) => new Date(a.utcDate || a.date) - new Date(b.utcDate || b.date));
        const groupedByDate = {};
        sortedFixtures.forEach(f => {
            if (!groupedByDate[f.date]) groupedByDate[f.date] = [];
            groupedByDate[f.date].push(f);
        });

        fixturesDiv.innerHTML = Object.keys(groupedByDate).map(dateKey => `
            <div class="fixture-date-group">
                <div class="fixture-date-header"><h3>${dateKey}</h3></div>
                <div class="fixture-matches">
                    ${groupedByDate[dateKey].map(f => {
                        const teams = f.match.split(" vs ");
                        const team1 = teams[0].trim();
                        const team2 = teams[1].trim();
                        const matchGroup = getMatchGroup(team1, team2);
                        
                        let statusBadge = f.status === 'Finished' ? '✓ Complete' : (f.status === 'Live' || f.status === 'IN_PLAY' ? '● Live' : '○ Scheduled');
                        let statusClass = f.status === 'Finished' ? 'status-complete' : (f.status === 'Live' || f.status === 'IN_PLAY' ? 'status-live' : 'status-scheduled');
                        
                        return `
                            <div class="fixture-card">
                                <div class="fixture-header"><span class="fixture-status ${statusClass}">${statusBadge}</span></div>
                                <div class="fixture-teams">
                                    <span class="team-link" onclick="showTeamDetail('${team1}')">${getFlagHtml(team1)} ${team1}</span> 
                                    <span>vs</span> 
                                    <span class="team-link" onclick="showTeamDetail('${team2}')">${getFlagHtml(team2)} ${team2}</span>
                                </div>
                                <div class="fixture-group">${matchGroup}</div>
                                <div class="fixture-score">${f.score}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');
    }

    const groupsDiv = document.getElementById('groups-list');
    if (groupsDiv) {
        groupsDiv.innerHTML = Object.keys(groupsData).map(groupKey => `
            <div class="group-table">
                <h3>${groupKey}</h3>
                <div>
                    ${groupsData[groupKey].map(t => `
                        <div class="group-row">
                            <span class="team-link" onclick="showTeamDetail('${t.team}')">${getFlagHtml(t.team)} ${t.team}</span>
                            <span><strong>Pts: ${t.pts}</strong> (GD: ${t.gd})</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    renderBracket();

    const scorersDiv = document.getElementById('scorers-leaderboard');
    if (scorersDiv) {
        if (scorersData && scorersData.length > 0) {
            scorersDiv.innerHTML = `
                <h3>🏆 Top Goalscorers</h3>
                <div class="scorers-grid">
                    ${scorersData.map((scorer, index) => `
                        <div class="scorer-card">
                            <div class="scorer-rank">#${index + 1}</div>
                            <div class="scorer-name">${scorer.name}</div>
                            <div class="scorer-team">${scorer.team}</div>
                            <div class="scorer-goals">${scorer.goals} Goals</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            scorersDiv.innerHTML = '<p>Top scorers data coming soon...</p>';
        }
    }

    renderSquadCards();
}

// =========================================================================
// 3. NAVIGATION VIEW CONTROLLERS
// =========================================================================

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-content'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    const targetElement = document.getElementById(tabId);
    if (targetElement) {
        targetElement.classList.add('active-content');
    }
    if (tabId !== 'team-detail') {
        currentDashboardTab = tabId;
    }
    
    const targetButton = Array.from(document.querySelectorAll('.tab-btn'))
        .find(btn => btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabId}'`));
    if (targetButton) {
        targetButton.classList.add('active');
    }
}

function showTeamDetail(teamName) {
    if (teamName === "TBD" || !teamName) return; 

    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-content'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById('team-detail').classList.add('active-content');
    document.getElementById('team-title').innerHTML = `${getFlagHtml(teamName)} ${teamName}`;
    
    const teamFixtures = fixturesData.filter(f => f.match.includes(teamName));
    const fixturesDiv = document.getElementById('team-fixtures-list');
    
    if (teamFixtures.length > 0) {
        fixturesDiv.innerHTML = teamFixtures.map(f => {
            const teams = f.match.split(" vs ");
            return `
                <div class="fixture-card">
                    <div class="fixture-date">${f.date}</div>
                    <div class="fixture-teams">
                        <span class="team-link" onclick="showTeamDetail('${teams[0].trim()}')">${getFlagHtml(teams[0].trim())} ${teams[0].trim()}</span> 
                        vs 
                        <span class="team-link" onclick="showTeamDetail('${teams[1].trim()}')">${getFlagHtml(teams[1].trim())} ${teams[1].trim()}</span>
                    </div>
                    <div class="fixture-score">${f.score}</div>
                </div>
            `;
        }).join('');
    } else {
        fixturesDiv.innerHTML = "<p>No matches discovered for this team layout records.</p>";
    }
    
    const squadUl = document.getElementById('team-squad-list');
    if (globalSquadsData && globalSquadsData[teamName]) {
        const players = globalSquadsData[teamName];
        const positions = { 'Goalkeepers': [], 'Defenders': [], 'Midfielders': [], 'Forwards': [] };

        players.forEach(p => {
            const posRaw = (p.position || "").toLowerCase();
            let listKey = 'Forwards';
            if (posRaw.includes('gk') || posRaw.includes('goalkeeper')) listKey = 'Goalkeepers';
            else if (posRaw.includes('df') || posRaw.includes('defender')) listKey = 'Defenders';
            else if (posRaw.includes('mf') || posRaw.includes('midfielder')) listKey = 'Midfielders';
            positions[listKey].push(p);
        });

        squadUl.innerHTML = `
            <div class="position-group-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; width: 100%;">
                ${Object.keys(positions).map(posName => {
                    if (positions[posName].length === 0) return '';
                    return `
                        <div class="position-block" style="background: #f8fafc; border-radius: 8px; padding: 12px; border: 1px solid #e2e8f0;">
                            <h4 style="color: #004b87; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em;">${posName}</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                ${positions[posName].map(p => {
                                    const clubInfo = p.club ? `<span style="color: #a0aec0; font-size: 0.75rem; display: block; font-style: italic;">${p.club}</span>` : '';
                                    return `
                                        <li style="padding: 5px 0; font-size: 0.9rem; border-bottom: 1px solid #edf2f7;">
                                            <strong>${p.player}</strong>
                                            ${clubInfo}
                                        </li>
                                    `;
                                }).join('')}
                            </ul>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else {
        const assignedSquad = typeof squadsData !== 'undefined' ? squadsData[teamName] : null;
        if (assignedSquad && assignedSquad.length > 0) {
            squadUl.innerHTML = `<ul style="padding-left: 20px;">${assignedSquad.map(player => `<li>${player}</li>`).join('')}</ul>`;
        } else {
            squadUl.innerHTML = "<p>Squad specification list pending data load configurations...</p>";
        }
    }
}

function closeTeamDetail() {
    openTab(currentDashboardTab);
}

// =========================================================================
// 4. PIPELINE INITIALIZATION ENGINE (INTEGRATED REPO JSON DETECTOR)
// =========================================================================

async function initApp() {
    // Pipeline 1: Check repository for a committed draw-results.json file
    try {
        const drawResponse = await fetch('./draw-results.json');
        if (drawResponse.ok) {
            const savedDraw = await drawResponse.json();
            
            // If the array contains live records, inject them over the default placeholders
            if (Array.isArray(savedDraw) && savedDraw.length > 0) {
                console.log(" Permanent repo draw results loaded successfully!");
                
                savedDraw.forEach((savedPlayer) => {
                    const match = sweepstakeData.find(p => p.player.trim().toLowerCase() === savedPlayer.player.trim().toLowerCase());
                    if (match) {
                        match.teams = savedPlayer.teams;
                    }
                });

                // Clear input interfaces since the draw is permanently complete
                const passwordInput = document.getElementById('draw-password');
                const startBtn = document.getElementById('start-draw-btn');
                const completeMsg = document.getElementById('draw-complete-message');
                
                if (passwordInput && startBtn) {
                    passwordInput.style.display = 'none';
                    startBtn.style.display = 'none';
                }
                if (completeMsg) {
                    completeMsg.style.display = 'block';
                }
            }
        }
    } catch (e) {
        console.log("No committed draw data discovered in repository. Standby mode active.");
    }

    // Pipeline 2: Fetch Live Matches, Table Data & Brackets
    try {
        const response = await fetch('./live-data.json');
        if (!response.ok) throw new Error(`HTTP response status: ${response.status}`);
        const liveData = await response.json();

        fixturesData = liveData.fixturesData || [];
        groupsData = liveData.groupsData || {};
        scorersData = liveData.scorersData || [];

        const knockoutMatches = fixturesData.filter(m => 
            m.match.includes('Quarter') || m.match.includes('Semi') || m.match.includes('Final')
        );
        if (typeof generateBracketFromMatches === 'function') {
            generateBracketFromMatches(knockoutMatches.length > 0 ? knockoutMatches : fixturesData.slice(-8));
        }
    } catch (err) {
        console.error("⚠️ Failed loading dynamic fixture feeds:", err);
    }

    // Pipeline 3: Fetch Squad Rosters
    try {
        const squadsResponse = await fetch('./squads.json');
        if (squadsResponse.ok) {
            globalSquadsData = await squadsResponse.json();
        }
    } catch (squadsErr) {
        console.error("⚠️ Failed loading rosters:", squadsErr);
    }

    renderApp();
}

// =========================================================================
// 5. DETACHED POPUP DRAW ENGINE & SYNCHRONIZATION
// =========================================================================

let drawState = {
    drawInProgress: false,
    drawPassword: "wc2026" 
};

async function startDraw() {
    const startBtn = document.getElementById('start-draw-btn');
    const passwordInput = document.getElementById('draw-password');
    
    if (!startBtn || drawState.drawInProgress) return;

    if (!passwordInput || passwordInput.value !== drawState.drawPassword) {
        alert('❌ Incorrect password. Please enter the correct password to start the draw.');
        if (passwordInput) {
            passwordInput.focus();
            passwordInput.value = '';
        }
        return;
    }

    const width = 600;
    const height = 550;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    const popup = window.open(
        '', 
        'SweepstakeDrawPopup', 
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,location=no`
    );

    if (!popup) {
        alert('⚠️ Popup block detected! Please allow popups for this dashboard site to run the live draw window.');
        return;
    }

    popup.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>🔴 LIVE DRAW</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                    background-color: #f1f5f9; 
                    color: #1e293b; 
                    padding: 40px 20px; 
                    margin: 0; 
                    text-align: center; 
                }
                h1 { 
                    color: #004b87; 
                    margin-bottom: 30px; 
                    text-transform: uppercase; 
                    font-size: 1.6rem;
                    letter-spacing: 0.5px;
                }
                
                /* Main Website Dashboard Style Synchronization */
                .active-draw-container {
                    margin: 0 auto 25px auto;
                    max-width: 420px;
                    display: flex;
                    justify-content: center;
                }
                .sweepstake-card {
                    background: #ffffff;
                    border: 2px solid #004b87;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0, 75, 135, 0.12);
                    padding: 30px;
                    width: 100%;
                    text-align: left;
                    box-sizing: border-box;
                }
                .player-name {
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: #004b87;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 12px;
                    text-align: center;
                }
                .player-teams {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .pot-section {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .pot-header {
                    font-size: 0.8rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                }
                .team-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 1.15rem;
                    animation: fadeIn 0.4s ease forwards;
                }
                .flag-icon {
                    width: 24px;
                    height: 18px;
                    object-fit: cover;
                    border-radius: 2px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                .status-ticker {
                    font-size: 1.05rem;
                    font-weight: bold;
                    color: #2563eb;
                    margin-top: 5px;
                    min-height: 24px;
                }
                
                .action-btn { 
                    margin-top: 20px; 
                    padding: 14px 32px; 
                    font-size: 1rem;
                    font-weight: bold; 
                    background: #10b981; 
                    color: white; 
                    border: none; 
                    border-radius: 24px; 
                    cursor: pointer; 
                    display: none; 
                    text-transform: uppercase;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
        </head>
        <body>
            <h1>Sweepstake Draw</h1>
            
            <div class="active-draw-container">
                <div class="sweepstake-card">
                    <div id="card-player-name" class="player-name">Connecting...</div>
                    <div class="player-teams">
                        
                        <div class="pot-section">
                            <div class="pot-header">Pot 1</div>
                            <div id="pot1-slot-container"></div>
                        </div>
                        
                        <div class="pot-section">
                            <div class="pot-header">Pot 2</div>
                            <div id="pot2-slot-container"></div>
                        </div>

                    </div>
                </div>
            </div>
            
            <div id="draw-ticker" class="status-ticker">Beginning the draw.</div>
            <button id="close-frame-btn" class="action-btn" onclick="window.close()">Save Draw & Close</button>
        </body>
        </html>
    `);

    const isolatedEngineScript = `
        (async function() {
            const currentPlayers = ${JSON.stringify(sweepstakeData)};
            const teamCodesMap = ${JSON.stringify(teamCodes)};
            
            const cardName = document.getElementById('card-player-name');
            const pot1Container = document.getElementById('pot1-slot-container');
            const pot2Container = document.getElementById('pot2-slot-container');
            const drawTicker = document.getElementById('draw-ticker');
            
            function getFlag(teamName) {
                const code = teamCodesMap[teamName];
                if (!code) return ''; 
                return '<img src="https://flagcdn.com/24x18/' + code + '.png" class="flag-icon" alt="">';
            }

            function shuffle(sourceArr) {
                const arr = [...sourceArr];
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
            }

            const pot1Teams = ["France", "Spain", "Argentina", "England", "Portugal", "Brazil", 
            "Netherlands", "Morocco", "Belgium", "Germany", "Croatia", "Colombia", "Senegal", 
            "Mexico", "USA", "Uruguay", "Japan", "Switzerland"];
            
            const pot2Teams = ["Canada", "Norway", "Scotland", "Austria", "Bosnia & Herzegovina", 
            "Sweden", "Turkey", "Czechia", "Algeria", "Cape Verde", "DR Congo", "Egypt", "Ghana", 
            "Ivory Coast", "South Africa", "Australia", "Iran", "Iraq", "Jordan", "Qatar", "Saudi Arabia", 
            "South Korea", "Uzbekistan", "Ecuador", "Paraguay", "Panama", "Haiti", "Curaçao", "New Zealand"];

            let pot1 = shuffle(pot1Teams);
            let pot2 = shuffle(pot2Teams);

            await new Promise(r => setTimeout(r, 1500));

            for (let i = 0; i < currentPlayers.length; i++) {
                let p = currentPlayers[i];
                
                // Refresh Visual Card Container States for Next Player
                cardName.textContent = p.player;
                pot1Container.innerHTML = '<div style="color: #94a3b8; font-style: italic; font-size: 0.95rem; padding: 10px;">Selecting...</div>';
                pot2Container.innerHTML = '<div style="color: #94a3b8; font-style: italic; font-size: 0.95rem; padding: 10px;">Waiting...</div>';
                
                drawTicker.style.color = "#000000";
                drawTicker.textContent = "Drawing from Pot 1...";
                await new Promise(r => setTimeout(r, 800));
                
                // 1. Core Pot 1 Reveal Injection
                let t1 = pot1.shift();
                p.teams[0] = t1;
                pot1Container.innerHTML = '<div class="team-item">' + getFlag(t1) + '<span>' + t1 + '</span></div>';
                
                // DELAY 2 SECONDS BEFORE POT 2 ACCORDING TO TIMING CONFIGS
                drawTicker.textContent = "Pot 1 assigned. Drawing from Pot 2...";
                await new Promise(r => setTimeout(r, 2000));

                // 2. Core Pot 2 Reveal Injection
                drawTicker.textContent = "Drawing from Pot 2...";
                let t2 = pot2.shift();
                p.teams[1] = t2;
                pot2Container.innerHTML = '<div class="team-item">' + getFlag(t2) + '<span>' + t2 + '</span></div>';

                // DELAY 5 SECONDS BETWEEN ROTATING PLAYERS UNLESS WE ARE ON THE LAST ITEM
                if (i < currentPlayers.length - 1) {
                    drawTicker.style.color = "#475569";
                    let countdown = 5;
                    while (countdown > 0) {
                        drawTicker.textContent = "Next player in " + countdown + "s...";
                        await new Promise(r => setTimeout(r, 1000));
                        countdown--;
                    }
                }
            }

            cardName.textContent = "DRAW COMPLETE";
            drawTicker.style.color = "#000000";
            drawTicker.textContent = "Draw Complete.";
            
            window.opener.updateMainFromPopup(currentPlayers);
            document.getElementById('close-frame-btn').style.display = 'inline-block';
        })();
    `;

    const tagNode = popup.document.createElement('script');
    tagNode.text = isolatedEngineScript;
    popup.document.body.appendChild(tagNode);
}


function updateMainFromPopup(completedDrawData) {
    // Update local variable instances
    completedDrawData.forEach((result, idx) => {
        if (sweepstakeData[idx]) {
            sweepstakeData[idx].teams = result.teams;
        }
    });

    // Trigger immediate browser compilation file download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(completedDrawData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "draw-results.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    // Toggle main site controls
    const passwordInput = document.getElementById('draw-password');
    const startBtn = document.getElementById('start-draw-btn');
    const completeMsg = document.getElementById('draw-complete-message');

    if (passwordInput && startBtn) {
        passwordInput.style.display = 'none';
        startBtn.style.display = 'none';
    }
    if (completeMsg) {
        completeMsg.style.display = 'block';
    }

    renderApp();
}

/**
 * Fallback handler allowing manual result extraction if needed
 */
function downloadDrawResults() {
    // Create simple text format for WhatsApp
    let textContent = ``;
    
    sweepstakeData.forEach((participant) => {
        textContent += `${participant.player}\n`;
        
        // Add assigned teams
        if (participant.teams && participant.teams.length > 0) {
            participant.teams.forEach(team => {
                textContent += `${team}\n`;
            });
        }
        
        textContent += `\n`;
    });
    
    // Download as text file
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent));
    element.setAttribute('download', `WorldCup2026_Draw_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// =========================================================================
// 6. PAGE INITIALIZATION LISTENERS
// =========================================================================
window.onload = function() {
    initApp();
};