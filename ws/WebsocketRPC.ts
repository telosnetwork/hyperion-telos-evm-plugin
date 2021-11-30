import uWS, {TemplatedApp} from "uWebSockets.js";
import WebSocket from "ws";
import {TelosEvmConfig} from "../types";
import fastify, {FastifyInstance} from "fastify";

export default class WebsocketRPC {

    config: TelosEvmConfig
    websocketRPC: TemplatedApp
    websocketClient: WebSocket
    rpcHandler: any

    constructor(config: TelosEvmConfig, rpcHandler: any) {
        this.config = config;
        this.initUWS();
        this.initWSClient();
        this.rpcHandler = rpcHandler;
    }

    initWSClient() {
        this.websocketClient = new WebSocket(this.config.indexerWebsocketUri);
        this.websocketClient.on('message', (data) => {
            this.handleIndexerMessage(data);
        })
    }

    initUWS() {
        const host = this.config.rpcWebsocketHost;
        const port = this.config.rpcWebsocketPort;
        this.websocketRPC = uWS.App({}).ws('/evm', {
            compression: 0,
            maxPayloadLength: 16 * 1024 * 1024,
            open: () => {
            },
            message: async (msg) => {
                const rpcResponse = await this.rpcHandler(msg);
                console.log("GOT RESPONSE: ");
                console.dir(rpcResponse);
            },
            drain: () => {
            },
            close: () => {
            },
        }).listen(host, port, (token) => {
            if (token) {
                console.log('Listening to port ' + port);
            } else {
                console.log('Failed to listen to port ' + port);
            }
        });
    }

    handleIndexerMessage(data) {
        console.log("GOT DATA: " + data);
    }


}