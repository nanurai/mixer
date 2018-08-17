const Account = require('./model')
const nanocurrency = require('nanocurrency')
const config = require('../../configuration')

exports.createNewAccount = async function() {
  const count = await Account.countDocuments()
  const seed = config.get('SEED')
  const secretKey = nanocurrency.deriveSecretKey(seed, count);
  const publicKey = nanocurrency.derivePublicKey(secretKey);
  const address = nanocurrency.deriveAddress(publicKey);

  const account = await Account.create({
    index: count,
    address: address
  })

  return account
}
