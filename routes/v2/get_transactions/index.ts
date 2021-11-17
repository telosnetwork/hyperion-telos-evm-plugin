import {FastifyInstance, FastifySchema} from "fastify";
import {getTransactionsHandler} from "./get_transactions";
import {addApiRoute, getRouteName} from "../../../../../../api/helpers/functions";
import {getActionResponseSchema} from "../../../../../../api/routes/v2-history/get_actions";

export default function (fastify: FastifyInstance, opts: any, next) {
	const schema: any = {
		summary: 'get transactions for address',
		tags: ['evm'],
		querystring: {
			type: 'object',
			properties: {
				"address": {
					description: 'address address',
					type: 'string',
					minLength: 42,
					maxLength: 42
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
				}
			},
			required: ["address"]
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