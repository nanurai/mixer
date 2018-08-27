const Jobs = require('../../api/jobs/model')
const Chain = require('./model')
const Mix = require('../mix/model')
const Accounts = require('../accounts/controller')
const Nano = require('../../nano')
const BigNumber = require('bignumber.js')
const Payments = require('../payments/model')
const Block = require('../blocks/model')
const nanocurrency = require('nanocurrency')
const config = require('../../configuration')
const util = require('../../utils')
const { io } = require('../../socket')

exports.randomSplit = function({
  amount, parts
}) {
  let random = []

  for (let i = 0; i < parts; i++) {
    random.push(Math.random(i) * 1e6)
  }

  const total = random.reduce((t, r) => t + r, 0)
  const proportions = random.map((r) => {
    return r / total 
  })

  const amounts = proportions.map((prop) => {
    return new BigNumber(Math.floor(amount.times(prop)))
  })

  const totals = amounts.reduce((x, y) => y.plus(x), 0)
  const diff = amount.minus(totals)
  const last = new BigNumber(amounts[amounts.length - 1])

  const fixed = new BigNumber(last.plus(amount.minus(totals)))
  amounts[amounts.length - 1] = fixed 

  return amounts
}

exports.createLayer = async function({
  previous, job, amount, until, chain, depth, layer
}) {

  const layerNumber = Math.floor((Math.random() * 2) + 1)
  
  const total = until <= 0 ? layerNumber + 1 : layerNumber;

  const amounts = this.randomSplit({ amount, parts: total })

  for (let i = 0; i < layerNumber; i++) {
    const part = amounts[i]
    const account = depth <= 0 ? 
      job.output : await Accounts.createNewAccount().then((a) => a.address)

    const mix = await Mix.create({
      previous: previous,
      account: account,
      chain: chain,
      amount: part,
      layer: layer
    })

    if (depth > 0) {
      await this.createLayer({
        previous: account,
        job: job,
        amount: new BigNumber(part),
        until: until - 1,
        chain: chain,
        depth: depth - 1,
        layer: layer + 1
      })
    }
  }

  if (total > layerNumber) {
    const part = amounts[amounts.length - 1]
    const account = job.output
    await Mix.create({
      previous: previous,
      account: account,
      chain: chain,
      amount: part,
      layer: layer
    })
  }
}

exports.createChain = async function({ payment }) {
  const block = await Block.findOne({ hash: payment.block })
  const job = await Jobs.findById(payment.job)
  const amount = payment.amount
  
  const chain = await Chain.create({
    job: job,
    amount: amount,
    fee: 0,
    block: block.hash,
    payment: payment,
    completed: false
  })

  const until = Math.floor((Math.random() * 2) + 2)
  const depth = Math.floor((Math.random() * 3) + 2) + until
  await this.createLayer({
    previous: job.input,
    job: job,
    amount: new BigNumber(amount),
    solved: 0,
    until: until,
    depth: depth,
    chain: chain,
    layer: 0
  })

  await this.createBlocks({ chain })
}

exports.findOrSaveBlock = async function(data) {
  const b = await Block.findOne({ hash: data.hash })
  if (b) {
    return b
  } else {
    return Block.create(data)
  }
}

exports.createSendBlock = async function({ mix, previousBlock }) {
  const block = await Block.findOne({ hash: previousBlock })
  const remaining = new BigNumber(block.block.balance).minus(mix.amount)
  const remainingDecimal = remaining.toString(10)
  const representative = block.representative || config.get('REP')
  const acc = await Accounts.findOne({ address: mix.previous })
  const index = acc.index
  const seed = config.get('SEED')
  const secret = nanocurrency.deriveSecretKey(seed, index)
  const link = util.getAccountPublicKey(mix.account)

  const data = nanocurrency.createBlock(secret, {
    account: mix.previous,
    balance: remainingDecimal,
    link: link,
    previous: previousBlock,
    representative: representative,
    work: null
  })

  const newBlock = await this.findOrSaveBlock(data)

  await Mix.findOneAndUpdate(
    { _id: mix._id }, { send: newBlock.hash }, { runValidators: true }
  )

  return data.hash
}

