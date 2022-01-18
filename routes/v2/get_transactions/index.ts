import {FastifyInstance} from "fastify";
import {getTransactionsHandler} from "./get_transactions";
import {addApiRoute} from "../../../../../../api/helpers/functions";
import {makeTransactionSchema} from "./functions";

export default function (fastify: FastifyInstance, opts: any, next) {
	const schema: any = {
		summary: 'get transactions for address',
		tags: ['evm'],
		querystring: {
			type: 'object',
			properties: {
				"address": {
					description: 'address that must be in either to or from property',
					type: 'string',
					minLength: 42,
					maxLength: 42
				},
				"log_topics": {
					description: 'an array of topics that all must be in the transaction\'s logs (using AND operator)',
					type: 'array',
					items: {
						type: 'string'
					}
				},
				"sort": {
					description: 'sort direction',
					enum: ['desc', 'asc', '1', '-1'],
					type: 'string'
				},
				"after": {
					description: 'filter after specified date (ISO8601)',
					type: 'string'
				},
				"before": {
					description: 'filter before specified date (ISO8601)',
					type: 'string'
				},
				"limit": {
					description: 'limit of [n] results per page',
					type: 'integer',
					minimum: 1
				},
				"skip": {
					description: 'skip [n] results',
					type: 'integer',
					minimum: 0
				},
				"block": {
					description: 'filter by block',
					type: 'integer'
				},
				"hash": {
					description: 'hash for transaction',
					type: 'string'
				}
			},
		},
		response: {
			200: {
				description: "Success",
				type: "object",
				properties: {
					"transactions": {
						type: "array",
						items: {
							type: 'object',
							properties: makeTransactionSchema()
						}
					},
					"total": {
						type: "object",
						properties: {
							value: {type: "number"},
							relation: {type: "string"}
						}
					}
				}
			}
		}
	};
	addApiRoute(fastify, 'GET', 'v2/evm/get_transactions', getTransactionsHandler, schema);
	next();
}