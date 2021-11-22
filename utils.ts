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