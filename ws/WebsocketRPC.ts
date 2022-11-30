import uWS, {TemplatedApp} from "uWebSockets.js";
import ReconnectingWebSocket from "reconnecting-websocket";
import WebSocket from "ws";
import {TelosEvmConfig} from "../types";
import {keccak256} from "ethereumjs-util";
import Subscription from "./Subscription";
import LogSubscription from "./LogSubscription";

const NEW_HEADS_SUBSCRIPTION = "0x9ce59a13059e417087c02d3236a0b1cd"

export default class WebsocketRPC {

    config: TelosEvmConfig
    websocketRPC: TemplatedApp
    websocketClient: ReconnectingWebSocket
    rpcHandlerContainer: any
    logSubscriptions: Map<string, LogSubscription>
    headSubscription: Subscription


    constructor(config: TelosEvmConfig, rpcHandlerContainer: any) {
        this.config = config;
        this.initUWS();
        this.initWSClient();
        this.rpcHandlerContainer = rpcHandlerContainer;
        this.logSubscriptions = new Map();
        this.headSubscription = new Subscription(this.websocketRPC, NEW_HEADS_SUBSCRIPTION);
    }

    initWSClient() {
        this.websocketClient = new ReconnectingWebSocket(this.config.indexerWebsocketUri, [], {WebSocket});
        this.websocketClient.addEventListener('message', (data) => {
            this.handleIndexerMessage(data.data);
        })
    }

    initUWS() {
        const host = this.config.rpcWebsocketHost;
        const port = this.config.rpcWebsocketPort;
        this.websocketRPC = uWS.App({}).ws('/evm', {
            compression: 0,
            maxPayloadLength: 16 * 1024 * 1024,
            idleTimeout: 30,
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
                this.headSubscription.removeWs(ws, true);
                for (const [subId, sub] of this.logSubscriptions)
                    sub.removeWs(ws, true)
            },
        }).listen(host, port, (token) => {
            if (token) {
                console.log('Listening to port ' + port);
            } else {
                console.log('Failed to listen to port ' + port);
            }
        });
    }

    makeResponse(result, originalMessage) {
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
            if (method == "eth_subscribe") {
                this.handleSubscription(ws, msgObj);
                return;
            }

            if (method === "eth_unsubscribe") {
                if (!msgObj?.params?.length) {
                    ws.send(JSON.stringify(this.makeError("Subscription ID should be provided as first parameter", msgObj.id)))
                    return;
                }
                const subscriptionId = msgObj.params[0];
                if (subscriptionId === NEW_HEADS_SUBSCRIPTION) {
                    this.headSubscription.removeWs(ws, false);
                } else {
                    this.logSubscriptions.forEach((sub) => {
                        if (sub.getId() === subscriptionId)
                            sub.removeWs(ws, false);

                        if (!sub.hasClients())
                            this.logSubscriptions.delete(sub.getId());
                    });
                }
                ws.send(JSON.stringify(this.makeResponse(true, msgObj)));
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
            case 'newHeads':
                this.handleNewHeadsSubscription(ws, msgObj);
                break;
            default:
                ws.send(JSON.stringify(this.makeError(`Subscription type ${msgObj.params[0]} is not supported`, msgObj.id)));
                break;
        }
    }

    async handleLogSubscription(ws, msgObj) {
        const filter = msgObj.params[1];
        const subscriptionId = LogSubscription.makeId(filter);
        if (!this.logSubscriptions.has(subscriptionId)) {
            this.logSubscriptions.set(subscriptionId, new LogSubscription(this.websocketRPC, subscriptionId, filter, this.config.debug))
        }

        this.logSubscriptions.get(subscriptionId).addWs(ws);
        ws.send(JSON.stringify(this.makeResponse(subscriptionId, msgObj)));
    }

    async handleNewHeadsSubscription(ws, msgObj) {
        this.headSubscription.addWs(ws);
        ws.send(JSON.stringify(this.makeResponse(this.headSubscription.getId(), msgObj)));
    }

    handleIndexerMessage(data) {
        const dataObj = JSON.parse(data);
        switch (dataObj.type) {
            case 'raw':
                this.handleRawMessage(dataObj.data);
                break;
            case 'head':
                this.handleHeadMessage(dataObj.data);
                break;
            default:
                break;
        }
    }

    handleRawMessage(data) {
        for (const [subId, sub] of this.logSubscriptions) {
            sub.handleRawAction(data);
        }
    }

    handleHeadMessage(data) {
        this.headSubscription.publish(data);
    }

}