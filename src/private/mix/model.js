const mongoose = require('mongoose')
const Schema = mongoose.Schema

const MixSchema = new Schema({
  chain: {
    type: Schema.Types.ObjectId,
    ref: 'Chain',
    required: true,
    index: true
  },
  account: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: String,
    required: true
  },
  previous: {
    type: String,
    required: true
  },
  send: {
    type: String
  },
  receive: {
    type: String
  },
  sent: {
    type: Boolean,
    default: false
  },
  received: {
    type: Boolean,
    default: false
  },
  layer: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
})

const Mix = mongoose.model('Mix', MixSchema)

module.exports = Mix
