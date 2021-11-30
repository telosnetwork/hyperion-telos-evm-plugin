import {HyperionPlugin} from "../../hyperion-plugin";
import {FastifyInstance} from "fastify";
import fetch from "node-fetch";
import autoLoad from 'fastify-autoload';
import {join} from "path";
import {Transaction} from '@ethereumjs/tx';
import Common, {default as ethCommon} from '@ethereumjs/common';
import {HyperionAction} from "../../../interfaces/hyperion-action";
import {HyperionDelta} from "../../../interfaces/hyperion-delta";
import Bloom from "./bloom";
import {hLog} from "../../../helpers/common_functions";
import {toChecksumAddress} from "./utils"


const BN = require('bn.js');
const createKeccakHash = require('keccak');
const {TelosEvmApi} = require('@telosnetwork/telosevm-js');
const {Signature} = require('eosjs-ecc');
import RPCBroadcaster from "./ws/RPCBroadcaster";
import {TelosEvmConfig} from "./types";
import WebsocketRPC from "./ws/WebsocketRPC";

const RECEIPT_LOG_START = "RCPT{{";
const RECEIPT_LOG_END = "}}RCPT";

export default class TelosEvm extends HyperionPlugin {
    internalPluginName = 'telos-evm';
    apiPlugin = true;
    indexerPlugin = true;
    hasApiRoutes = true;
    debug = false;

    actionHandlers = [];
    deltaHandlers = [];
    common: Common;
    decimalsBN = new BN('1000000000000000000');
    baseChain = 'mainnet';
    hardfork = 'istanbul';
    counter = 0;
    pluginConfig: TelosEvmConfig;
    rpcBroadcaster: RPCBroadcaster;
    websocketRPC: WebsocketRPC

    constructor(config: TelosEvmConfig) {
        // TODO: some setTimeout that will send the doresources call?
        super(config);
        this.debug = config.debug
        if (this.baseConfig) {
            this.pluginConfig = this.baseConfig;
            if (config.contracts?.main) {
                this.dynamicContracts.push(config.contracts.main);
            }
            if (config.chainId) {
                this.common = ethCommon.forCustomChain(
                    this.baseChain,
                    {chainId: config.chainId},
                    this.hardfork
                );
                this.loadActionHandlers();
                this.loadDeltaHandlers();
                this.registerStreamHandlers();
            }
        }
    }

    loadDeltaHandlers() {
        this.deltaHandlers.push({
            table: 'global',
            contract: 'eosio',
            mappings: {
                delta: {
                    "@evmBlockHash": {"type": "keyword"}
                }
            },
            handler: async (delta: HyperionDelta) => {
                const blockHex = (delta["@global"].block_num as number).toString(16);
                const blockHash = createKeccakHash('keccak256').update(blockHex).digest('hex');

                delta['@evmBlockHash'] = blockHash;
            }
        })
        /*
        // eosio.evm::receipt
        this.deltaHandlers.push({
            table: 'receipt',
            contract: 'eosio.evm',
            mappings: {
                delta: {
                    "@evmReceipt": {
                        "properties": {
                            "index": {"type": "long"},
                            "hash": {"type": "keyword"},
                            "trx_index": {"type": "long"},
                            "block": {"type": "long"},
                            "block_hash": {"type": "keyword"},
                            "trxid": {"type": "keyword"},
                            "status": {"type": "byte"},
                            "epoch": {"type": "long"},
                            "createdaddr": {"type": "keyword"},
                            "gasused": {"type": "long"},
                            "ramused": {"type": "long"},
                            "logs": {
                                "properties": {
                                    "address": {"type": "keyword"},
                                    "data": {"enabled": false},
                                    "topics": {"type": "keyword"}
                                }
                            },
                            "logsBloom": {"type": "keyword"},
                            "output": {"enabled": false},
                            "errors": {"enabled": false},
                            "itxs": {
                                "properties": {
                                    "callType": { "type": "text" },
                                    "from": { "type": "text" },
                                    "gas": { "type": "text" },
                                    "input": { "type": "text" },
                                    "to": { "type": "text" },
                                    "value": { "type": "text" },
                                    "gasUsed": { "type": "text" },
                                    "output": { "type": "text" },
                                    "subtraces": { "type": "long" },
                                    "traceAddress": {"type": "long"},
                                    "type": { "type": "text" },
                                    "depth": { "type": "text" },
                                    "extra": {"type" : "text"}
                                }
                            },
                        }
                    }
                }
            },
            handler: async (delta: HyperionDelta) => {
                const data = delta.data;

                const blockHex = (data.block as number).toString(16);
                const blockHash = createKeccakHash('keccak256').update(blockHex).digest('hex');

                delta['@evmReceipt'] = {
                    index: data.index,
                    hash: data.hash.toLowerCase(),
                    trx_index: data.trx_index,
                    block: data.block,
                    block_hash: blockHash,
                    trxid: data.trxid.toLowerCase(),
                    status: data.status,
                    epoch: data.epoch,
                    createdaddr: data.createdaddr.toLowerCase(),
                    gasused: parseInt('0x' + data.gasused),
                    ramused: parseInt('0x' + data.ramused),
                    output: data.output,
                    itxs: data.itxs	|| []
                };

                if (data.logs) {
                    delta['@evmReceipt']['logs'] = JSON.parse(data.logs);
                    if (delta['@evmReceipt']['logs'].length === 0) {
                        delete delta['@evmReceipt']['logs'];
                    } else {
                        console.log('------- LOGS -----------');
                        console.log(delta['@evmReceipt']['logs']);
                        const bloom = new Bloom();
                        for (const topic of delta['@evmReceipt']['logs'][0]['topics'])
                            bloom.add(Buffer.from(topic, 'hex'));
                        bloom.add(Buffer.from(delta['@evmReceipt']['logs'][0]['address'], 'hex'));
                        delta['@evmReceipt']['logsBloom'] = bloom.bitvector.toString('hex');
                    }
                }

                if (data.errors) {
                    delta['@evmReceipt']['errors'] = JSON.parse(data.errors);
                    if (delta['@evmReceipt']['errors'].length === 0) {
                        delete delta['@evmReceipt']['errors'];
                    } else {
                        console.log('------- ERRORS -----------');
                        console.log(delta['@evmReceipt']['errors'])
                    }
                }

                delete delta.data;
            }
        });
        */
    }

