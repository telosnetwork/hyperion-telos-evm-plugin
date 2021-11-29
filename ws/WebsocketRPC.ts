import uWS, {TemplatedApp} from "uWebSockets.js";
import WebSocket from "ws";
import {TelosEvmConfig} from "../types";
import fastify, {FastifyInstance} from "fastify";

export default class WebsocketRPC {

    config: TelosEvmConfig
    websocketRPC: TemplatedApp
    websocketClient: WebSocket
    fastify: any

    constructor(config: TelosEvmConfig, fastify: any) {
        this.config = config;
        this.initUWS();
        this.initWSClient();
        this.fastify = fastify;
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
            message: (msg) => {
                const rpcResponse = this.fastify.evmRpcHandler(msg);
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