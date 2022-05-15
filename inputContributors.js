import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { encodeAddress, decodeAddress } from '@polkadot/util-crypto'
const path = require('path');
const fs = require('fs');

// read contributor list from contributorslist.json
const configpath = path.join(__dirname, './contributorlist.json');
const configJson = fs.readFileSync(configpath, 'utf-8');
const ctrlist = JSON.parse(configJson);

const wsProvider = new WsProvider('ws://127.0.0.1:8844');
const api = await ApiPromise.create({ provider: wsProvider });

const keyring = new Keyring({ type: 'sr25519' });
const PHRASE = 'your password phrase';

// max contributor list size is 5
const chunk = 5;
// utility call batch is 5
const utilityCallChunk = 5;

// get all the contributors info
const contributors = ctrlist.contributions;

// In here we just batch the calls.
let total_length = 0;
let i, j, temporary;
const rewardTxs = [];
for (i = 0, j = contributors.length; i < j; i += chunk) {
    temporary = contributors.slice(i, i + chunk);
    let reward_vec = [];
    for (var k = 0; k < temporary.length; k++) {
        // 
        reward_vec.push([u8aToHex(decodeAddress(temporary[k]["account"])), temporary[k]["contribution"]])
    }
    // Scheduler parameters are when, periodic frequency, priority, scheduled call.
    rewardTxs.push(
        api.tx.scheduler.schedule(args['at-block'] + rewardTxs.length, null, 0, api.tx.doraRewards.initializeContributorsList(reward_vec))
    )
    total_length += temporary.length;
}
rewardTxs.push(api.tx.scheduler.schedule(args['at-block'] + rewardTxs.length, null, 0,
    api.tx.doraRewards.completeInitialization(args["end-relay-block"]))
);


// Not all might fit in a block (either because of weight or size)
const batchTxs = [];
let utilityBatch;

for (i = 0, j = rewardTxs.length; i < j; i += utilityCallChunk) {
    utilityBatch = rewardTxs.slice(i, i + utilityCallChunk);
    batchTxs.push(api.tx.utility.batchAll(utilityBatch));
}

// import your account
const account = await keyring.addFromUri(PHRASE);

let batchTx;
for (i = 0; i < batchTxs.length; i++) {
    // get a batch tx call
    batchTx = batchTxs[i]
    // construct the batch and send the transactions
    const unsub = await api.tx.utility
        .batch(batchTx)
        .signAndSend(account, (result) => {
            if (result.status.isInBlock) {
                console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
            } else if (result.status.isFinalized) {
                console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
                unsub();
            }
        });
    await delay(30000);
}

