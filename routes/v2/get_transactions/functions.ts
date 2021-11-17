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

export function formatRawToTransaction(rawAction) {
    let raw = rawAction["@raw"];
    return raw;
}

export function applyAddressFilter(query, queryStruct) {
    const address = query.address.replace(/^0x/, '').replace(/^0*/, '').toLowerCase();
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