
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
const sqlite3 = require('sqlite3').verbose();
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

            //Recover Save state
            const filePath0 = path.join(__dirname, 'Databases', 'state.json');
            const TempSaveState = fs.readFileSync(filePath0, 'utf8');
            const saveState = JSON.parse(TempSaveState);
            let Org1State = saveState["Org1"];
            let Org2State = saveState["Org2"];

            console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
            await contract.submitTransaction('InitLedger',Org1State.toString(),Org2State.toString()); // Restore Save state on ledger
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


            //Initialize Database:
            const filePathSQL = path.join(__dirname, 'Databases', 'data.db');
            const db = new sqlite3.Database(filePathSQL);
            db.serialize(() => {
                db.run("CREATE TABLE IF NOT EXISTS data (key TEXT PRIMARY KEY, value TEXT)");
                db.get("SELECT COUNT(*) AS count FROM data", (err: any, row: any) => {
                    if (err) {
                        console.error(err.message);
                        return;
                    }
                    if (row.count === 0) {
                        // Initialize with default values if database is not initialized
                        const defaultValues = [
                            { key: 'stateData', value: JSON.stringify([[0,0,0],[0,0,0]])},
                            { key: 'Org1Record', value: JSON.stringify([0]) },
                            { key: 'Org2Record', value: JSON.stringify([0]) },
                            { key: 'Org1Gain', value: JSON.stringify([0]) },
                            { key: 'Org2Gain', value: JSON.stringify([0]) },
                            { key: 'Org1Loss', value: JSON.stringify([0]) },
                            { key: 'Org2Loss', value: JSON.stringify([0]) }
                        ];
                        const stmt = db.prepare("INSERT INTO data (key, value) VALUES (?, ?)");
                        for (const val of defaultValues) {
                            stmt.run(val.key, val.value);
                        }
                        stmt.finalize();
                    }
                });
            });
            // Function to fetch data from database
            function getRecord(key: string): Promise<any[]> {
                return new Promise((resolve, reject) => {
                    db.get("SELECT value FROM data WHERE key = ?", [key], (err: any, row: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row ? JSON.parse(row.value) : null);
                        }
                    });
                });
            }
            function getStateRecord(): Promise<any[][]> {
                return new Promise((resolve, reject) => {
                    db.get("SELECT value FROM data WHERE key = 'stateData'", (err: any, row: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row ? JSON.parse(row.value) : null);
                        }
                    });
                });
            }



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

            type Client = {
                req: express.Request;
                res: express.Response;
            };
            
            let clients: Client[] = [];

            //Remove these after testing
            console.log("Session key org1: " + session_key_org1);
            console.log("Session key org2: " + session_key_org2);
            console.log("pk_org1:"+ Org1Key);
            console.log("pk_org2:"+ Org2Key);
            console.log("ess_key1:"+ ess_key1);
            console.log("ess_key2:"+ ess_key2);

            //Init functions:
            async function initializeStateData() {
                try {
                    const stateDataFromDB = await getStateRecord();
                    if (stateDataFromDB) {
                        return stateDataFromDB;
                    } else {
                        // Handle the case where there is no data in the database
                        return [[0, 0, 0], [0, 0, 0]];
                    }
                } catch (error) {
                    console.error("Error fetching state data from database:", error);
                    // Handle the error appropriately
                    return [[0, 0, 0], [0, 0, 0]];
                }
            }
            async function initializeData(key: string) {
                try {
                    const DataFromDB = await getRecord(key);
                    if (DataFromDB) {
                        return DataFromDB;
                    } else {
                        // Handle the case where there is no data in the database
                        return [0];
                    }
                } catch (error) {
                    console.error("Error fetching state data from database:", error);
                    // Handle the error appropriately
                    return [0];
                }
            }
            /* 
            Data Format:
            [
                { key: 'stateData', value: JSON.stringify([[0,0,0],[0,0,0]])},
                { key: 'Org1Record', value: JSON.stringify([0]) },
                { key: 'Org2Record', value: JSON.stringify([0]) },
                { key: 'Org1Gain', value: JSON.stringify([0]) },
                { key: 'Org2Gain', value: JSON.stringify([0]) },
                { key: 'Org1Loss', value: JSON.stringify([0]) },
                { key: 'Org2Loss', value: JSON.stringify([0]) }
            ]
             */

            //save states of data for database
            var stateData = await initializeStateData();
            var Org1Record = await initializeData('Org1Record');
            var Org2Record = await initializeData('Org2Record');
            var Org1Gain = await initializeData('Org1Gain');
            var Org2Gain = await initializeData('Org2Gain');
            var Org1Loss = await initializeData('Org1Loss');
            var Org2Loss = await initializeData('Org2Loss');


            // Get data from chain and save to database
            async function fetchData() {
                let result = await contract.evaluateTransaction('GetAllAssets');
                let assets = JSON.parse(result.toString());
                let O1Rec = assets[0].TokenValue;
                let O2Rec = assets[1].TokenValue;
                let stateCheckpoint = {"Org1": O1Rec, "Org2": O2Rec}
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
                stateData = [[O1Rec, O1Gain, O1Loss], [O2Rec, O2Gain, O2Loss]];
                Org1Record = [...Org1Record,O1Rec];
                Org2Record = [...Org2Record,O2Rec];
                if (stateData[0][2] === 0) {
                    Org1Gain = [...Org1Gain,Org1Gain[Org1Gain.length - 1]];
                }
                else {
                    Org1Gain = [...Org1Gain,stateData[0][2] * -1];
                }
                if (stateData[0][1] === 0) {
                    Org1Loss = [...Org1Loss,Org1Loss[Org1Loss.length - 1]];
                }
                else {
                    Org1Loss = [...Org1Loss,stateData[0][1] * -1];
                }
                if (stateData[1][2] === 0) {
                    Org2Gain = [...Org2Gain,Org2Gain[Org2Gain.length - 1]];
                }
                else {
                    Org2Gain = [...Org2Gain,stateData[1][2] * -1];
                }
                if (stateData[1][1] === 0) {
                    Org2Loss = [...Org2Loss,Org2Loss[Org2Loss.length - 1]];
                }
                else {
                    Org2Loss = [...Org2Loss,stateData[1][1] * -1];
                }

                db.serialize(() => {
                    db.run("INSERT OR REPLACE INTO data (key, value) VALUES ('stateData', ?)", JSON.stringify(stateData));
                    db.run("INSERT OR REPLACE INTO data (key, value) VALUES ('Org1Record', ?)", JSON.stringify(Org1Record));
                    db.run("INSERT OR REPLACE INTO data (key, value) VALUES ('Org2Record', ?)", JSON.stringify(Org2Record));
                    db.run("INSERT OR REPLACE INTO data (key, value) VALUES ('Org1Gain', ?)", JSON.stringify(Org1Gain));
                    db.run("INSERT OR REPLACE INTO data (key, value) VALUES ('Org2Gain', ?)", JSON.stringify(Org2Gain));
                    db.run("INSERT OR REPLACE INTO data (key, value) VALUES ('Org1Loss', ?)", JSON.stringify(Org1Loss));
                    db.run("INSERT OR REPLACE INTO data (key, value) VALUES ('Org2Loss', ?)", JSON.stringify(Org2Loss));
                });
                fs.writeFileSync(filePath0, JSON.stringify(stateCheckpoint, null, 2));
                let dataToSend = [stateData, Org1Record, Org1Gain, Org1Loss, Org2Record, Org2Gain, Org2Loss];
                clients.forEach(client => client.res.write(`data: ${JSON.stringify(dataToSend)}\n\n`));
                console.log("Fetch performed successfully");
            }

            // Sends processed data to frontend
            app.get('/getData', async (req, res) => {
                res.send([stateData, Org1Record, Org1Gain, Org1Loss, Org2Record, Org2Gain, Org2Loss]);
            });

            //Set up connection from frontend
            app.get('/events', (req, res) => {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.flushHeaders();
            
                clients.push({ req, res });
            
                req.on('close', () => {
                    clients = clients.filter(client => client.req !== req);
                });
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

            // run fetch data every 10 sec
            setInterval(fetchData, 10000);

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
