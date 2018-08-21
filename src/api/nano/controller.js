const Accounts = require('../../private/accounts/model')
const JobLogs = require('../../private/joblogs/model')
const Blocks = require('../../private/blocks/model')
const Jobs = require('../jobs/controller')
const nano = require('../../nano')
const nanocurrency = require('nanocurrency')
const { io } = require('../../socket')
const Mix = require('../../private/mix/model')
const Chain = require('../../private/chain/controller')

exports.onBlock = async function(data) {
  
  const block = await nano.getBlock(data.hash)
  const address = block.link_as_account
  const account = await Accounts.findOne({ address })

  if (!account) { return }

  const job = await Jobs.findOne({ input: address })

  if (job) {
    const balance = await nano.getAccountBalance(address)
    if (balance.pending !== '0') {
      Jobs.sendNextPendingBlock(job._id)
    }
  } else {
  }
}

exports.checkMix = async function({ blockHash }) {
  const mix = await Mix.findOne({ '$or': [{ send: blockHash }, { receive: blockHash }]})
  
  if (!mix) { return false }
  console.log('mixy')
  const update = {}

  if (mix.send === blockHash) {
    update['sent'] = true
  } else if (mix.receive === blockHash) {
    update['received'] = true
  }

  await Mix.findOneAndUpdate(
    { _id: mix._id }, update, { runValidators: true }
  )

  const chain = await Chain.findById(mix.chain)
  Chain.createWork({ chain })

  return true
}

exports.onWorkCompleted = async function({ blockHash, work }) {
  console.log('work')
  const block = await Blocks.findOneAndUpdate({
    hash: blockHash 
  }, {
    'block.work': work
  }, {
    new: true,
    runValidators: true
  })

  const contents = block.toObject().block
  const result = await nano.process(contents)

  if (result.error) {
    console.log(result)
    console.log(contents)
    if (result.error === 'Old block') {
      if (await this.checkMix({ blockHash })) {
      }
      return
    }
    /*
    await Blocks.remove({
      _id: blockHash
    })

    await Payments.remove({
      block: blockHash
    })
    */
  }
  const link = contents.account
  const account = await Accounts.findOne({ address: link })
  if (!account) { return }

  const job = await Jobs.findOne({ input: link })

  if (await this.checkMix({ blockHash })) {
  } else if (job) {
    console.log('hey cher')
    Jobs.sendNextPendingBlock(job._id)
  }
}
