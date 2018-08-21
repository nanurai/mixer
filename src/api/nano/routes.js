const controller = require('./controller')

exports.onBlock = async function(ctx) {
  controller.onBlock(ctx.request.body)
  ctx.status = 200
}

exports.routes = function(router) {

  router.post('/', this.onBlock)

  return router
}

