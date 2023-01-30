# Telos EVM RPC plugin for Hyperion API

Install plugin (hpm - hyperion plugin manager)

Hyperion History v3.3.5+ required
Hyperion > v3.3.7 untested.
```bash
# install from this repository
./hpm install -r https://github.com/telosnetwork/hyperion-telos-evm-plugin telos-evm
# enable the plugin globally
./hpm enable telos-evm
```

Required plugin config on chain.config.json

```json
{
  "plugins": {
    "telos-evm": {
      "enabled": true,
      "debug": false,
      "chainId": 41,
      "signer_account": "TELOS_ACCOUNT",
      "signer_permission": "active",
      "signer_key": "TELOS_PRIVATE_KEY",
      "contracts": {
        "main": "eosio.evm"
      },
      "indexerWebsocketHost": "0.0.0.0",
      "indexerWebsocketPort": "7300",
      "indexerWebsocketUri": "ws://127.0.0.1:7300/evm",
      "rpcWebsocketHost": "0.0.0.0",
      "rpcWebsocketPort": "7400"
    }
  }
}
```

And in the API section of chain.config.json
```json
    "v1_chain_cache": [
        {"path": "get_block", "ttl": 3000},
        {"path": "get_info", "ttl": 500},
        {"path": "get_gas_price", "ttl": 500},
        {"path": "last_onchain_block", "ttl": 500},
        {"path": "last_indexed_block", "ttl": 500}
    ],
    "rate_limit_rpm": 100000,
    "rate_limit_allow": ["<IP OF EXPLORER OR OTHERS>"]
```

### Implemented Routes

#### /evm (JSON RPC 2.0)

Methods:
  - eth_accounts
  - eth_blockNumber
  - eth_call
  - eth_chainId
  - eth_estimateGas
  - eth_getBalance
  - eth_getBlockByNumber
  - eth_getBlockByHash
  - eth_getBlockTransactionCountByNumber
  - eth_getBlockTransactionCountByHash
  - eth_getCode
  - eth_getLogs
  - eth_getStorageAt
  - eth_getTransactionCount
  - eth_getTransactionByHash
  - eth_getTransactionReceipt
  - eth_getUncleCountByBlockNumber
  - eth_getUncleCountByBlockHash
  - eth_gasPrice
  - eth_sendTransaction
  - eth_sendRawTransaction
  - net_listening
  - net_version
