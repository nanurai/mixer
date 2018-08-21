const Koa = require('koa')
const app = new Koa()
const database = require('../database')
const router = require('../routing')
const http = require('http')
const socket = require('../socket')
const bodyparser = require('koa-bodyparser')
const errorMiddleware = require('../middleware/error')
const handlers = require('../socket/handlers')
const bootstrap = require('../bootstrap')
const chain = require('../private/chain/controller')

app.proxy = true
app.use(require('koa-response-time')())
app.use(require('koa-morgan')('combined', {
  skip: function(req, res) {
    return res.statusCode < 400
  }
}))
app.use(bodyparser())
app.use(errorMiddleware)
app.use(router.routes())
app.use(ctx => { ctx.type = 'json' })

module.exports = {
  start: async function() {
    try {
      await database.connect()
      await bootstrap.run()

      await socket.listen(4000)
      console.log('socket listening on port 4000')

      this.server = await app.listen(3000)
      console.log('server listening on port 3000')

      socket.io.on('connection', socket => {
        handlers.onConnection(socket)
      })
    } catch (error) {
      console.log(error)
    }
  },
  stop: async function() {
    await this.server.close()
    await database.close()
    await socket.close()
  }
}
