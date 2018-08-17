const http = require('http')
var socket = require('socket.io')

class SocketServer {
  constructor() {
    this.server = http.createServer((req, res) => {
      res.writeHead(200)
      res.end()
    })
    this.io = socket(this.server)
  }

  async listen(port) {
    await this.server.listen(port)
  }

  async close() {
    await this.server.close()
  }
}

module.exports = SocketServer
