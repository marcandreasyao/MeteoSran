import { retrieveGraphContext } from '../server/graphService.js';

async function run() {
    const queryText = "je veux tous les groupes en phase de pool";
    const context = await retrieveGraphContext(queryText);
    console.log(context.substring(0, 500));
}
run();
