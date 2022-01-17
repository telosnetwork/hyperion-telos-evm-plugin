const createKeccakHash = require('keccak')

export interface EthLog {
    address: string;
    blockHash: string;
    blockNumber: string;
    data: string;
    logIndex: string;
    removed: boolean;
    topics: string[];
    transactionHash: string;
    transactionIndex: string;
}

export function numToHex(input: number | string) {
    if (typeof input === 'number') {
        return '0x' + input.toString(16)
    } else {
        return '0x' + (parseInt(input, 10)).toString(16)
    }
}

export function toChecksumAddress(address) {
    if (!address)
        return address

    address = address.toLowerCase().replace('0x', '')
    if (address.length != 40)
        address = address.padStart(40, "0");

    let hash = createKeccakHash('keccak256').update(address).digest('hex')
    let ret = '0x'

    for (var i = 0; i < address.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            ret += address[i].toUpperCase()
        } else {
            ret += address[i]
        }
    }

    return ret
}

export function blockHexToHash(blockHex: string) {
    return `0x${createKeccakHash('keccak256').update(blockHex.replace(/^0x/, '')).digest('hex')}`;
}

export function buildLogsObject(logs: any[], blHash: string, blNumber: string, txHash: string, txIndex: string): EthLog[] {
    const _logs: EthLog[] = [];
    if (logs) {
        let counter = 0;
        for (const log of logs) {
            _logs.push({
                address: toChecksumAddress(log.address),
                blockHash: blHash,
                blockNumber: blNumber,
                data: "0x" + log.data,
                logIndex: numToHex(counter),
                removed: false,
                topics: log.topics.map(t => '0x' + t.padStart(64, '0')),
                transactionHash: txHash,
                transactionIndex: txIndex
            });
            counter++;
        }
    }
    return _logs;
}

export function makeLogObject(rawActionDocument, log, forSubscription) {
    let baseLogObj = {
        address: '0x' + log.address,
        blockHash: '0x' + rawActionDocument['@raw']['block_hash'],
        blockNumber: numToHex(rawActionDocument['@raw']['block']),
        data: '0x' + log.data,
        logIndex: numToHex(log.logIndex),
        topics: log.topics.map(t => '0x' + t.padStart(64, '0')),
        transactionHash: rawActionDocument['@raw']['hash'],
        transactionIndex: numToHex(rawActionDocument['@raw']['trx_index'])
    }

    if (forSubscription)
        return baseLogObj;

    return Object.assign(baseLogObj, {
        removed: false,
    });
}

export function logFilterMatch(log, addressFilter, topicsFilter) {
    if (addressFilter) {
        let thisAddr = log.address.toLowerCase();
        addressFilter = removeZeroHexFromFilter(addressFilter);
        if (Array.isArray(addressFilter) && !addressFilter.includes(thisAddr)) {
            // console.log('filter out by addressFilter as array');
            return false;
        }

        if (!Array.isArray(addressFilter) && thisAddr != addressFilter) {
            // console.log('filter out by addressFilter as string');
            return false;
        }
    }

    if (topicsFilter) {
        if (!hasTopics(log.topics, topicsFilter)) {
            // console.log('filter out by topics');
            return false;
        }
    }

    return true;
}

function removeZeroHexFromFilter(filter) {
    if (!filter)
        return filter;

    if (Array.isArray(filter)) {
        return filter.map((f) => {
            if (!f)
                return f;

            return f.replace(/^0x/, '').toLowerCase();
        })
    }

    return filter.replace(/^0x/, '').toLowerCase();
}

export function hasTopics(topics: string[], topicsFilter: string[]) {
    const topicsFiltered = [];
    // console.log(`filtering ${JSON.stringify(topics)} by filter: ${JSON.stringify(topicsFilter)}`);
    topics = removeZeroHexFromFilter(topics);
    topicsFilter = topicsFilter.map(t => {
        return removeZeroHexFromFilter(t);
    })

    for (const [index,topic] of topicsFilter.entries()) {
        if (topic === null) {
            topicsFiltered.push(true);
        } else if (topic.includes(topics[index])) {
            topicsFiltered.push(true);
        } else if (topics[index] === topic) {
            topicsFiltered.push(true);
        } else {
            topicsFiltered.push(false);
        }
    }
    return topicsFiltered.every(t => t === true);
}