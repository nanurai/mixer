const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ChainSchema = new Schema({
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  fee: {
    type: String,
    required: true
  },
  block: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  payment: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  completed: {
    type: Boolean,
    required: true
  }
})

const Chain = mongoose.model('Chain', ChainSchema)

module.exports = Chain
