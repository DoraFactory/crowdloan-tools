import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';
import { encodeAddress, decodeAddress } from '@polkadot/util-crypto'
import path from 'path';
import fs from 'fs';

const wsProvider = new WsProvider('ws://127.0.0.1:8844');
const api = await ApiPromise.create({ provider: wsProvider });

const __dirname = path.resolve();
const configpath = path.join(__dirname, './contributorlist.json');
const configJson = fs.readFileSync(configpath, 'utf-8');
const ctrlist = JSON.parse(configJson);

const secret_path = path.join(__dirname, './secret.json');
const secret_json = fs.readFileSync(secret_path, 'utf-8');
const secret = JSON.parse(secret_json);


const unlockpassword = 'dora*^8612!@';
const keyring = new Keyring({ type :'sr25519' } )
const adminPair = keyring.addFromJson(secret);
adminPair.unlock(unlockpassword);

const alice = keyring.addFromUri('//Alice');

const tx = await api.tx.balances.transfer(alice.address, 1000000000000)
const txs = Array(15).fill(tx)
api.tx.utility
    .batch(txs)
    .signAndSend(adminPair, (result) => {
        //console.log(`Current status is ${result.status}`);
        if (result.status.isInBlock) {
        console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
        } else if (result.status.isFinalized) {
        console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
        }
    });