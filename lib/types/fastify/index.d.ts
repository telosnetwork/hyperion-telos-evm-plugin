import {Api, JsonRpc} from "enf-eosjs";

interface EOSJS {
    rpc: JsonRpc,
    api: Api
}

declare module 'fastify' {
    export interface FastifyInstance {
        evm: any;
        rpcPayloadHandlerContainer: any;
        cachingApi: any;
    }
}
