const sinon = require('sinon')
const controller = require('./controller')
const Account = require('./model')
const config = require('../../configuration')
const nanocurrency = require('nanocurrency')

describe('the account controller', function() {
  describe('creating a new account', function() {
    before(function() {
      this.count = sinon.stub(Account, 'countDocuments')
      this.config = sinon.stub(config, 'get')
      this.deriveSecretKey = sinon.stub(nanocurrency, 'deriveSecretKey')
      this.derivePublicKey = sinon.stub(nanocurrency, 'derivePublicKey')
      this.deriveAddress = sinon.stub(nanocurrency, 'deriveAddress')
      this.create = sinon.stub(Account, 'create')
      this.count.resolves(12)
      this.config.returns('secret-seed')
      this.deriveSecretKey.returns('secret-key')
      this.derivePublicKey.returns('public-key')
      this.deriveAddress.returns('derived-address')
      this.create.resolves({
        index: 12,
        address: 'created-address'
      })
    })

    beforeEach(async function() {
      this.result = await controller.createNewAccount()
    })

    after(function() {
      this.count.restore()
      this.config.restore()
      this.deriveSecretKey.restore()
      this.derivePublicKey.restore()
      this.deriveAddress.restore()
      this.create.restore()
    })

    it('should get the document count', function() {
      this.count.should.be.called
    })

    it('should get the seed from the config', function() {
      this.config.should.be.calledWith('SEED')
    })

    it('should derive the secret key from the seed', function() {
      this.deriveSecretKey.should.be.calledWith('secret-seed', 12)
    })

    it('should derive the public key', function() {
      this.derivePublicKey.should.be.calledWith('secret-key')
    })

    it('should derive the address', function() {
      this.deriveAddress.should.be.calledWith('public-key')
    })

    it('should create an account with the correct details', function() {
      this.create.should.be.calledWith({
        index: 12,
        address: 'derived-address'
      })
    })

    it('should return the generated address from the account', function() {
      this.result.should.eql({
        index: 12,
        address: 'created-address'
      })
    })
  })
})
