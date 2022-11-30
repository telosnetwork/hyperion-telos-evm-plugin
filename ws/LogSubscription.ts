import Subscription from "./Subscription";
import { TemplatedApp, WebSocket } from "uWebSockets.js";
import {keccak256} from "ethereumjs-util";
import {logFilterMatch, makeLogObject} from "../utils";

export default class LogSubscription extends Subscription {

    filter: any
    debug: boolean

    constructor(wsServer: TemplatedApp, id: string, filter: any, debug: boolean) {
        super(wsServer, id);
        this.filter = filter;
        this.debug = debug;
    }

    handleRawAction(rawAction: any): void {
        if (this.debug)
            console.log(`Subscription ${this.id} got rawAction: ${JSON.stringify(rawAction, null, 4)}`)

        const logs = rawAction["@raw"].logs || [];
        let logCount = 0;
        this.filterMatches(logs).forEach(log => {
            log.logIndex = logCount++;
            this.publish(JSON.stringify(this.makeLogSubscription(rawAction, log)));
        });
    }

    filterMatches(logs): Array<any> {
        const addrFilter = this.filter.address;
        const topicFilter = this.filter.topics;
        return logs.filter(log => {
            return logFilterMatch(log, addrFilter, topicFilter);
        });
    }

    makeLogSubscription(rawAction: any, log: any): any {
        return {
            "jsonrpc": "2.0",
            "method": "eth_subscription",
            "params": {
                "subscription": this.getId(),
                "result": makeLogObject(rawAction, log, true)
            }
        };
    }

    static makeId(filter) {
        const toHash = JSON.stringify({
            address: filter.address ? Array.isArray(filter.address) ? filter.address.sort() : filter.address : [],
            topics: filter.topics ? filter.topics : []
        })

        return `0x${keccak256(Buffer.from(toHash)).toString('hex').slice(0, 32)}`;
    }

}
