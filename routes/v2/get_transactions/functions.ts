export function addSortedBy(query, queryBody, sort_direction) {
    if (query['sortedBy']) {
        const opts = query['sortedBy'].split(":");
        const sortedByObj = {};
        sortedByObj[opts[0]] = opts[1];
        queryBody['sort'] = sortedByObj;
    } else {
        queryBody['sort'] = {
            "global_sequence": sort_direction
        };
    }
}

export function makeTransactionSchema() {
    return {
        "hash": {
            description: 'Transaction hash, hex string',
            type: 'string'
        },
        "trx_index": {
            description: 'The index this transaction was in the block',
            type: 'integer',
            minimum: 0
        },
        "block": {
            description: 'The block this transaction was in',
            type: 'integer',
            minimum: 0
        },
        "block_hash": {
            description: 'The block hash of block this transaction was in, hex string',
            type: 'string'
        },
        "input_data": {
            description: 'The input data of this transaction, hex string',
            type: 'string'
        },
        "value": {
            description: 'The TLOS value transferred with this transaction',
            type: 'integer',
            minimum: 0
        },
        "nonce": {
            description: 'Transaction nonce',
            type: 'integer',
            minimum: 0
        },
        "gas_price": {
            description: 'Approved gas price for this transaction, in WEI.  Note the charged gas price may be lower',
            type: 'integer',
            minimum: 0
        },
        "gas_limit": {
            description: 'The gas limit of this transaction',
            type: 'integer',
            minimum: 0
        },
        "status": {
            description: '0 or 1, 0 is failure, 1 is success',
            type: 'integer',
            minimum: 0
        },
        "itxs": {
            description: 'Internal transactions',
            type: 'array'
        },
        "epoch": {
            description: 'The epoch of this transaction',
            type: 'integer',
            minimum: 0
        },
        "createdaddr": {
            description: 'The address of the contract created by this transaction, hex string',
            type: 'string'
        },
        "gasused": {
            description: 'The gas used by this transaction',
            type: 'integer',
            minimum: 0
        },
        "gasusedblock": {
            description: 'The gas used by this block at this transaction index',
            type: 'integer',
            minimum: 0
        },
        "charged_gas_price": {
            description: 'The gas price charged by this transaction',
            type: 'integer',
            minimum: 0
        },
        "output": {
            description: 'The transaction output, hex string',
            type: 'string'
        },
        "from": {
            description: 'The sending address of this transaction, hex string',
            type: 'string'
        },
        "to": {
            description: 'The receiving address of this transaction, hex string',
            type: 'string'
        },
        "v": {
            description: 'v from the signature',
            type: 'string'
        },
        "r": {
            description: 'r from the signature',
            type: 'string'
        },
        "s": {
            description: 's from the signature',
            type: 'string'
        },
    }
}

export function formatRawToTransaction(rawAction) {
    let raw = rawAction["@raw"];
    return {
        ...raw,
        block_hash: `0x${raw.block_hash}`,
        value: parseInt(raw.value),
        nonce: parseInt(raw.nonce),
        gas_price: parseInt(raw.gas_price),
        gas_limit: parseInt(raw.gas_limit),
        createdaddr: raw.createdaddr ? `0x${raw.createdaddr}` : '',
        output: `0x${raw.output}`,
        v: `0x${raw.v}`,
        r: `0x${raw.r}`,
        s: `0x${raw.s}`
    };
}

export function applyHashFilter(query, queryStruct) {
    if (!query.hash)
        return;

    let hash = query.hash.toLowerCase();

    queryStruct.bool.must.push({
        "bool": {
            "must": {
                "term": {
                    "@raw.hash": hash
                }
            }
        }
    })
}

export function applyBlockFilter(query, queryStruct) {
    if (!query.block)
        return;

    const block = query.block;
    queryStruct.bool.must.push({
        "bool": {
            "must": {
                "term": {
                    "@raw.block": block
                }
            }
        }
    })
}

export function applyAddressFilter(query, queryStruct) {
    if (!query.address)
        return;

    const address = query.address.toLowerCase();
    queryStruct.bool.must.push({
        "bool": {
            "should": [
                {
                    "term": {
                        "@raw.createdaddr": address
                    }
                },{
                    "term": {
                        "@raw.from": address
                    }
                },{
                    "term": {
                        "@raw.to": address
                    }
                }
            ]
        }
    });
}

export function applyTimeFilter(query, queryStruct) {
    if (query['after'] || query['before']) {
        let _lte = "now";
        let _gte = "0";
        if (query['before']) {
            try {
                _lte = new Date(query['before']).toISOString();
            } catch (e) {
                throw new Error(e.message + ' [before]');
            }
        }
        if (query['after']) {
            try {
                _gte = new Date(query['after']).toISOString();
            } catch (e) {
                throw new Error(e.message + ' [after]');
            }
        }
        if (!queryStruct.bool['filter']) {
            queryStruct.bool['filter'] = [];
        }
        queryStruct.bool['filter'].push({
            range: {
                "@timestamp": {
                    "gte": _gte,
                    "lte": _lte
                }
            }
        });
    }
}

export function getSkipLimit(query, max?: number) {
    let skip, limit;
    skip = parseInt(query.skip, 10);
    if (skip < 0) {
        throw new Error('invalid skip parameter');
    }
    limit = parseInt(query.limit, 10);
    if (limit < 1) {
        throw new Error('invalid limit parameter');
    } else if (limit > max) {
        throw new Error(`limit too big, maximum: ${max}`);
    }
    return {skip, limit};
}

export function getSortDir(query) {
    let sort_direction = 'desc';
    if (query.sort) {
        if (query.sort === 'asc' || query.sort === '1') {
            sort_direction = 'asc';
        } else if (query.sort === 'desc' || query.sort === '-1') {
            sort_direction = 'desc'
        } else {
            throw new Error('invalid sort direction');
        }
    }
    return sort_direction;
}