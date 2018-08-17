const sinon = require('sinon')
const Job = require('./model')
const Nano = require('../../nano')
const nanocurrency = require('nanocurrency')
const randtoken = require('rand-token')
const Account = require('../../private/accounts/controller')
const controller = require('./controller')

describe('the jobs controller', function() {
  describe('creating a new job', function() {

    const output = 'my-output-address'

    before(function() {
      this.checkAddress = sinon.stub(nanocurrency, 'checkAddress')
      this.generate = sinon.stub(randtoken, 'generate')
      this.createNewAccount = sinon.stub(Account, 'createNewAccount')
      this.create = sinon.stub(Job, 'create')

      this.generate.returns('generated-token')
      this.createNewAccount.resolves({
        address: 'generated-address'
      })
      this.create.resolves({
        _id: 'job-id'
      })
    })

    after(function() {
      this.checkAddress.restore()
      this.generate.restore()
      this.createNewAccount.restore()
      this.create.restore()
    })

    beforeEach(async function() {
      try {
        this.result = await controller.create({ output })
      } catch (error) {
        this.error = error
      }
    })

    afterEach(function() {
      this.checkAddress.resetHistory()
    })

    it('should call check address', function() {
      this.checkAddress.should.be.calledWith(output)
    })

    describe('with an incorrect address', function() {
      before(function() {
        this.checkAddress.returns(false)
      })

      it('should throw an error', function() {
        this.error.should.exist
      })

      describe('the error', function() {
        it('should have the correct status', function() {
          this.error.status.should.equal(400)
        })

        it('should have the correct message', function() {
          this.error.message.should.eql('Incorrect nano address')
        })
      })
    })

    describe('with a correct address', function() {
      before(function() {
        this.checkAddress.returns(true)
      })

      it('should generate a token', function() {
        this.generate.should.be.calledWith(32)
      })

      it('should create a new account', function() {
        this.createNewAccount.should.be.called
      })

      it('should create the job', function() {
        this.create.should.be.calledWith({
          input: 'generated-address',
          output: output,
          token: 'generated-token'
        })
      })

      it('should produce the correct result', function() {
        this.result.should.eql({
          _id: 'job-id'
        })
      })
    })
  })
})
