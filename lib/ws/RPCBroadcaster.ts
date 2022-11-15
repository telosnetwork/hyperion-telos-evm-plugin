import uWS, {TemplatedApp} from "uWebSockets.js";
import {TelosEvmConfig} from "../interfaces.js";
import {getParentBlockHash, NEW_HEADS_TEMPLATE, numToHex} from "../utils.js";
import Bloom from "../bloom/index.js";

export default class RPCBroadcaster {

    config: TelosEvmConfig
    broadcastServer: TemplatedApp
    currentBlock: any


    constructor(config: TelosEvmConfig) {
        this.config = config;
        this.initUWS();
        this.resetBlock(0, 0);
    }

    resetBlock(number: number, epoch: number) {
        const blockHex = numToHex(number);
        this.currentBlock = {
            number,
            blockHex,
            gasUsed: 0,
            logsBloom: new Bloom(),
            timestamp: epoch
        }
    }

    initUWS() {
        const host = this.config.indexerWebsocketHost;
        const port = this.config.indexerWebsocketPort;
        this.broadcastServer = uWS.App({}).ws('/evm', {
            compression: 0,
            maxPayloadLength: 16 * 1024 * 1024,
            /* We need a slightly higher timeout for this crazy example */
            idleTimeout: 60,
            open: (ws) => ws.subscribe('broadcast'),
            message: () => {
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

    broadcastRaw(msg: string) {
        const rawAction = JSON.parse(msg);
        if (!this.broadcastServer) {
            console.error("RawActionBroadcaster.broadcastRaw was called before broadcastServer was set");
            return;
        }

        const raw = rawAction["@raw"];
        if (this.currentBlock.number < raw.block) {
            this.broadcastBlock();
            this.resetBlock(raw.block, raw.epoch);
        }

        const gasUsed = raw["gasusedblock"];
        if (gasUsed > this.currentBlock.gasUsed)
            this.currentBlock.gasUsed = gasUsed;

        if (raw['logsBloom']) {
            this.currentBlock.logsBloom.or(new Bloom(Buffer.from(raw['logsBloom'], "hex")));
        }

        this.broadcastData('raw', rawAction);
    }

    handleGlobalDelta(msg: string) {
        /*
       GLOBAL DELTA IS: {"code":"eosio","scope":"eosio","table":"global","primary_key":"7235159537265672192","payer":"eosio","@timestamp":"2021-11-30T22:52:35.000"
       ,"present":1,"block_num":120766,"block_id":"0001d7beab41d9ee734ef6b2796a2cd605374934cc0953514225957c0614614f","@global":{"max_block_net_usage":"1048576",
       "target_block_net_usage_pct":1000,"max_transaction_net_usage":1048575,"base_per_transaction_net_usage":12,"net_usage_leeway":500,"context_free_discount_net_usage_num":20,
       "context_free_discount_net_usage_den":100,"max_block_cpu_usage":200000,"target_block_cpu_usage_pct":1000,"max_transaction_cpu_usage":150000,"min_transaction_cpu_usage":100,
       "max_transaction_lifetime":3600,"deferred_trx_expiration_window":600,"max_transaction_delay":3888000,"max_inline_action_size":4096,"max_inline_action_depth":4,
       "max_authority_depth":6,"max_ram_size":"12884901888","total_ram_bytes_reserved":"493190126","total_ram_stake":"398000000","last_producer_schedule_update":"2000-01-01T00:00:00.000",
       "last_proposed_schedule_update":"2000-01-01T00:00:00.000","last_pervote_bucket_fill":"1970-01-01T00:00:00.000","pervote_bucket":"0","perblock_bucket":"0","total_unpaid_blocks":0,
       "total_activated_stake":"0","thresh_activated_stake_time":"1970-01-01T00:00:00.000","last_producer_schedule_size":0,"total_producer_vote_weight":0,
       "last_name_close":"2000-01-01T00:00:00.000","block_num":120759,"last_claimrewards":0,"next_payment":0,"new_ram_per_block":0,"last_ram_increase":"2021-11-30T06:06:21.500",
       "last_block_num":"2000-01-01T00:00:00.000","total_producer_votepay_share":0,"revision":0},"@evmBlockHash":"6cf32cd74239875f9e519afabdade4e0b46afce01fb38ce053ab933ade49f89d"}
         */
        const globalDelta = JSON.parse(msg);
        if (!this.broadcastServer) {
            console.error("RawActionBroadcaster.broadcastRaw was called before broadcastServer was set");
            return;
        }

        const global = globalDelta["@global"];
        if (global.block_num > this.currentBlock.number) {
            this.broadcastBlock();
            this.resetBlock(global.block_num, this.convertTimestampToEpoch(globalDelta["@timestamp"]))
        }
    }

    convertTimestampToEpoch(timestamp: string): number {
        return Math.floor(new Date(timestamp).getTime() / 1000);
    }

    private broadcastBlock() {
        const head = Object.assign({}, NEW_HEADS_TEMPLATE, {
            gasUsed: numToHex(this.currentBlock.gasUsed),
            logsBloom: "0x" + this.currentBlock.logsBloom.bitvector.toString("hex"),
            number: this.currentBlock.blockHex,
            parentHash: getParentBlockHash(this.currentBlock.blockHex),
            timestamp: "0x" + this.currentBlock.timestamp.toString(16),
        })

        this.broadcastData('head', JSON.stringify(head));
    }

    private broadcastData(type: string, data: string) {
        this.broadcastServer.publish('broadcast', JSON.stringify({type, data}));
    }
}
