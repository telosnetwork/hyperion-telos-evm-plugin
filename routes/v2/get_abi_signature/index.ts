import {FastifyInstance, FastifySchema} from "fastify";
import {getAbiSignatureHandler} from "./get_abi_signature";
import {addApiRoute} from "../../../../../../api/helpers/functions";

export default function (fastify: FastifyInstance, opts: any, next) {
	const schema: any = {
		summary: 'get abi for a given function or event signature',
		tags: ['evm'],
		querystring: {
			type: 'object',
			properties: {
				"hex": {
					description: 'function or event hex signature',
					type: 'string',
					minLength: 8,
					maxLength: 66
				},
				"type": {
					description: 'type of signature, options are function or event',
					type: 'string',
					default: 'function'
				}
			},
			required: ["hex"]
		},
		response: {
			200: {
				description: "Success",
				type: "string"
			}
		}
	};
	addApiRoute(fastify, 'GET', 'v2/evm/get_abi_signature', getAbiSignatureHandler, schema);
	next();
}