import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {timedQuery, getTrackTotalHits} from "../../../../../../api/helpers/functions";
import {
	getSkipLimit,
	getSortDir,
	applyHashFilter,
	applyBlockFilter,
	applyAddressFilter,
	applyTimeFilter,
	addSortedBy,
	formatRawToTransaction
} from "./functions";

async function getTransactions(fastify: FastifyInstance, request: FastifyRequest) {

	const query: any = request.query;
	const maxActions = fastify.manager.config.api.limits.get_actions;
	const queryStruct = {
		"bool": {
			filter: [
				 {
					"term": {
						"act.name": "raw"
					}
				},{
					"term": {
						"act.account": fastify.evm.telos.telosContract
					}
				}
			],
			must: [],
			must_not: [],
			boost: 1.0
		}
	};

	const {skip, limit} = getSkipLimit(query, maxActions);
	const sort_direction = getSortDir(query);
	applyTimeFilter(query, queryStruct);
	applyAddressFilter(query, queryStruct);
	applyBlockFilter(query, queryStruct);
	applyHashFilter(query, queryStruct);

	// allow precise counting of total hits
	const trackTotalHits = getTrackTotalHits(query);

	// Prepare query body
	const query_body = {
		"track_total_hits": trackTotalHits,
		"query": queryStruct
	};

	// Include sorting
	addSortedBy(query, query_body, sort_direction);

	const esResults = await fastify.elastic.search({
		"index": fastify.manager.chain + '-action-*',
		"from": skip || 0,
		"size": (limit > maxActions ? maxActions : limit) || 10,
		"body": query_body
	});

	const results = esResults['body']['hits'];
	const response: any = {
		total: results['total'],
		transactions: []
	};

	const transactions = results.hits;
	for (let transaction of transactions) {
		transaction = transaction._source;
		response.transactions.push(formatRawToTransaction(transaction))
	}

	return response;
}

export function getTransactionsHandler(fastify: FastifyInstance, route: string) {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		reply.send(await timedQuery(getTransactions, fastify, request, route));
	}
}
