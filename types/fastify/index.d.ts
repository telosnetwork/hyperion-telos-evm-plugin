import {Api, JsonRpc} from "eosjs";

interface EOSJS {
    rpc: JsonRpc,
    api: Api
}

declare module 'fastify' {
    export interface FastifyInstance {
        evm: any;
    }
}
