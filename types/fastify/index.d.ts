import {Api, JsonRpc} from "eosjs";
import {APIClient, Name, PrivateKey} from "@greymass/eosio";

interface EOSJS {
    rpc: JsonRpc,
    api: Api
}

declare module 'fastify' {
    export interface FastifyInstance {
        evm: any;
        rpcPayloadHandlerContainer: any;
        cachingApi: any;
        readApi: APIClient;
        rpcAccount: Name;
        rpcPermission: Name;
        rpcKey: PrivateKey;
    }
}