    loadActionHandlers() {

        this.actionHandlers.push({
            action: 'raw',
            contract: this.pluginConfig.contracts.main,
            mappings: {
                action: {
                    "@raw": {
                        "properties": {
                            "hash": {"type": "keyword"},
                            "trx_index": {"type": "long"},
                            "block": {"type": "long"},
                            "block_hash": {"type": "keyword"},
                            "from": {"type": "keyword"},
                            "to": {"type": "keyword"},
                            "input_data": {"enabled": false},
                            "value": {"type": "keyword"},
                            "value_d": {"type": "double"},
                            "nonce": {"type": "long"},
                            "v": {"enabled": false},
                            "r": {"enabled": false},
                            "s": {"enabled": false},
                            "gas_price": {"type": "double"},
                            "gas_limit": {"type": "double"},
                            "status": {"type": "byte"},
                            "epoch": {"type": "long"},
                            "createdaddr": {"type": "keyword"},
                            // TODO: Long vs Double on the gasprice/limit/used
                            "charged_gas_price": {"type": "double"},
                            "gasused": {"type": "long"},
                            "gasusedblock": {"type": "long"},
                            "logs": {
                                "properties": {
                                    "address": {"type": "keyword"},
                                    "data": {"enabled": false},
                                    "topics": {"type": "keyword"}
                                }
                            },
                            "logsBloom": {"type": "keyword"},
                            "output": {"enabled": false},
                            "errors": {"enabled": false},
                            "itxs": {
                                "properties": {
                                    "callType": {"type": "text"},
                                    "from": {"type": "text"},
                                    "gas": {"type": "text"},
                                    "input": {"type": "text"},
                                    "to": {"type": "text"},
                                    "value": {"type": "text"},
                                    "gasUsed": {"type": "text"},
                                    "output": {"type": "text"},
                                    "subtraces": {"type": "long"},
                                    "traceAddress": {"type": "long"},
                                    "type": {"type": "text"},
                                    "depth": {"type": "text"},
                                    "extra": {"type": "object", "enabled": false}
                                }
                            },
                        }
                    }
                }
            },
            handler: (action: HyperionAction) => {

                // attach action extras here
                this.logDebug(JSON.stringify(action))

                const data = action['act']['data'];
                this.counter++;

                let consoleLog = action.console;
                if (!consoleLog) {
                    hLog(`WARNING: Action console not found!`);
                    return;
                }

                let receiptLog = consoleLog.slice(
                    consoleLog.indexOf(RECEIPT_LOG_START) + RECEIPT_LOG_START.length,
                    consoleLog.indexOf(RECEIPT_LOG_END)
                );

                let receipt;
                try {
                    receipt = JSON.parse(receiptLog);
                    this.logDebug(`Receipt: ${JSON.stringify(receipt)}`);
                } catch (e) {
                    hLog('WARNING: Failed to parse receiptLog');
                    return;
                }

                // decode internal EVM tx
                if (data.tx) {
                    const blockHex = (receipt.block as number).toString(16);
                    const blockHash = createKeccakHash('keccak256').update(blockHex).digest('hex');
                    try {
                        const tx = Transaction.fromSerializedTx(Buffer.from(data.tx, 'hex'), {
                            common: this.common,
                        });
                        const txBody = {
                            hash: '0x' + tx.hash()?.toString('hex'),
                            trx_index: receipt.trx_index,
                            block: receipt.block,
                            block_hash: blockHash,
                            to: tx.to?.toString(),
                            input_data: '0x' + tx.data?.toString('hex'),
                            value: tx.value?.toString(),
                            nonce: tx.nonce?.toString(),
                            gas_price: tx.gasPrice?.toString(),
                            gas_limit: tx.gasLimit?.toString(),
                            status: receipt.status,
                            itxs: receipt.itxs,
                            epoch: receipt.epoch,
                            createdaddr: receipt.createdaddr.toLowerCase(),
                            gasused: parseInt('0x' + receipt.gasused),
                            gasusedblock: parseInt('0x' + receipt.gasusedblock),
                            charged_gas_price: parseInt('0x' + receipt.charged_gas),
                            output: receipt.output,
                        };

                        if (tx.isSigned()) {
                            txBody["from"] = tx.getSenderAddress().toString().toLowerCase();
                            txBody["v"] = tx.v;
                            txBody["r"] = tx.r;
                            txBody["s"] = tx.s;
                        } else {
                            txBody["from"] = toChecksumAddress(data.sender).toLowerCase();
                            // TODO: set these from the Telos signature
                            //txBody["v"] = null;
                            //txBody["r"] = null;
                            //txBody["s"] = null;
                        }

                        if (receipt.logs) {
                            txBody['logs'] = receipt.logs;
                            if (txBody['logs'].length === 0) {
                                delete txBody['logs'];
                            } else {
                                //console.log('------- LOGS -----------');
                                //console.log(txBody['logs']);
                                const bloom = new Bloom();
                                for (const log of txBody['logs']) {
                                    bloom.add(Buffer.from(toChecksumAddress(log['address']), 'hex'));
                                    for (const topic of log.topics)
                                        bloom.add(Buffer.from(topic.padStart(64, '0'), 'hex'));
                                }

                                txBody['logsBloom'] = bloom.bitvector.toString('hex');
                            }
                        }

                        if (receipt.errors) {
                            txBody['errors'] = receipt.errors;
                            if (txBody['errors'].length === 0) {
                                delete txBody['errors'];
                            } else {
                                //console.log('------- ERRORS -----------');
                                //console.log(txBody['errors'])
                            }
                        }

                        if (txBody.value) {
                            // @ts-ignore
                            txBody['value_d'] = tx.value / this.decimalsBN;
                        }
                        action['@raw'] = txBody;

                        this.logDebug(`txBody: ${JSON.stringify(txBody)}`)
                        delete action['console'];
                    } catch (e) {
                        console.log(e);
                        console.log(data);
                    }
                }
            }
        });
    }

