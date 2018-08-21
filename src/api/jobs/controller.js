const Job = require('./model')
const Nano = require('../../nano')
const nanocurrency = require('nanocurrency')
const randtoken = require('rand-token')
const Account = require('../../private/accounts/controller')
const { io } = require('../../socket')
const BigNumber = require('bignumber.js')
const blake = require('blakejs')
const util = require('../../utils')
const config = require('../../configuration')
const nacl = require('../../vendor/nacl')
const Block = require('../../private/blocks/model')
const Chains = require('../../private/chain/controller')
const Payments = require('../../private/payments/model')

const repAccount = config.get('REP')

exports.create = async function({ output }) {
  if (!nanocurrency.checkAddress(output)) {
    const error = new Error('Incorrect nano address')
    error.status = 400
    throw error
  }

  const token = randtoken.generate(32)
  const account = await Account.createNewAccount()
  const input = account.address

  return Job.create({
    input,
    output,
    token
  })
}

exports.get = async function(id) {
  return Job.findById(id)
}

exports.findOne = async function(data) {
  return Job.findOne(data)
}

const filterBlocks = async function(pending, account) {
  const blocks = await Promise.all(pending.map(async (p) => {
    const block = await Nano.getBlock(p)
    return { block, hash: p }
  }))

  return blocks.filter(({ block, hash }) => {
    return block.link_as_account == account
  }).map(({ block, hash }) => {
    return hash
  })
}

exports.sendNextPendingBlock = async function(id) {
  const job = await Job.findById(id)
  if (!job) { return null }

  const chain = await Chains.findOne({ job, completed: false })
  if (chain) {
    Chains.createWork({ chain })
    return
  }

  const p = await Nano.getPending(job.input).then(r => r.blocks || [])
  const pending = await filterBlocks(p, job.input)

  if (pending.length > 0) {
    const next = pending[0]
    const newBlock = await this.generateReceive(job.input, next, job)
    const toAccount = await Nano.getAccountInfo(job.input)
    const openEquiv = !toAccount || !toAccount.frontier;

    const acc = await Account.findOne({ address: job.input })
    const index = acc.index
    const seed = config.get('SEED')
    const secret = nanocurrency.deriveSecretKey(seed, index)
    const public = nanocurrency.derivePublicKey(secret)
    const hash = openEquiv ? public : newBlock.block.previous

    io.to(job._id).emit('work', { block: newBlock.hash, hash })
    return next
  }

  return null
}

exports.generateReceive = async function(account, hash, job) {
  const sourceBlock = hash
  const toAccount = await Nano.getAccountInfo(account)
  const openEquiv = !toAccount || !toAccount.frontier;

  const previousBlock = toAccount.frontier || "0000000000000000000000000000000000000000000000000000000000000000";
  const representative = toAccount.representative || repAccount;

  const srcBlockInfo = await Nano.getBlocksInfo([hash])
  const srcAmount = new BigNumber(srcBlockInfo.blocks[hash].amount);
  const newBalance = openEquiv ? srcAmount : new BigNumber(toAccount.balance).plus(srcAmount);
  const newBalanceDecimal = newBalance.toString(10);
  let newBalancePadded = newBalance.toString(16);
  while (newBalancePadded.length < 32) newBalancePadded = '0' + newBalancePadded; // Left pad with 0's

  const acc = await Account.findOne({ address: account })
  const index = acc.index
  const seed = config.get('SEED')
  const secret = nanocurrency.deriveSecretKey(seed, index)

  const data = nanocurrency.createBlock(secret, {
    account: account,
    balance: newBalanceDecimal,
    link: sourceBlock,
    previous: previousBlock,
    representative: repAccount,
    work: null
  })

  const b = await Block.findOne({ hash: data.hash })

  if (!b) {
    const block = await Block.create(data)
    Payments.create({
      account: account,
      block: block.hash,
      amount: srcAmount.toString(10),
      job: job
    }).then((payment) => {
      Chains.createChain({
        payment: payment
      })
    })
    return block
  } else {
    return b
  }
}

exports.sendOutstandingChains = async function(id) {
  const job = await Job.findById(id)
  const chains = await Chains.find({ job })

  await Promise.all(chains.map(async (chain) => {
    await Chains.createBlocks({ chain })
    await Chains.createWork({ chain })
  }))

  const chainedBlocks = chains.reduce((obj, chain) => {
    obj[chain.block] = chain
    return obj
  }, {})

  const payments = await Payments.find({ job })
  const unchained = payments.filter((payment) => {
    return !(chainedBlocks[payment.block])
  })

  await Promise.all(unchained.map((payment) => {
    return Chains.createChain({ payment })
  }))
}
