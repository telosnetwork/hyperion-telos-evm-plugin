import uWS, {TemplatedApp} from "uWebSockets.js";
import {TelosEvmConfig} from "../types";

export default class RawActionBroadcaster {

    config: TelosEvmConfig
    broadcastServer: TemplatedApp

    constructor(config: TelosEvmConfig) {
        this.config = config;
        this.initUWS();
    }

    initUWS() {
        const host = this.config.indexerWebsocketHost;
        const port = this.config.indexerWebsocketPort;
        this.broadcastServer = uWS.App({
        }).ws('/evm', {
            compression: 0,
            maxPayloadLength: 16 * 1024 * 1024,
            /* We need a slightly higher timeout for this crazy example */
            idleTimeout: 60,
            open: (ws) => ws.subscribe('raw'),
            message: () => {},
            drain: () => {},
            close: () => {},
        }).listen(host, port, (token) => {
            if (token) {
                console.log('Listening to port ' + port);
            } else {
                console.log('Failed to listen to port ' + port);
            }
        });
    }

    broadcastRaw(rawAction) {
        if (!this.broadcastServer) {
            console.error("RawActionBroadcaster.broadcastRaw was called before broadcastServer was set");
            return;
        }

        this.broadcastServer.publish('raw', rawAction);
    }
}