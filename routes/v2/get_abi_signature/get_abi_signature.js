"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContractHandler = void 0;
const functions_1 = require("../../../../../../api/helpers/functions");
async function getContract(fastify, request) {
    const query = request.query;
    let contract = query.contract.replace(/^0x/, '').replace(/^0*/, '').toLowerCase();
    const response = {
        creation_trx: '',
        creator: '',
        abi: '',
        timestamp: '',
        block_num: 0
    };
    const results = await fastify.elastic.search({
        "index": fastify.manager.chain + '-action-*',
        "body": {
            size: 1,
            query: {
                bool: {
                    must: [{ term: { "@raw.createdaddr": contract } }]
                }
            }
        }
    });
    if (results['body']['hits']['hits'].length === 1) {
        const result = results['body']['hits']['hits'][0]._source['@raw'];
        response.creation_trx = `0x${result.hash}`;
        response.creator = result.from;
        response.block_num = result.block;
        response.timestamp = result.epoch;
        // TODO: figure out how to get abi in here after the fact... pulling from sourcify.dev
        return response;
    }
    else {
        // TODO: maybe lookup if this is even a contract by checking the account table for code?
        throw new Error("contract deployment not found");
    }
}
function getContractHandler(fastify, route) {
    return async (request, reply) => {
        reply.send(await (0, functions_1.timedQuery)(getContract, fastify, request, route));
    };
}
exports.getContractHandler = getContractHandler;
//# sourceMappingURL=get_contract.js.map