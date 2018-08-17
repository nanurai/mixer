const Router = require('koa-router')
const router = Router()
const jobs = require('../api/jobs/routes')

const routes = {
  '/jobs': jobs,
}

module.exports = Object.keys(routes).reduce((router, key) => {
  const route = routes[key]
  const r = route.routes(Router())
  router.use(key, r.routes())
  return router
}, router)

module.exports = router
