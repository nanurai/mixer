const jayson = require('jayson/promise')
const request = require('request-promise-native')

class RPC {
  constructor({ port }) {
    this.port = port
    this.url = '[::1]'
    this.client = jayson.client.http(`http://[::1]:${port}`)
    this.url = `http://${this.url}:${this.port}`
  }

  async request(data) {
    return request({
      uri: this.url,
      method: 'POST',
      json: true,
      body: data
    })
  }
}

module.exports = RPC
