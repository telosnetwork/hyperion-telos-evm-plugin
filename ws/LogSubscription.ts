import Subscription from "./Subscription";
import { TemplatedApp, WebSocket } from "uWebSockets.js";
import {keccak256} from "ethereumjs-util";

export default class LogSubscription extends Subscription {

    filter: any

    constructor(wsServer: TemplatedApp, id: string, filter: any) {
        super(wsServer, id);
        this.filter = filter;
    }

    handleRawAction(rawAction: any): void {
        console.log(`Subscription ${this.id} got rawAction: ${JSON.stringify(rawAction, null, 4)}`)
    }

    static makeId(filter) {
        const toHash = JSON.stringify({
            address: filter.address ? filter.address.sort() : [],
            topics: filter.topics ? filter.topics : []
        })

        return `0x${keccak256(Buffer.from(toHash)).slice(0, 32)}`;
    }

}
