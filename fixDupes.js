const { Client } = require('@elastic/elasticsearch')
const eosjs = require('eosjs');
const JsonRpc = eosjs.JsonRpc;
const fetch = require("node-fetch"); // node only; not needed in browsers

//const nodeUrl = 'https://testnet.telos.caleos.io';
const nodeUrl = 'https://telos.caleos.io';
const ACTION_INDEX_PATTERN = 'telos-mainnet-action-*';

const rpc = new JsonRpc(nodeUrl, { fetch });

const client = new Client({
    node: 'http://localhost:9200',
    auth: {
        username: 'elastic',
        password: 'password'
    }
})

async function run () {
    let blockMap = {};

    const query = {
        "aggs": {
            "duplicateCount": {
                "terms": {
                    "field": "trx_id",
                    "min_doc_count": 2
                },
                "aggs": {
                    "duplicateDocuments": {
                        "top_hits": {}
                    }
                }
            }
        }
    };
    /*
    {
  "size": 0,
  "aggs": {
    "my_buckets": {
      "composite": {
        "sources": [
          { "product": { "terms": { "field": "product" } } }
        ]
      }
    }
  }
}
     */

    const compQuery = {
        "size": 0,
        "aggs": {
            "duplicateCount": {
                "sources": {
                    "trx": {
                        "field": "trx_id",
                        "min_doc_count": 2
                    }
                },
                "aggs": {
                    "duplicateDocuments": {
                        "top_hits": {}
                    }
                }
            }
        }
    }

    const result = await client.search({
        index: ACTION_INDEX_PATTERN,
        size: 0,
        body: query
    })
    let buckets = result.body.aggregations.duplicateCount.buckets;
    let count = 0;
    for (let bucket of buckets) {
        console.log(`${++count} ========== ${bucket.key}`);
        const hits = bucket.duplicateDocuments.hits.hits;
        for (let hit of hits) {
            let doc = hit._source;
            const blockResult = await rpc.get_block(doc.block_num);
            blockMap[doc.block_id] = {blockNumber: doc.block_num, wasForked: (blockResult.id !== doc.block_id)};
            console.log(`${doc.block_num} -- ${doc.block_id} ${doc.rec} ${doc.act.account}::${doc.act.name} ${blockMap[doc.block_id].wasForked ? "FORKED" : "VALID"}`);
        }
    }

    for (let blockId in blockMap) {
        if (!blockMap[blockId].wasForked) {
            continue;
        }

        const searchBody = {
            query: {bool: {must: [{term: {block_id: blockId}}]}}
        };
        console.log("Deleting actions from blockId: " + blockId);

        let result = await client.deleteByQuery({
            index: ACTION_INDEX_PATTERN,
            refresh: true,
            body: searchBody
        });
        console.log("Deleted: " + result.body.deleted);
    }

    /*
                    const searchBody = {
                    query: {bool: {must: [{term: {block_id: targetBlockId}}]}}
                };

                // remove deltas
                await new Promise<void>((resolve) => {
                    setTimeout(async () => {
                        const dbqResult = await this.client.deleteByQuery({
                            index: this.chain + '-delta-' + this.conf.settings.index_version + '-*',
                            refresh: true,
                            body: searchBody
                        });
     */
    //console.log(JSON.stringify(blockMap, null, 4));
}
run().catch(console.log);