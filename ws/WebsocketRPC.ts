import uWS, {TemplatedApp} from "uWebSockets.js";
import WebSocket from "ws";
import {TelosEvmConfig} from "../types";
import {keccak256} from "ethereumjs-util";
import Subscription from "./Subscription";
import LogSubscription from "./LogSubscription";

export default class WebsocketRPC {

    config: TelosEvmConfig
    websocketRPC: TemplatedApp
    websocketClient: WebSocket
    rpcHandlerContainer: any
    subscriptions: Map<string, Subscription>


    constructor(config: TelosEvmConfig, rpcHandlerContainer: any) {
        this.config = config;
        this.initUWS();
        this.initWSClient();
        this.rpcHandlerContainer = rpcHandlerContainer;
        this.subscriptions = new Map();
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
            upgrade: (res, req, context) => {
                let ip = req.getHeader('x-forwarded-for') || '';
                if (Array.isArray(ip))
                    ip = ip[0] || ''

                if (ip.includes(','))
                    ip = ip.substr(0, ip.indexOf(','));

                let origin;
                if (req.getHeader('origin') === 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') {
                    origin = 'MetaMask';
                } else {
                    if (req.getHeader('origin')) {
                        origin = req.getHeader('origin');
                    } else {
                        origin = req.getHeader('user-agent');
                    }
                }

                res.upgrade(
                   { clientInfo: {ip, origin} },
                    req.getHeader('sec-websocket-key'),
                    req.getHeader('sec-websocket-protocol'),
                    req.getHeader('sec-websocket-extensions'),
                    context
                )
            },
            message: (ws, msg) => {
                this.handleMessage(ws, msg);
            },
            drain: () => {
            },
            close: (ws) => {
                for (const [subId, sub] of this.subscriptions)
                    sub.removeWs(ws)
            },
        }).listen(host, port, (token) => {
            if (token) {
                console.log('Listening to port ' + port);
            } else {
                console.log('Failed to listen to port ' + port);
            }
        });
    }

    makeResponse(originalMessage, result) {
        return {"jsonrpc": "2.0", result, id: originalMessage.id};
    }

    makeError(message, id=null, code=-32600) {
        return {"jsonrpc": "2.0", "error": {code, message}, id};
    }

    async handleMessage(ws, msg) {
        const buffer = Buffer.from(msg);
        const string = buffer.toString();
        try {
            const msgObj = JSON.parse(string);
            if (!msgObj.method) {
                ws.send(this.makeError("Invalid Request, no method specified", msgObj.id ? msgObj.id : null));
                return;
            }

            const method = msgObj.method;
            if (method == "eth_subscribe" || method === "eth_unsubscribe") {
                this.handleSubscription(ws, msgObj);
                return;
            }

            const rpcResponse = await this.rpcHandlerContainer.handler(msgObj, ws.clientInfo);
            ws.send(JSON.stringify(rpcResponse));
        } catch (e) {
            console.error(`Failed to parse websocket message: ${string} error: ${e.message}`);
        }
    }

    async handleSubscription(ws, msgObj) {
        switch (msgObj.params[0]) {
            case 'logs':
                this.handleLogSubscription(ws, msgObj);
                break;
            default:
                ws.send(JSON.stringify(this.makeError(`Subscription type ${msgObj.params[0]} is not supported`, msgObj.id)));
                break;
        }
    }

    async handleLogSubscription(ws, msgObj) {
        const filter = msgObj.params[1];
        const subscriptionId = LogSubscription.makeId(filter);
        if (!this.subscriptions.has(subscriptionId)) {
            this.subscriptions.set(subscriptionId, new LogSubscription(this.websocketRPC, subscriptionId, filter))
        }

        this.subscriptions.get(subscriptionId).addWs(ws);
        ws.send(JSON.stringify(this.makeResponse(subscriptionId, msgObj)));
    }

    handleIndexerMessage(data) {
        console.log("GOT DATA: " + data);
        for (const [subId, sub] of this.subscriptions) {
            sub.handleRawAction(data);
        }
    }


}