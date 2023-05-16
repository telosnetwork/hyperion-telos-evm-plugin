const createKeccakHash = require('keccak')
const BN = require('bn.js');

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


export const NULL_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const KECCAK256_RLP_ARRAY = '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347';

export const NULL_TRIE = '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421';

const EMPTY_LOGS = '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

const BLOCK_GAS_LIMIT = '0x0'

const NEW_HEADS_TEMPLATE =
    {
        difficulty: "0x0",
        extraData: NULL_HASH,
        gasLimit: BLOCK_GAS_LIMIT,
        miner: ZERO_ADDR,
        nonce: "0x0000000000000000",
        parentHash: NULL_HASH,
        receiptsRoot: NULL_TRIE,
        sha3Uncles: KECCAK256_RLP_ARRAY,
        stateRoot: NULL_TRIE,
        transactionsRoot: NULL_TRIE,
    };

const BLOCK_TEMPLATE =
    Object.assign({
        mixHash: NULL_HASH,
        size: "0x21e",
        totalDifficulty: "0x0",
        uncles: []
    }, NEW_HEADS_TEMPLATE);

export { BLOCK_TEMPLATE, NEW_HEADS_TEMPLATE, EMPTY_LOGS }

export function numToHex(input: number | string) {
    if (typeof input === 'number') {
        return '0x' + input.toString(16)
    } else {
        return '0x' + new BN(input).toString(16)
    }
}

export function toChecksumAddress(address) {
    if (!address)
        return null

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

export function getParentBlockHash(blockNumberHex: string) {
    let blockNumber = parseInt(blockNumberHex, 16);
    let parentBlockHex = (blockNumber - 1).toString(16);
    return blockHexToHash(parentBlockHex);
}

export function blockHexToHash(blockHex: string, zeroXPrefix: boolean = true) {
    return `${zeroXPrefix ? '0x' : ''}${createKeccakHash('keccak256').update(blockHex.replace(/^0x/, '')).digest('hex')}`;
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
        address: toChecksumAddress('0x' + log.address),
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
        let thisAddr = removeZeroHexFromFilter(log.address.toLowerCase(), true);
        addressFilter = removeZeroHexFromFilter(addressFilter, true);
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

export function leftPadZerosEvenBytes(value) {
    let removed = value.replace(/^0x/, '');
    return removed.length % 2 === 0 ? `0x${removed}` : `0x0${removed}`
}

export function leftPadZerosToWidth(value, width) {
    let removed = value.replace(/^0x/, '');
    return `0x${removed.padStart(width, '0')}`
}

export function removeLeftZeros(value, zeroXPrefix=true) {
    let removed =`${value.replace(/^0x/, '').replace(/^(0)*/, '')}`;
    if (removed === '')
        removed = '0';

    return zeroXPrefix ? `0x${removed}` : removed;
}

export function removeZeroHexFromFilter(filter, trimLeftZeros=false) {
    if (!filter)
        return filter;

    if (Array.isArray(filter)) {
        return filter.map((f) => {
            if (!f)
                return f;

            let noPrefix = f.replace(/^0x/, '').toLowerCase();
            return trimLeftZeros ? noPrefix.replace(/^(00)+/, '') : noPrefix;
        })
    }

    let noPrefix = filter.replace(/^0x/, '').toLowerCase();
    return trimLeftZeros ? noPrefix.replace(/^(00)+/, '') : noPrefix;
}

export function hasTopics(topics: string[], topicsFilter: string[]) {
    const topicsFiltered = [];
    // console.log(`filtering ${JSON.stringify(topics)} by filter: ${JSON.stringify(topicsFilter)}`);
    topics = removeZeroHexFromFilter(topics, true);
    topicsFilter = topicsFilter.map(t => {
        return removeZeroHexFromFilter(t, true);
    })

    for (const [index,filterTopic] of topicsFilter.entries()) {
        const topic = topics[index];
        if (filterTopic === null) {
            topicsFiltered.push(true);
        } else if (topic === filterTopic) {
            topicsFiltered.push(true);
        } else if (topic !== '' && filterTopic.includes(topic)) {
            topicsFiltered.push(true);
        } else {
            topicsFiltered.push(false);
        }
    }
    return topicsFiltered.every(t => t === true);
}