exports.createReceiveBlock = async function({ mix, sourceBlock, job }) {
  const previousBlock = "0000000000000000000000000000000000000000000000000000000000000000";
  const representative = config.get('REP');
  const srcAmount = new BigNumber(mix.amount)
  const newBalance = srcAmount 
  const newBalanceDecimal = newBalance.toString(10);
  let newBalancePadded = newBalance.toString(16);
  while (newBalancePadded.length < 32) newBalancePadded = '0' + newBalancePadded; // Left pad with 0's

  const acc = await Accounts.findOne({ address: mix.account })
  const index = acc.index
  const seed = config.get('SEED')
  const secret = nanocurrency.deriveSecretKey(seed, index)

  const data = nanocurrency.createBlock(secret, {
    account: mix.account,
    balance: newBalanceDecimal,
    link: sourceBlock,
    previous: previousBlock,
    representative: representative,
    work: null
  })

  console.log(data)
  const newBlock = await this.findOrSaveBlock(data)
  await Mix.findOneAndUpdate(
    { _id: mix._id }, { receive: newBlock.hash }, { runValidators: true }
  )

  this.createLayerBlocks({ account: mix.account, block: data.hash, job })
}

exports.createLayerBlocks = async function({ account, block, job }) {
  var previous = block
  const layer = await Mix.find({ previous: account })
  for (let i = 0; i < layer.length; i++) {
    const mix = layer[i]
    const block = await this.createSendBlock({
      mix, previousBlock: previous
    })
    previous = block

    if (mix.account !== job.output) {
      await this.createReceiveBlock({
        mix, sourceBlock: previous , job
      })
    }
  }
}

exports.createBlocks = async function({ chain }) {
  const count = await Mix.countDocuments({ chain, send: null })
  if (count > 0) {
    const block = chain.block
    const job = await Jobs.findById(chain.job)
    const account = job.input
    await this.createLayerBlocks({ account, block, job })
  }
}

exports.createWork = async function({ chain }) {
  const job = await Jobs.findById(chain.job)
  const unsent = await Mix.find({ chain, sent: false }).sort('layer')
  const unrecd = await Mix.find({
    chain, received: false, receive: { $exists: true } 
  }).sort('layer')

  if (unsent.length === 0 && unrecd.length > 0) {
    const hash = unrecd[0].received
    const account = unreced[0].account
    const publicKey = util.getAccountPublicKey(account)
    io.to(job._id).emit('work', { block: hash, hash: publicKey })
  } else if (unsent.length === 0 && unrecd.length === 0) {
    // Work is done, set the chain to completed.
    await Chain.findOneAndUpdate({ _id: chain._id }, { completed: true })
  } else {
    const firstRec = unrecd[0]
    const firstSent = unsent[0]

    if (firstRec && firstRec.layer < firstSent.layer) {
      const hash = firstRec.receive
      const account = firstRec.account
      const publicKey = util.getAccountPublicKey(account)
      io.to(job._id).emit('work', { block: hash, hash: publicKey })
    } else {
      const hash = firstSent.send
      const block = await Block.findOne({ hash })
      const previous = block.block.previous
      io.to(job._id).emit('work', { block: hash, hash: previous })
    }
  }
}

exports.find = function(query) {
  return Chain.find(query)
}

exports.findById = function(query) {
  return Chain.findById(query)
}

exports.getWorkCount = async function(chain) {
  const totalSend = await Mix.countDocuments({ chain })
  const totalReceive = await Mix.countDocuments({ chain, receive: { $exists: true } })

  const total = totalSend + totalReceive

  const sent = await Mix.countDocuments({ chain, sent: true })
  const received = await Mix.countDocuments({ chain, received: true })
  const completed = sent + received

  return {
    total: total,
    completed 
  }
}
