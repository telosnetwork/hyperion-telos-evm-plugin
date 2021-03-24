import {Client} from "@elastic/elasticsearch";
import {Redis} from "ioredis";
import {Api, JsonRpc} from "eosjs/dist";
import {ConnectionManager} from "../../../../../connections/manager.class";

declare module 'fastify' {

	export interface FastifyInstance {
		manager: ConnectionManager
		redis: Redis;
		elastic: Client;
		eosjs: {
			rpc: JsonRpc,
			api: Api
		},
		chain_api: string,
		push_api: string
	}

	// export interface FastifyInstance<
	//     HttpServer = Server,
	//     HttpRequest = IncomingMessage,
	//     HttpResponse = ServerResponse,
	//     > {
	//     manager: ConnectionManager
	//     redis: Redis;
	//     elastic: Client;
	//     eosjs: {
	//         rpc: JsonRpc,
	//         api: Api
	//     },
	//     chain_api: string,
	//     push_api: string,
	//     tokenCache: Map<string, any>
	// }
}
