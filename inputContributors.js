import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { encodeAddress, decodeAddress } from '@polkadot/util-crypto'

import path from 'path';
import fs from 'fs';
const __dirname = path.resolve();

// read contributor list from contributorslist.json (include 361 contriutors)
const configpath = path.join(__dirname, './contributorlist.json');
const configJson = fs.readFileSync(configpath, 'utf-8');
const ctrlist = JSON.parse(configJson);

// get connect with substrate network
const wsProvider = new WsProvider('ws://127.0.0.1:8844');
const api = await ApiPromise.create({ provider: wsProvider });

// import secret json file of sudo
const secret_path = path.join(__dirname, './secret.json');
const secret_json = fs.readFileSync(secret_path, 'utf-8');
const secret = JSON.parse(secret_json);

// import secret account from secret json file
const unlockpassword = 'your password'
const keyring = new Keyring({ type :'sr25519' } )
const adminPair = keyring.addFromJson(secret);
adminPair.unlock(unlockpassword);

// numbers of contributors input once
const chunk = 100;

// start input ......
const contributors = ctrlist.contributions;
let total_length = 0;
let i, j, temporary;
const rewardTxs = [];
for (i = 0, j = contributors.length; i < j; i += chunk) {
    // size is 100
    temporary = contributors.slice(i, i + chunk);
    let reward_vec = [];
    for (var k = 0; k < temporary.length; k++) {
        let account = temporary[k]["account"];
        let contribution = temporary[k]["contribution"];
        console.log(account);
        console.log(contribution);
        // construct an array of contributor reward vec
        reward_vec.push([u8aToHex(decodeAddress(account)), contribution]);
    }
    rewardTxs.push(
        api.tx.sudo.sudo(api.tx.doraRewards.initializeContributorsList(reward_vec))
    )

    console.log(adminPair);
    const unsub = await api.tx.utility
        .batch(rewardTxs)
        .signAndSend(adminPair, (result) => {
            if (result.status.isInBlock) {
                console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
            } else if (result.status.isFinalized) {
                console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
                unsub();
            }
        });
    total_length += temporary.length;

    // wait some time to start next utility call
    // await delay(30000);
}

console.log(`contributor number is${total_length}`);

