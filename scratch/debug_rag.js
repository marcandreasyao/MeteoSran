import { retrieveGraphContext } from '../server/graphService.js';

async function run() {
    const context = await retrieveGraphContext("je veux tous les groupes en phase de pool");
    console.log(context);
}
run();
