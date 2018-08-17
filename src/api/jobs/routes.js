const controller = require('./controller')

exports.create = async function(ctx) {
  const account = await controller.create(ctx.request.body)
  ctx.body = account
}

exports.routes = function(router) {

  router.post('/', this.create)

  return router
}
