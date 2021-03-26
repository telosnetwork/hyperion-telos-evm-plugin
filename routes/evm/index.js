"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoPrefix = void 0;
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
        var methods;
        var _this = this;
        return __generator(this, function (_a) {
            methods = new Map();
            methods.set('net_listening', function () { return true; });
            methods.set('eth_blockNumber', function () { return __awaiter(_this, void 0, void 0, function () {
                var info, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, fastify.eosjs.rpc.get_info()];
                        case 1:
                            info = _a.sent();
                            return [2 /*return*/, '0x' + info.head_block_num.toString(16)];
                        case 2:
                            e_1 = _a.sent();
                            throw new Error('Request Failed: ' + e_1.message);
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            methods.set('eth_getLogs', function (params) { return __awaiter(_this, void 0, void 0, function () {
                var address, topics, fromBlock, toBlock, blockHash, queryBody, rangeObj, searchResults, results, _i, _a, hit, doc, logCount, _b, _c, log, e_2;
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
                                console.log(doc);
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
                            e_2 = _d.sent();
                            console.log(JSON.stringify(e_2, null, 2));
                            return [2 /*return*/, []];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            /**
             * Main JSON RPC 2.0 Endpoint
             */
            fastify.post('/', function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
                var _a, jsonrpc, id, method, params, func, result, e_3;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = request.body, jsonrpc = _a.jsonrpc, id = _a.id, method = _a.method, params = _a.params;
                            if (jsonrpc !== "2.0") {
                                return [2 /*return*/, jsonRcp2Error(reply, "InvalidRequest", id, "Invalid JSON RPC")];
                            }
                            console.log("[" + method + "] - " + JSON.stringify(params) + " (id=" + id + ")");
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
                            e_3 = _b.sent();
                            console.log(e_3.message);
                            return [2 /*return*/, jsonRcp2Error(reply, "InternalError", id, e_3.message)];
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