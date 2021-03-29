"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoPrefix = void 0;
var common_functions_1 = require("../../../../../helpers/common_functions");
var bn_js_1 = __importDefault(require("bn.js"));
var abiDecoder = require("abi-decoder");
var abi = require("ethereumjs-abi");
function jsonRcp2Error(reply, type, requestId, message, code) {
    var errorCode = code;
    switch (type) {
        case "InvalidRequest": {
            reply.statusCode = 400;
            errorCode = -32600;
            break;
        }
        case "MethodNotFound": {
            reply.statusCode = 404;
            errorCode = -32601;
            break;
        }
        case "ParseError": {
            reply.statusCode = 400;
            errorCode = -32700;
            break;
        }
        case "InvalidParams": {
            reply.statusCode = 400;
            errorCode = -32602;
            break;
        }
        case "InternalError": {
            reply.statusCode = 500;
            errorCode = -32603;
            break;
        }
        default: {
            reply.statusCode = 500;
            errorCode = -32603;
        }
    }
    return {
        jsonrpc: "2.0",
        id: requestId,
        error: {
            code: errorCode,
            message: message
        }
    };
}
function default_1(fastify, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var methods, decimalsBN, zeros, chainAddr, chainIds;
        var _this = this;
        return __generator(this, function (_a) {
            methods = new Map();
            decimalsBN = new bn_js_1.default('1000000000000000000');
            zeros = "0x0000000000000000000000000000000000000000";
            chainAddr = [
                "0xb1f8e55c7f64d203c1400b9d8555d050f94adf39",
                "0x9f510b19f1ad66f0dcf6e45559fab0d6752c1db7",
                "0xb8e671734ce5c8d7dfbbea5574fa4cf39f7a54a4",
                "0xb1d3fbb2f83aecd196f474c16ca5d9cffa0d0ffc",
            ];
            chainIds = [1, 3, 4, 42];
            methods.set('net_listening', function () { return true; });
            methods.set('eth_blockNumber', function () { return __awaiter(_this, void 0, void 0, function () {
                var global_1, head_block_num, eth_head_block_num, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, fastify.eosjs.rpc.get_table_rows({
                                    code: "eosio",
                                    scope: "eosio",
                                    table: "global",
                                    json: true
                                })];
                        case 1:
                            global_1 = _a.sent();
                            head_block_num = parseInt(global_1.rows[0].block_num, 10);
                            eth_head_block_num = '0x' + head_block_num.toString(16);
                            common_functions_1.hLog(head_block_num, eth_head_block_num);
                            return [2 /*return*/, eth_head_block_num];
                        case 2:
                            e_1 = _a.sent();
                            throw new Error('Request Failed: ' + e_1.message);
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            methods.set('net_version', function () { return opts.chainId; });
            methods.set('eth_chainId', function () { return "0x" + opts.chainId.toString(16); });
            methods.set('eth_accounts', function () { return []; });
            methods.set('eth_getTransactionCount', function (_a) {
                var address = _a[0], block = _a[1];
                return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, fastify.evm.telos.getNonce(address.toLowerCase())];
                            case 1: return [2 /*return*/, _b.sent()];
                        }
                    });
                });
            });
            methods.set('eth_getCode', function (_a) {
                var address = _a[0], block = _a[1];
                return __awaiter(_this, void 0, void 0, function () {
                    var account, e_2;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, fastify.evm.telos.getEthAccount(address.toLowerCase())];
                            case 1:
                                account = _b.sent();
                                if (account.code && account.code.length > 0) {
                                    return [2 /*return*/, "0x" + Buffer.from(account.code).toString("hex")];
                                }
                                else {
                                    return [2 /*return*/, "0x0000"];
                                }
                                return [3 /*break*/, 3];
                            case 2:
                                e_2 = _b.sent();
                                return [2 /*return*/, "0x0000"];
                            case 3: return [2 /*return*/];
                        }
                    });
                });
            });
            // TODO: test case
            methods.set('eth_getStorageAt', function (_a) {
                var address = _a[0], position = _a[1], block = _a[2];
                return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, fastify.evm.telos.getStorageAt(address.toLowerCase(), position)];
                            case 1: return [2 /*return*/, _b.sent()];
                        }
                    });
                });
            });
            methods.set('eth_estimateGas', function (_a) {
                var _b = _a[0], from = _b.from, data = _b.data, value = _b.value;
                return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_c) {
                    return [2 /*return*/, 50000000];
                }); });
            });
            methods.set('eth_gasPrice', function () { return "0x1"; });
            methods.set('eth_getBalance', function (_a) {
                var address = _a[0];
                return __awaiter(_this, void 0, void 0, function () {
                    var account, bal, e_3;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, fastify.evm.telos.getEthAccount(address.toLowerCase())];
                            case 1:
                                account = _b.sent();
                                bal = account.balance;
                                return [2 /*return*/, "0x" + bal.toString(16)];
                            case 2:
                                e_3 = _b.sent();
                                return [2 /*return*/, "0x0000"];
                            case 3: return [2 /*return*/];
                        }
                    });
                });
            });
            methods.set('eth_getBalanceHuman', function (_a) {
                var address = _a[0];
                return __awaiter(_this, void 0, void 0, function () {
                    var account, bal, balConverted, e_4;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, fastify.evm.telos.getEthAccount(address.toLowerCase())];
                            case 1:
                                account = _b.sent();
                                bal = account.balance;
                                balConverted = bal / decimalsBN;
                                return [2 /*return*/, balConverted.toString(10)];
                            case 2:
                                e_4 = _b.sent();
                                return [2 /*return*/, "0"];
                            case 3: return [2 /*return*/];
                        }
                    });
                });
            });
            // TODO: test case
            methods.set('eth_call', function (_a) {
                var txParams = _a[0], block = _a[1];
                return __awaiter(_this, void 0, void 0, function () {
                    var _b, users, tokens, balances, buf, encodedTx, output;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                if (!(chainIds.includes(opts.chainId) && chainAddr.includes(txParams.to))) return [3 /*break*/, 2];
                                _b = abiDecoder.decodeMethod(txParams.data).params, users = _b[0], tokens = _b[1];
                                if (!(tokens.value.length === 1 && tokens.value[0] === zeros)) return [3 /*break*/, 2];
                                return [4 /*yield*/, Promise.all(users.value.map(function (user) {
                                        return methods.get('eth_getBalance')([user, null]);
                                    }))];
                            case 1:
                                balances = _c.sent();
                                return [2 /*return*/, "0x" + abi.rawEncode(balances.map(function (x) { return "uint256"; }), balances).toString("hex")];
                            case 2:
                                buf = Buffer.from(txParams.value.slice(2), "hex");
                                return [4 /*yield*/, fastify.evm.createEthTx(__assign(__assign({}, txParams), { value: txParams.value ? new bn_js_1.default(buf) : 0, sender: txParams.from }))];
                            case 3:
                                encodedTx = _c.sent();
                                return [4 /*yield*/, fastify.evm.telos.call({
                                        account: opts.contracts.main,
                                        tx: encodedTx,
                                        sender: txParams.from,
                                    })];
                            case 4:
                                output = _c.sent();
                                console.log("CALL RESPONSE: " + output);
                                return [2 /*return*/, "0x" + output];
                        }
                    });
                });
            });
            // async function getTrxFromHash(input: { hash: string, from: string, transactionData: string }) {
            // 	let receiptRows = await fastify.eosjs.rpc.get_table_rows({
            // 		code: opts.contracts.main,
            // 		scope: opts.contracts.main,
            // 		table: 'receipt',
            // 		key_type: 'sha256',
            // 		index_position: 2,
            // 		lower_bound: input.hash,
            // 		upper_bound: input.hash,
            // 		limit: 1
            // 	});
            // 	if (receiptRows.rows.length && receiptRows.rows[0].hash == input.hash) {
            // 		let receiptRow = receiptRows.rows[0];
            // 		let actionData;
            // 		if (!input.transactionData || !input.from) {
            //
            // 			let txResults = await fastify.elastic.search({
            // 				index: `${fastify.manager.chain}-action-*`,
            // 				body: {
            // 					query: {
            // 						bool: {
            // 							must: [
            // 								{"term": {"@raw.hash": input.hash}}
            // 							]
            // 						}
            // 					}
            // 				}
            // 			});
            //
            // 			console.log(txResults);
            //
            // 			let transactionResult = await hyperionAxios.get(
            // 				`/v2/history/get_transaction?id=${receiptRow.trxid}`
            // 			)
            // 			let action = transactionResult.data.actions.find(
            // 				action =>
            // 					action.act.account == opts.contracts.main && action.act.name == 'raw'
            // 			)
            // 			const sourceDoc = txResults.body.hits.hits[0]._source;
            // 			console.log(sourceDoc)
            // 			actionData = sourceDoc['@raw']['']
            // 		} else {
            // 			actionData = {tx: input.transactionData, sender: input.from}
            // 		}
            // 	}
            // }
            //
            // async function loadSentTransaction(ethResponse: any) {
            // 	if (!ethResponse) return;
            // 	const trx = await getTrxFromHash({
            // 		hash: ethResponse.transactionHash,
            // 		from: ethResponse.from ? ethResponse.from : (ethResponse.transaction.from as Buffer).toString('hex'),
            // 		transactionData: ethResponse.transaction.serialize().toString("hex").replace("0x", "")
            // 	});
            //
            // }
            //
            // function getTransactionHash(evmTrx: void) {
            // 	return Promise.resolve(undefined);
            // }
            // // TODO: eth_sendRawTransaction
            // methods.set('eth_sendRawTransaction', async ([signedTx]) => {
            // 	try {
            // 		const rawData = await fastify.evm.telos.raw({account: opts.contracts.main, tx: signedTx});
            // 		let evmTrx = await loadSentTransaction(rawData.eth)
            // 		return getTransactionHash(evmTrx);
            // 	} catch (e) {
            // 		console.log(e);
            // 		return null;
            // 	}
            // });
            // TODO: test case
            methods.set('eth_sendTransaction', function (_a) {
                var txParams = _a[0];
                return __awaiter(_this, void 0, void 0, function () {
                    var buf, encodedTx, rawData, e_5;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                buf = Buffer.from(txParams.value.slice(2), "hex");
                                return [4 /*yield*/, fastify.evm.createEthTx(__assign(__assign({}, txParams), { value: new bn_js_1.default(buf), rawSign: true, sender: txParams.from }))];
                            case 1:
                                encodedTx = _b.sent();
                                _b.label = 2;
                            case 2:
                                _b.trys.push([2, 4, , 5]);
                                return [4 /*yield*/, fastify.evm.telos.raw({
                                        account: opts.contracts.main,
                                        tx: encodedTx
                                    })];
                            case 3:
                                rawData = _b.sent();
                                return [2 /*return*/, "0x" + rawData.eth.transactionHash];
                            case 4:
                                e_5 = _b.sent();
                                console.log(e_5);
                                return [2 /*return*/, null];
                            case 5: return [2 /*return*/];
                        }
                    });
                });
            });
            // TODO: eth_getTransactionReceipt
            methods.set('eth_getTransactionReceipt', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, "0x0000"];
                });
            }); });
            // TODO: eth_getTransactionByHash
            methods.set('eth_getTransactionByHash', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, "0x0000"];
                });
            }); });
            // TODO: eth_getBlockByNumber
            methods.set('eth_getBlockByNumber', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, "0x0000"];
                });
            }); });
            // TODO: eth_getBlockByHash
            methods.set('eth_getBlockByHash', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, "0x0000"];
                });
            }); });
            // TODO: eth_getBlockTransactionCountByHash
            methods.set('eth_getBlockTransactionCountByHash', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, "0x0000"];
                });
            }); });
            // TODO: eth_getBlockTransactionCountByNumber
            methods.set('eth_getBlockTransactionCountByNumber', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, "0x0000"];
                });
            }); });
            // TODO: eth_getUncleCountByBlockHash
            methods.set('eth_getUncleCountByBlockHash', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, "0x0000"];
                });
            }); });
            // TODO: eth_getUncleCountByBlockNumber
            methods.set('eth_getUncleCountByBlockNumber', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, "0x0000"];
                });
            }); });
            methods.set('eth_getLogs', function (params) { return __awaiter(_this, void 0, void 0, function () {
                var address, topics, fromBlock, toBlock, blockHash, queryBody, rangeObj, searchResults, results, _i, _a, hit, doc, logCount, _b, _c, log, e_6;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            address = params.address;
                            topics = params.topics;
                            fromBlock = params.fromBlock;
                            toBlock = params.toBlock;
                            blockHash = params.blockHash;
                            queryBody = {
                                bool: {
                                    must: [
                                        { exists: { field: "@evmReceipt.logs" } }
                                    ]
                                }
                            };
                            if (blockHash) {
                                if (fromBlock || toBlock) {
                                    throw new Error('fromBlock/toBlock are not allowed with blockHash query');
                                }
                                queryBody.bool.must.push({ term: { "@evmReceipt.block_hash": blockHash } });
                            }
                            if (fromBlock || toBlock) {
                                rangeObj = { range: { "@evmReceipt.block": {} } };
                                if (fromBlock) {
                                    // console.log(`getLogs using fromBlock: ${fromBlock}`);
                                    rangeObj.range["@evmReceipt.block"]['gte'] = fromBlock;
                                }
                                if (toBlock) {
                                    // console.log(`getLogs using toBlock: ${toBlock}`);
                                    rangeObj.range["@evmReceipt.block"]['lte'] = toBlock;
                                }
                                queryBody.bool.must.push(rangeObj);
                            }
                            if (address) {
                                address = address.toLowerCase();
                                if (address.startsWith('0x')) {
                                    address = address.slice(2);
                                }
                                // console.log(`getLogs using address: ${address}`);
                                queryBody.bool.must.push({ term: { "@evmReceipt.logs.address": address } });
                            }
                            if (topics && topics.length > 0) {
                                // console.log(`getLogs using topics:\n${topics}`);
                                queryBody.bool.must.push({
                                    terms: {
                                        "@evmReceipt.logs.topics": topics.map(function (topic) {
                                            return topic.startsWith('0x') ? topic.slice(2).toLowerCase() : topic.toLowerCase();
                                        })
                                    }
                                });
                            }
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, fastify.elastic.search({
                                    index: fastify.manager.chain + "-delta-*",
                                    size: 1000,
                                    body: { query: queryBody }
                                })];
                        case 2:
                            searchResults = _d.sent();
                            results = [];
                            for (_i = 0, _a = searchResults.body.hits.hits; _i < _a.length; _i++) {
                                hit = _a[_i];
                                doc = hit._source;
                                if (doc['@evmReceipt'] && doc['@evmReceipt']['logs']) {
                                    logCount = 0;
                                    for (_b = 0, _c = doc['@evmReceipt']['logs']; _b < _c.length; _b++) {
                                        log = _c[_b];
                                        results.push({
                                            address: '0x' + log.address,
                                            blockHash: doc['@evmReceipt']['block_hash'],
                                            blockNumber: doc['@evmReceipt']['block'],
                                            data: '0x' + log.data,
                                            logIndex: parseInt(doc['@evmReceipt']['trx_index'], 10) + logCount,
                                            removed: false,
                                            topics: log.topics.map(function (t) { return '0x' + t; }),
                                            transactionHash: doc['@evmReceipt']['hash'],
                                            transactionIndex: doc['@evmReceipt']['trx_index']
                                        });
                                        logCount++;
                                    }
                                }
                            }
                            return [2 /*return*/, results];
                        case 3:
                            e_6 = _d.sent();
                            console.log(JSON.stringify(e_6, null, 2));
                            return [2 /*return*/, []];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            /**
             * Main JSON RPC 2.0 Endpoint
             */
            fastify.post('/', function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
                var _a, jsonrpc, id, method, params, func, result, e_7;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = request.body, jsonrpc = _a.jsonrpc, id = _a.id, method = _a.method, params = _a.params;
                            if (jsonrpc !== "2.0") {
                                return [2 /*return*/, jsonRcp2Error(reply, "InvalidRequest", id, "Invalid JSON RPC")];
                            }
                            common_functions_1.hLog("[" + method + "] - " + JSON.stringify(params) + " (id=" + id + ")");
                            if (!methods.has(method)) return [3 /*break*/, 5];
                            func = methods.get(method);
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, func(params)];
                        case 2:
                            result = _b.sent();
                            reply.send({ id: id, jsonrpc: jsonrpc, result: result });
                            return [3 /*break*/, 4];
                        case 3:
                            e_7 = _b.sent();
                            common_functions_1.hLog(e_7.message);
                            return [2 /*return*/, jsonRcp2Error(reply, "InternalError", id, e_7.message)];
                        case 4: return [3 /*break*/, 6];
                        case 5: return [2 /*return*/, jsonRcp2Error(reply, 'MethodNotFound', id, "Invalid method: " + method)];
                        case 6: return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
exports.default = default_1;
exports.autoPrefix = '/evm';
//# sourceMappingURL=index.js.map