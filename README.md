# Telos EVM RPC plugin for Hyperion API

Install plugin (hpm - hyperion plugin manager)

Hyperion History v3.3.5+ required
```bash
# install from this repository
./hpm install -r https://github.com/eosrio/hyperion-telos-evm-plugin telos-evm
# enable the plugin globally
./hpm enable explorer
```

Required Config on chain.config.json

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
      }
    }
  }
}
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
