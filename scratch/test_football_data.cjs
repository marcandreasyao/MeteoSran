// Using native global fetch
async function test() {
    const token = 'b0a3470545854e26954d3d8f175e7f48';
    const url = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';
    try {
        const res = await fetch(url, {
            headers: { 'X-Auth-Token': token }
        });
        const json = await res.json();
        if (json.matches) {
            console.log('Total matches:', json.matches.length);
            const statuses = {};
            json.matches.forEach(m => {
                statuses[m.status] = (statuses[m.status] || 0) + 1;
            });
            console.log('Match Statuses in API:', statuses);

            const activeOrFinished = json.matches.filter(m => m.status !== 'TIMED' && m.status !== 'SCHEDULED');
            console.log('Active/Finished matches in API:', activeOrFinished.map(m => ({
                id: m.id,
                home: m.homeTeam.name,
                away: m.awayTeam.name,
                status: m.status,
                score: m.score,
                date: m.utcDate
            })));
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