    registerStreamHandlers() {
        const pluginThis = this;
        this.streamHandlers.push({
            event: 'trace',
            handler: async streamEvent => {
                const headers = streamEvent.properties.headers;
                if (headers) {
                    if (headers.event === 'delta') {
                        console.log("DELTA HEADERS: " + JSON.stringify(headers));
                    } else if (headers.event === 'trace' && headers.account === 'eosio.evm' && headers.name === 'raw') {
                        if (streamEvent.content) {
                            const evPayload = {
                                event: 'evm_transaction',
                                actionTrace: streamEvent.content.toString()

                            };
                            process.send(evPayload);
                        }
                    }
                }
            }
        });
    }

    initOnce() {
        super.initOnce();
        if (this.rpcBroadcaster) {
            console.error("initOnce called more than once!!! rpcBroadcaster already set!!");
            return;
        }
        this.rpcBroadcaster = new RPCBroadcaster(this.baseConfig);
    }

    initHandlerMap(): any {
        return {
            'evm_transaction': (msg) => this.rpcBroadcaster.broadcastRaw(msg.actionTrace)
        };
    }

    addRoutes(server: FastifyInstance): void {
        server.decorate('evm', new TelosEvmApi({
            endpoint: server["chain_api"],
            chainId: this.pluginConfig.chainId,
            ethPrivateKeys: [],
            fetch: fetch,
            telosContract: this.pluginConfig.contracts.main,
            telosPrivateKeys: [this.pluginConfig.signer_key],
            signingPermission: this.pluginConfig.signer_permission
        }));
        server.evm.setDebug(this.pluginConfig.debug);
        server.decorate('rpcPayloadHandlerContainer', {});
        server.register(autoLoad, {
            dir: join(__dirname, 'routes'),
            dirNameRoutePrefix: false,
            options: this.pluginConfig
        });
        this.websocketRPC = new WebsocketRPC(this.pluginConfig, server.rpcPayloadHandlerContainer);
    }

    logDebug(msg: String): void {
        if (this.debug) {
            console.log(msg);
        }
    }
}
