const sanitizer = require('./index')
const { expect } = require('chai')
const sinon = require('sinon')

describe('the sanitizer', function() {
  context('sanitizing the body', function() {
    const ctx = { request: { body: { 'some': 'data' } } }
    const rules = { 'some': 'rules' }
    const result = { 'some': 'sanitized-data' }

    before(function() {
      this.sanitizeStub = sinon.stub(sanitizer, 'sanitize')
      this.sanitizeStub.returns(result)
    })

    after(function() {
      this.sanitizeStub.restore()
    })

    beforeEach(async function() {
      const handler = sanitizer.body(rules)
      await handler(ctx, () => {})
    })

    it('should call sanitize', function() {
      this.sanitizeStub.should.be.calledWith({ some: 'data' }, rules)
    })

    it('should set the ctx body', function() {
      ctx.request.body.should.equal(result)
    })
  })

  context('calling sanitize', function() {
    const rules = {
      trimmed: ['trim'],
      lowercased: ['lowercase'],
      name: ['capitalized'],
      date: ['date'],
      something: '',
      exists: ['blah']
    }

    const date = new Date('2017-10-25T23:42:48.238Z')

    const data = {
      trimmed: '   hi      ',
      lowercased: 'I-am-NoT-LoWeRcAsEd',
      nothing: 'Nothing ',
      name: 'jim morrison',
      date: '2017-10-25T23:42:48.238Z',
      exists: 'no'
    }

    beforeEach(function() {
      this.result = sanitizer.sanitize(data, rules)
    })

    it('should produce the correct trimmed', function() {
      this.result.trimmed.should.equal('hi')
    })

    it('should lowercase when needed', function() {
      this.result.lowercased.should.equal('i-am-not-lowercased')
    })

    it('should capitlize the name', function() {
      this.result.name.should.equal('Jim Morrison')
    })

    it('should ignore a field with no rules', function() {
      this.result.nothing.should.equal('Nothing ')
    })

    it('should set a date', function() {
      this.result.date.should.be.a('Date')
      this.result.date.should.eql(date)
    })
  })
})
