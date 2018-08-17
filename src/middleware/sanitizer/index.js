
exports.sanitize = function(data, fields) {
  const keys = Object.keys(fields)
  for (key of keys) {
    const rules = fields[key]
    const value = data[key]

    if (!value) { continue }

    for (rule of rules) {
      switch (rule) {
        case 'lowercase': {
          data[key] = value.toLowerCase()
          break
        }
        case 'trim': {
          data[key] = value.trim()
          break;
        }
        case 'capitalized': {
          data[key] = value.replace(/(^|\s)[a-z]/g, function(f) {
            return f.toUpperCase()
          })
          break
        }
        case 'date': {
          data[key] = new Date(value)
          break
        }
        default: break
      }
    }
  }
  return data
}

exports.body = function(rules) {
  return async (ctx, next) => {
    const result = this.sanitize(ctx.request.body, rules)
    ctx.request.body = this.sanitize(ctx.request.body, rules)
    await next()
  }
}

exports.email = this.body({
  email: ['lowercase', 'trim']
})
