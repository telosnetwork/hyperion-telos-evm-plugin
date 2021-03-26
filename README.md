# hyperion-telos-evm-plugin

Installation on working Hyperion Indexer/Api

```bash
npm run plugin-manager install telos-evm
```

Required Config on chain.config.json
```json
"plugins": {
  "telos-evm": {
      "enabled": true,
      "chainId": 41,
      "contracts": {
        "main": "eosio.evm"
      }
  }
}
```
