const Job = require('../api/jobs/model')
const Block = require('../private/blocks/model')
const Chain = require('../private/chain/model')
const Account = require('../private/account/model')
const JobLogs = require('../private/joblogs/model')

class Loader {
  constructor() {
    this.loaded = false
  }

  loadModels(mongoose) {
    if (this.loaded) { return }
    this.loaded = true

    const models = {
      'Job', Job,
      'Block', Block,
      'Chain', Chain,
      'Accounts', Account,
      'JobLogs', JobLogs
    }

    Object.keys(models).forEach((key) => {
      mongoose.model(key, models[key])
    })
  }
}

module.exports = Loader()
