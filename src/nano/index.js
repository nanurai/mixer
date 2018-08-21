const RPC = require('./rpc')
const config = require('../configuration')

class Nano {
  constructor() {
    const isTestnet = config.get('NETWORK_TYPE') === 'TESTNET'
    const port = isTestnet ? 55000 : 7076
    this.client = new RPC({ port })
  }

  async getAccountBalance(address) {
    return this.client.request({
      action: "account_balance",
      account: address
    })
  }

  async getBlock(hash) {
    return this.client.request({
      action: "block",
      hash: hash
    }).then(r => JSON.parse(r.contents))
  }

  async getPending(account) {
    return this.client.request({
      action: 'pending',
      account: account,
      count: 100
    })
  }

  async getAccountInfo(account) {
    return this.client.request({
      action: 'account_info',
      account,
      pending: true,
      representative: true
    })
  }

  async getBlocksInfo(blocks) {
    return this.client.request({
      action: 'blocks_info',
      hashes: blocks,
      pending: true,
      source: true
    })
  }

  async process(block) {
    console.log(JSON.stringify(block))
    return this.client.request({
      action: 'process',
      block: JSON.stringify(block)
    })
  }
}

module.exports = new Nano()
