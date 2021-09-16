"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_contract_1 = require("./get_contract");
const functions_1 = require("../../../../../../api/helpers/functions");
function default_1(fastify, opts, next) {
    const schema = {
        summary: 'get contract info',
        tags: ['evm'],
        querystring: {
            type: 'object',
            properties: {
                "contract": {
                    description: 'contract address',
                    type: 'string',
                    minLength: 42,
                    maxLength: 42
                }
            },
            required: ["contract"]
        },
        response: {
            200: {
                description: "Success",
                type: "object",
                properties: {
                    "creation_trx": {
                        type: "string"
                    },
                    "creator": {
                        type: "string"
                    },
                    "timestamp": {
                        type: "string"
                    },
                    "block_num": {
                        type: "integer"
                    },
                    "abi": {
                        type: "string"
                    },
                }
            }
        }
    };
    (0, functions_1.addApiRoute)(fastify, 'GET', 'v2/evm/get_contract', get_contract_1.getContractHandler, schema);
    next();
}
exports.default = default_1;
//# sourceMappingURL=index.js.map