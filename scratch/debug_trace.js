import { getAllMatches, getGroupStandings } from '../server/matchService.js';

const GROUP_PATTERN = /(?:group|groupe)\s*([a-z])/i;

async function run() {
    const queryText = "je veux tous les groupes en phase de pool";
    const queryLower = queryText.toLowerCase();
    const allMatches = await getAllMatches();
    const allGroups = [...new Set(allMatches.map(m => m.group))];
    
    console.log("allGroups:", allGroups);
    
    const mentionedGroups = new Set();
    const groupMatch = queryLower.match(GROUP_PATTERN);
    console.log("groupMatch:", groupMatch);
    if (groupMatch) {
        mentionedGroups.add(`Group ${groupMatch[1].toUpperCase()}`);
    }
    
    for (const g of allGroups) {
        if (queryLower.includes(g.toLowerCase())) {
            mentionedGroups.add(g);
        }
    }
    console.log("mentionedGroups:", Array.from(mentionedGroups));
}
run();
