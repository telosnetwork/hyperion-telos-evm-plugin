import {TemplatedApp, WebSocket} from "uWebSockets.js";

export default abstract class Subscription {

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

    removeWs(ws: WebSocket): boolean {
        if (ws.isSubscribed(this.id))
            ws.unsubscribe(this.id);

        return this.wsClients.delete(ws);
    }

    getId(): string {
        return this.id;
    }

    publish(msg: string) {
        this.wsServer.publish(this.id, msg);
    }

    abstract handleRawAction(rawAction: any): void


}
