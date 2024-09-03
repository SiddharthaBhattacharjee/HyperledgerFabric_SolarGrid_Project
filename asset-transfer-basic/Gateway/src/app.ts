
import { Gateway, GatewayOptions } from 'fabric-network';
import * as path from 'path';
import { buildCCPOrg1, buildWallet, prettyJSONString } from './utils//AppUtil';
import { buildCAClient, enrollAdmin, registerAndEnrollUser } from './utils/CAUtil';
import * as readline from 'readline';
import { PassThrough } from 'stream';
import express from 'express';
import cors from 'cors';
import * as crypto from 'crypto';
import * as fs from 'fs';
import CryptoJS from 'crypto-js';
import { deprecate } from 'util';
const NodeRSA = require('node-rsa');
const Crypto_ = require('crypto');
var bodyParser = require('body-parser');

const key = new NodeRSA({ b: 1024 });
key.importKey

const channelName = process.env.CHANNEL_NAME || 'mychannel';
const chaincodeName = process.env.CHAINCODE_NAME || 'basic';

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'typescriptAppUser';



async function main() {
    try {
        const ccp = buildCCPOrg1();
        const caClient = buildCAClient(ccp, 'ca.org1.example.com');
        const wallet = await buildWallet(walletPath);
        await enrollAdmin(caClient, wallet, mspOrg1);
        await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
        const gateway = new Gateway();

        const gatewayOpts: GatewayOptions = {
            wallet,
            identity: org1UserId,
            discovery: { enabled: true, asLocalhost: true },
        };

        try {
            await gateway.connect(ccp, gatewayOpts);

            const network = await gateway.getNetwork(channelName);

            const contract = network.getContract(chaincodeName);

            console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
            await contract.submitTransaction('InitLedger');
            console.log('*** Result: committed');

            console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
            let result = await contract.evaluateTransaction('GetAllAssets');
            console.log(`*** Result: ${prettyJSONString(result.toString())}`);

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const app = express();
            app.use(cors());
            const async = require('async');
            const requestQueue = async.queue(processRequest, 1); // Request Queue with concurrency of 1 here
            let oldData = [{
                "ID": "Org1",
                "TokenValue": 0
            },
            {
                "ID": "Org2",
                "TokenValue": 0
            }];
            
            //@deprecated
            // const encrypt = (input: string, password: string): string => {
            //     var iv = new Buffer('spw0h26cl8gt68kh');
            //     var key = new Buffer(password)
            //     var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
            //     cipher.update(new Buffer(input));
            //     var enc = cipher.final('base64');
            //     return enc;
            // };

            // Encrypt function: Takes string msg, public key string -> returns encrypted binary
            function custom_Encrypt(msg:string, Pub_key:any):any{
                const encryptedMessage = Crypto_.publicEncrypt(Pub_key, Buffer.from(msg));
                return encryptedMessage;
            }
            //Initialization of SSK
            var session_key_org1 = Math.random().toString(36).substr(2, 20);
            var session_key_org2 = Math.random().toString(36).substr(2, 20);
            //Path to RSA Keys
            const filePath1 = path.join(__dirname, 'Keys', 'Gateway_privateKey.txt');
            const filePath2 = path.join(__dirname, 'Keys', 'Gateway_publicKey.txt');
            const filePath3 = path.join(__dirname, 'Keys', 'Org1_publicKey.txt');
            const filePath4 = path.join(__dirname, 'Keys', 'Org2_publicKey.txt');
            //RSA Keys
            const self_Priv_key = fs.readFileSync(filePath1,'utf-8');
            const self_Pub_key = fs.readFileSync(filePath2,'utf-8');
            const Org1Key = fs.readFileSync(filePath3,'utf-8');
            const Org2Key = fs.readFileSync(filePath4,'utf-8');
            // const ess_key1 = encrypt(session_key_org1, key1);
            // const ess_key2 = encrypt(session_key_org2, key2);
            var ess_key1 = custom_Encrypt(session_key_org1,Org1Key);
            var ess_key2 = custom_Encrypt(session_key_org2,Org2Key);

            //Remove these after testing
            console.log("Session key org1: " + session_key_org1);
            console.log("Session key org2: " + session_key_org2);
            console.log("pk_org1:"+ Org1Key);
            console.log("pk_org2:"+ Org2Key);
            console.log("ess_key1:"+ ess_key1);
            console.log("ess_key2:"+ ess_key2);

            // Sends processed data to frontend
            app.get('/getData', async (req, res) => {
                let result = await contract.evaluateTransaction('GetAllAssets');
                let assets = JSON.parse(result.toString());
                let O1Rec = assets[0].TokenValue;
                let O2Rec = assets[1].TokenValue;
                let O1Loss = 0;
                let O2Loss = 0;
                let O1Gain = 0;
                let O2Gain = 0;
                if (!(oldData[0].TokenValue === 0 && oldData[1].TokenValue === 0)) {
                    let O1Diff = oldData[0].TokenValue - assets[0].TokenValue;
                    let O2Diff = oldData[1].TokenValue - assets[1].TokenValue;
                    if (O1Diff < 0) {
                        O1Loss = O1Diff;
                    }
                    else {
                        O1Gain = O1Diff * -1;
                    }
                    if (O2Diff < 0) {
                        O2Loss = O2Diff;
                    }
                    else {
                        O2Gain = O2Diff * -1;
                    }
                }
                oldData = assets;
                res.send([[O1Rec, O1Gain, O1Loss], [O2Rec, O2Gain, O2Loss]]);
            });

            //Handshake Authentication
            app.post('/authenticate', express.json(), async (req, res) => {
                try{
                    const dataFromPython = req.body;
                    const org_id = dataFromPython.org_id;
                    if(org_id === "org1"){
                        res.send(ess_key1);
                    }
                    else if(org_id === "org2"){
                        res.send(ess_key2);
                    }
                    else{
                        res.status(404).send("Organization Not Found");
                    }
                }
                catch (error){
                    console.error(`******** FAILED to run the application: ${error}`);
                    res.status(500).send('Failed to accept request: ' + error);
                }
            });

            // Decrypt function: Takes encrypted binary, private key string -> returns decrypted string
            function custom_Decrypt(emsg:any, Priv_key:any):string{
                const Priv_key_obj = new NodeRSA(Priv_key);
                const dmsg = Priv_key_obj.decrypt(emsg, 'utf8');
                return dmsg;
            }

            // Receives requests from IoT devices and queues them
            // changed this to receive and decrypt binary data
            app.post('/receiveData', bodyParser.raw({type: 'application/octet-stream', limit : '2mb'}), async (req, res) => {
                try {
                    const RawDataFromPython = req.body;
                    const TextDataFromPython = custom_Decrypt(RawDataFromPython, self_Priv_key);
                    console.log(TextDataFromPython);
                    const dataFromPython = JSON.parse(TextDataFromPython);
                    // Format of dataFromPython = {'org1': val1, 'org2': val2, 'ss_key': session_key, 'sender': 'org1/org2'}

                    console.log('Received data from Nodes:', dataFromPython, "From ip: ",req.get('host')); // Only for testing
                    if(dataFromPython.sender === 'Org1' && dataFromPython.ss_key === session_key_org1) {
                        session_key_org1 = Math.random().toString(36).substr(2, 20);
                        ess_key1 = custom_Encrypt(session_key_org1,Org1Key);
                        res.send(ess_key1);
                        requestQueue.push(dataFromPython);
                    }
                    else if(dataFromPython.sender === 'Org2' && dataFromPython.ss_key === session_key_org2) {
                        session_key_org2 = Math.random().toString(36).substr(2, 20);
                        ess_key2 = custom_Encrypt(session_key_org2,Org2Key);
                        res.send(ess_key2);
                        requestQueue.push(dataFromPython);
                    }
                    else{
                        console.log("Discarding request ", dataFromPython, ": Authorized Session Key Not found!");
                        res.status(404).send('Matching Session Key Not Found');
                    }
                } catch (error) {
                    console.error(`******** FAILED to run the application: ${error}`);
                    res.status(500).send('Failed to accept request: ' + error);
                }
            });

            //@deprecated
            // const decrypt = (encrypted:string, password:string):string => {
            //     const ciphertext_ = CryptoJS.enc.Base64.parse(encrypted);
            //     const iv = CryptoJS.lib.WordArray.create(ciphertext_.words.slice(0, 4));
            //     const ciphertext = CryptoJS.lib.WordArray.create(ciphertext_.words.slice(4));
            
            //     const key = CryptoJS.enc.Utf8.parse(password);
            //     var cipherParams = CryptoJS.lib.CipherParams.create({
            //         ciphertext: ciphertext_
            //     });
            //     const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
            //         iv: iv,
            //         mode: CryptoJS.mode.CFB,
            //         padding: CryptoJS.pad.Pkcs7
            //     });
            
            //     return decrypted.toString(CryptoJS.enc.Utf8);
            // };

            // Processes Queued Transactions and commits on Chain
            async function processRequest(dataFromPython: any, callback: () => void) {
                let org1val = dataFromPython.org1;
                let org2val = dataFromPython.org2;

                if (org1val < 0) {
                    org1val = -1 * org1val;
                    try {
                        await contract.submitTransaction('SubtractAsset', 'Org1', org1val.toString());
                        console.log(`*** Result: committed SubtractAsset on Org1 with value ${org1val}`);
                    } catch (error) {
                        console.log(`*** Successfully caught the error: \n    ${error}`);
                    }
                }
                else if(org1val === 0){
                    console.log("Discarded Transaction: Org1 0");
                }
                else {
                    try {
                        await contract.submitTransaction('AddAsset', 'Org1', org1val.toString());
                        console.log(`*** Result: committed AddAsset on Org1 with value ${org1val}`);
                    } catch (error) {
                        console.log(`*** Successfully caught the error: \n    ${error}`);
                    }
                }

                if (org2val < 0) {
                    org2val = -1 * org2val;
                    try {
                        await contract.submitTransaction('SubtractAsset', 'Org2', org2val.toString());
                        console.log(`*** Result: committed SubtractAsset on Org2 with value ${org2val}`);
                    } catch (error) {
                        console.log(`*** Successfully caught the error: \n    ${error}`);
                    }
                }
                else if(org2val === 0){
                    console.log("Discarded Transaction: Org2 0");
                }
                else {
                    try {
                        await contract.submitTransaction('AddAsset', 'Org2', org2val.toString());
                        console.log(`*** Result: committed AddAsset on Org2 with value ${org2val}`);
                    } catch (error) {
                        console.log(`*** Successfully caught the error: \n    ${error}`);
                    }
                }

                // Release Lock here
                callback();
            }

            app.listen(3001, () => {
                console.log('Server is running on port 3001');
            });


        } catch (error) {
            console.error(`******** FAILED to run the application: ${error}`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`******** FAILED to run the application: ${error}`);
        process.exit(1);
    }
}

main();
