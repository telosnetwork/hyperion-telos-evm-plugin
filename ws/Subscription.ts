import {TemplatedApp, WebSocket} from "uWebSockets.js";

export default class Subscription {

    wsServer: TemplatedApp
    wsClients: Map<WebSocket, any>
    id: string

    constructor(wsServer: TemplatedApp, id: string) {
        this.wsServer = wsServer;
        this.wsClients = new Map();
        this.id = id;
    }

    addWs(ws: WebSocket): void {
        if (!ws.isSubscribed(this.id))
            ws.subscribe(this.id);

        this.wsClients.set(ws, true);
    }

    removeWs(ws: WebSocket, isClosed: boolean): boolean {
        try {
            if (!isClosed && ws.isSubscribed(this.id))
                ws.unsubscribe(this.id);

            return this.wsClients.delete(ws);
        } catch (e) {
            console.error(`Error while removing websocket: ${e.message}`);
            return false;
        }
    }

    hasClients(): boolean {
        return this.wsClients.size > 0;
    }

    getId(): string {
        return this.id;
    }

    publish(msg: string) {
        try {
            this.wsServer.publish(this.id, msg);
        } catch (e) {
            console.error(`Error while publishing ${e.message}`);
        }
    }

}
