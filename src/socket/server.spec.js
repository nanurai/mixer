const rewire = require('rewire')
const SocketServer = rewire('./server')
const http = require('http')
const socket = require('socket.io')
const sinon = require('sinon')

describe('a new socket server', function() {
  const io = { _id: 'io-objecct' }
  before(function() {
    this.listen = sinon.stub().resolves()
    this.close = sinon.stub().resolves()
    this.http = {
      listen: this.listen,
      close: this.close
    }
    this.create = sinon.stub(http, 'createServer').returns(this.http)
    this.socket = sinon.stub().returns(io)
    this.socketRewire = SocketServer.__set__('socket', this.socket)
  })

  after(function() {
    this.create.restore()
    this.socketRewire()
  })

  beforeEach(function() {
    this.server = new SocketServer()
  })

  it('should create a server', function() {
    this.create.should.be.called
  })

  it('should call io with the server', function() {
    this.socket.should.be.calledWith(this.http)
  })

  it('should set io', function() {
    this.server.io.should.equal(io)
  })

  describe('the server callback', function() {
    before(function() {
      this.writeHead = sinon.stub()
      this.end = sinon.stub()
      this.res = {
        writeHead: this.writeHead,
        end: this.end
      }
      this.create.yields({}, this.res)
    })

    it('should write the head', function() {
      this.writeHead.should.be.calledWith(200)
    })

    it('should respond', function() {
      this.end.should.be.called
    })
  })

  describe('calling listen', function() {
    beforeEach(async function() {
      await this.server.listen(3000)
    })

    it('should listen on the server', function() {
      this.http.listen.should.be.calledWith(3000)
    })
  })

  describe('calling close', function() {
    beforeEach(async function() {
      await this.server.close()
    })

    it('should call close on the http server', function() {
      this.http.close.should.be.called
    })
  })
})
