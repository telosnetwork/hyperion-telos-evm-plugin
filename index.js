"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hyperion_plugin_1 = require("../../hyperion-plugin");
const node_fetch_1 = __importDefault(require("node-fetch"));
const fastify_autoload_1 = __importDefault(require("fastify-autoload"));
const path_1 = require("path");
const tx_1 = require("@ethereumjs/tx");
const common_1 = __importDefault(require("@ethereumjs/common"));
const bloom_1 = __importDefault(require("./bloom"));
const BN = require('bn.js');
const createKeccakHash = require('keccak');
const { TelosEvmApi } = require('@telosnetwork/telosevm-js');
const RECEIPT_LOG_START = "RCPT{{";
const RECEIPT_LOG_END = "}}RCPT";
function toChecksumAddress(address) {
    if (!address)
        return address;
    address = address.toLowerCase().replace('0x', '');
    if (address.length != 40)
        address = address.padStart(40, "0");
    let hash = createKeccakHash('keccak256').update(address).digest('hex');
    let ret = '0x';
    for (var i = 0; i < address.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            ret += address[i].toUpperCase();
        }
        else {
            ret += address[i];
        }
    }
    return ret;
}
class TelosEvm extends hyperion_plugin_1.HyperionPlugin {
    constructor(config) {
        super(config);
        this.hasApiRoutes = true;
        this.debug = false;
        this.actionHandlers = [];
        this.deltaHandlers = [];
        this.decimalsBN = new BN('1000000000000000000');
        this.baseChain = 'mainnet';
        this.hardfork = 'istanbul';
        this.counter = 0;
        this.debug = config.debug;
        if (this.baseConfig) {
            this.pluginConfig = this.baseConfig;
            if (config.contracts?.main) {
                this.dynamicContracts.push(config.contracts.main);
            }
            if (config.chainId) {
                this.common = common_1.default.forCustomChain(this.baseChain, { chainId: config.chainId }, this.hardfork);
                this.loadActionHandlers();
                //this.loadDeltaHandlers();
            }
        }
    }
    loadDeltaHandlers() {
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
        // eosio.evm::receipt
        this.actionHandlers.push({
            action: 'raw',
            // TODO: this contract account should come from the config?
            contract: 'eosio.evm',
            mappings: {
                action: {
                    "@raw": {
                        "properties": {
                            "hash": { "type": "keyword" },
                            "trx_index": { "type": "long" },
                            "block": { "type": "long" },
                            "block_hash": { "type": "keyword" },
                            "from": { "type": "keyword" },
                            "to": { "type": "keyword" },
                            "input_data": { "enabled": false },
                            "value": { "type": "keyword" },
                            "value_d": { "type": "double" },
                            "nonce": { "type": "long" },
                            "v": { "enabled": false },
                            "r": { "enabled": false },
                            "s": { "enabled": false },
                            "gas_price": { "type": "double" },
                            "gas_limit": { "type": "double" },
                            "status": { "type": "byte" },
                            "epoch": { "type": "long" },
                            "createdaddr": { "type": "keyword" },
                            // TODO: Long vs Double on the gasprice/limit/used
                            "charged_gas_price": { "type": "double" },
                            "gasused": { "type": "long" },
                            "gasusedblock": { "type": "long" },
                            "logs": {
                                "properties": {
                                    "address": { "type": "keyword" },
                                    "data": { "enabled": false },
                                    "topics": { "type": "keyword" }
                                }
                            },
                            "logsBloom": { "type": "keyword" },
                            "output": { "enabled": false },
                            "errors": { "enabled": false },
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
                                    "traceAddress": { "type": "long" },
                                    "type": { "type": "text" },
                                    "depth": { "type": "text" },
                                    "extra": { "type": "object", "enabled": false }
                                }
                            },
                        }
                    }
                }
            },
            handler: (action) => {
                // attach action extras here
                this.logDebug(JSON.stringify(action));
                const data = action['act']['data'];
                this.counter++;
                let consoleLog = action.console;
                let receiptLog = consoleLog.slice(consoleLog.indexOf(RECEIPT_LOG_START) + RECEIPT_LOG_START.length, consoleLog.indexOf(RECEIPT_LOG_END));
                let receipt = JSON.parse(receiptLog);
                this.logDebug(`Receipt: ${JSON.stringify(receipt)}`);
                // decode internal EVM tx
                if (data.tx) {
                    const blockHex = receipt.block.toString(16);
                    const blockHash = createKeccakHash('keccak256').update(blockHex).digest('hex');
                    try {
                        const tx = tx_1.Transaction.fromSerializedTx(Buffer.from(data.tx, 'hex'), {
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
                        }
                        else {
                            txBody["from"] = toChecksumAddress(data.sender).toLowerCase();
                            //txBody["v"] = null;
                            //txBody["r"] = null;
                            //txBody["s"] = null;
                        }
                        if (receipt.logs) {
                            txBody['logs'] = receipt.logs;
                            if (txBody['logs'].length === 0) {
                                delete txBody['logs'];
                            }
                            else {
                                console.log('------- LOGS -----------');
                                console.log(txBody['logs']);
                                const bloom = new bloom_1.default();
                                for (const topic of txBody['logs'][0]['topics'])
                                    bloom.add(Buffer.from(topic, 'hex'));
                                bloom.add(Buffer.from(txBody['logs'][0]['address'], 'hex'));
                                txBody['logsBloom'] = bloom.bitvector.toString('hex');
                            }
                        }
                        if (receipt.errors) {
                            txBody['errors'] = receipt.errors;
                            if (txBody['errors'].length === 0) {
                                delete txBody['errors'];
                            }
                            else {
                                console.log('------- ERRORS -----------');
                                console.log(txBody['errors']);
                            }
                        }
                        if (txBody.value) {
                            // @ts-ignore
                            txBody['value_d'] = tx.value / this.decimalsBN;
                        }
                        action['@raw'] = txBody;
                        this.logDebug(`txBody: ${JSON.stringify(txBody)}`);
                        // TODO: don't delete data?  Or just store it differently so it shows up under eosio.evm account still
                        //delete action['act']['data'];
                        delete action['console'];
                    }
                    catch (e) {
                        console.log(e);
                        console.log(data);
                    }
                }
            }
        });
    }
    addRoutes(server) {
        server.decorate('evm', new TelosEvmApi({
            endpoint: server["chain_api"],
            chainId: this.pluginConfig.chainId,
            ethPrivateKeys: [],
            fetch: node_fetch_1.default,
            telosContract: this.pluginConfig.contracts.main,
            telosPrivateKeys: [this.pluginConfig.signer_key]
        }));
        server.evm.setDebug(this.pluginConfig.debug);
        server.register(fastify_autoload_1.default, {
            dir: (0, path_1.join)(__dirname, 'routes'),
            dirNameRoutePrefix: false,
            options: this.pluginConfig
        });
    }
    logDebug(msg) {
        if (this.debug)
            console.log(msg);
    }
}
exports.default = TelosEvm;
//# sourceMappingURL=index.js.map