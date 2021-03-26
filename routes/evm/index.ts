import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {hLog} from "../../../../../helpers/common_functions";
import {TelosEvmConfig} from "../../index";

function jsonRcp2Error(reply: FastifyReply, type: string, requestId: string, message: string, code?: number) {
	let errorCode = code;
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
			message
		}
	};
}

export default async function (fastify: FastifyInstance, opts: TelosEvmConfig) {

	const methods: Map<string, (params?: any) => Promise<any> | any> = new Map();

	methods.set('net_listening', () => true);

	methods.set('eth_blockNumber', async () => {
		try {
			const info = await fastify.eosjs.rpc.get_info();
			return '0x' + info.head_block_num.toString(16)
		} catch (e) {
			throw new Error('Request Failed: ' + e.message);
		}
	});

	methods.set('net_version', () => opts.chainId);
	methods.set('eth_chainId', () => "0x" + opts.chainId.toString(16));
	methods.set('eth_accounts', () => null);

	// TODO: eth_getTransactionCount
	methods.set('eth_getTransactionCount', async () => {
		return 1;
	});

	// TODO: eth_getCode
	methods.set('eth_getCode', async () => {
		return "0x0000";
	});

	// TODO: eth_getStorageAt
	methods.set('eth_getStorageAt', async () => {
		return "0x0000";
	});

	// TODO: eth_estimateGas
	methods.set('eth_estimateGas', async () => {
		return 50000000;
	});

	methods.set('eth_gasPrice', () => "0x1");

	// TODO: eth_getBalance
	methods.set('eth_getBalance', async () => {
		return "0x0000";
	});

	// TODO: eth_call
	methods.set('eth_call', async () => {
		return "0x0000";
	});

	// TODO: eth_sendRawTransaction
	methods.set('eth_sendRawTransaction', async () => {
		return "0x0000";
	});

	// TODO: eth_sendTransaction
	methods.set('eth_sendTransaction', async () => {
		return "0x0000";
	});

	// TODO: eth_getTransactionReceipt
	methods.set('eth_getTransactionReceipt', async () => {
		return "0x0000";
	});

	// TODO: eth_getTransactionByHash
	methods.set('eth_getTransactionByHash', async () => {
		return "0x0000";
	});

	// TODO: eth_getBlockByNumber
	methods.set('eth_getBlockByNumber', async () => {
		return "0x0000";
	});

	// TODO: eth_getBlockByHash
	methods.set('eth_getBlockByHash', async () => {
		return "0x0000";
	});

	// TODO: eth_getBlockTransactionCountByHash
	methods.set('eth_getBlockTransactionCountByHash', async () => {
		return "0x0000";
	});

	// TODO: eth_getBlockTransactionCountByNumber
	methods.set('eth_getBlockTransactionCountByNumber', async () => {
		return "0x0000";
	});

	// TODO: eth_getUncleCountByBlockHash
	methods.set('eth_getUncleCountByBlockHash', async () => {
		return "0x0000";
	});

	// TODO: eth_getUncleCountByBlockNumber
	methods.set('eth_getUncleCountByBlockNumber', async () => {
		return "0x0000";
	});


	methods.set('eth_getLogs', async (params) => {
		// query preparation
		let address: string = params.address;
		let topics: string[] = params.topics;
		let fromBlock: string | number = params.fromBlock;
		let toBlock: string | number = params.toBlock;
		let blockHash: string = params.blockHash;

		const queryBody: any = {
			bool: {
				must: [
					{exists: {field: "@evmReceipt.logs"}}
				]
			}
		};

		if (blockHash) {
			if (fromBlock || toBlock) {
				throw new Error('fromBlock/toBlock are not allowed with blockHash query');
			}
			queryBody.bool.must.push({term: {"@evmReceipt.block_hash": blockHash}})
		}

		if (fromBlock || toBlock) {
			const rangeObj = {range: {"@evmReceipt.block": {}}};
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
			queryBody.bool.must.push({term: {"@evmReceipt.logs.address": address}})
		}

		if (topics && topics.length > 0) {
			// console.log(`getLogs using topics:\n${topics}`);
			queryBody.bool.must.push({
				terms: {
					"@evmReceipt.logs.topics": topics.map(topic => {
						return topic.startsWith('0x') ? topic.slice(2).toLowerCase() : topic.toLowerCase();
					})
				}
			})
		}

		// search
		try {
			const searchResults = await fastify.elastic.search({
				index: `${fastify.manager.chain}-delta-*`,
				size: 1000,
				body: {query: queryBody}
			});

			// processing
			const results = [];
			for (const hit of searchResults.body.hits.hits) {
				const doc = hit._source;
				if (doc['@evmReceipt'] && doc['@evmReceipt']['logs']) {
					let logCount = 0;
					for (const log of doc['@evmReceipt']['logs']) {
						results.push({
							address: '0x' + log.address,
							blockHash: doc['@evmReceipt']['block_hash'],
							blockNumber: doc['@evmReceipt']['block'],
							data: '0x' + log.data,
							logIndex: parseInt(doc['@evmReceipt']['trx_index'], 10) + logCount,
							removed: false,
							topics: log.topics.map(t => '0x' + t),
							transactionHash: doc['@evmReceipt']['hash'],
							transactionIndex: doc['@evmReceipt']['trx_index']
						});
						logCount++;
					}
				}
			}

			return results;
		} catch (e) {
			console.log(JSON.stringify(e, null, 2));
			return [];
		}
	});

	/**
	 * Main JSON RPC 2.0 Endpoint
	 */
	fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
		const {jsonrpc, id, method, params} = request.body as any;
		if (jsonrpc !== "2.0") {
			return jsonRcp2Error(reply, "InvalidRequest", id, "Invalid JSON RPC");
		}
		hLog(`[${method}] - ${JSON.stringify(params)} (id=${id})`);
		if (methods.has(method)) {
			const func = methods.get(method);
			try {
				const result = await func(params);
				reply.send({id, jsonrpc, result});
			} catch (e) {
				hLog(e.message);
				return jsonRcp2Error(reply, "InternalError", id, e.message);
			}
		} else {
			return jsonRcp2Error(reply, 'MethodNotFound', id, `Invalid method: ${method}`);
		}
	});
}
export const autoPrefix = '/evm';
