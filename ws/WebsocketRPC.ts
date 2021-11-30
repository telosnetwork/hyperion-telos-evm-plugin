import uWS, {TemplatedApp} from "uWebSockets.js";
import WebSocket from "ws";
import {TelosEvmConfig} from "../types";
import fastify, {FastifyInstance} from "fastify";

export default class WebsocketRPC {

    config: TelosEvmConfig
    websocketRPC: TemplatedApp
    websocketClient: WebSocket
    rpcHandlerContainer: any

    constructor(config: TelosEvmConfig, rpcHandlerContainer: any) {
        this.config = config;
        this.initUWS();
        this.initWSClient();
        this.rpcHandlerContainer = rpcHandlerContainer;
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
            message: (ws, msg) => {
                this.handleMessage(ws, msg);
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

    async handleMessage(ws, msg) {
        const buffer = Buffer.from(msg);
        const string = buffer.toString();
        try {
            const msgObj = JSON.parse(string);
            if (!msgObj.method) {
                ws.send({"jsonrpc": "2.0", "error": {"code": -32600, "message": "Invalid Request, no method specified"}, "id": msgObj.id ? msgObj.id : null})
                return;
            }

            const ip = Buffer.from(ws.getRemoteAddressAsText()).toString();
            const origin = "Websocket Client";
            const usage = 0;
            const limit = 0;
            const clientInfo = { ip, origin, usage, limit };
            const rpcResponse = await this.rpcHandlerContainer.handler(msg, clientInfo);
            ws.send(JSON.stringify(rpcResponse));
        } catch (e) {
            console.error(`Failed to parse websocket message: ${string} error: ${e.message}`);
        }
    }

    handleIndexerMessage(data) {
        console.log("GOT DATA: " + data);
    }


}