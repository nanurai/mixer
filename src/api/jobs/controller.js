const Job = require('./model')
const Nano = require('../../nano')
const nanocurrency = require('nanocurrency')
const randtoken = require('rand-token')
const Account = require('../../private/accounts/controller')

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
