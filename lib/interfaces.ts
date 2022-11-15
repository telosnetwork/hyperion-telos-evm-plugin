export interface TelosEvmConfig {
    signer_account: string;
    signer_permission: string;
    signer_key: string;
    contracts: {
        main: string;
    }
    chainId: number;
    debug: boolean;
    indexerWebsocketHost: string;
    indexerWebsocketPort: number;
    indexerWebsocketUri: string;
    rpcWebsocketHost: string;
    rpcWebsocketPort: number;
    rpcPayloadHandler: any;
}
