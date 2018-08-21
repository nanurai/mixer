const controller = require('./controller')

exports.create = async function(ctx) {
  const job = await controller.create(ctx.request.body)
  ctx.body = job
}

exports.get = async function(ctx) {
  const id = ctx.params.id
  const job = await controller.get(id)
  if (!job) { throw new Error('No Jobbins') }
  ctx.body = job
}

exports.routes = function(router) {

  router.get('/:id', this.get);
  router.post('/', this.create)

  return router
}
