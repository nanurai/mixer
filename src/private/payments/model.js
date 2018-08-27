const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PaymentSchema = new Schema({
  account: {
    type: String,
    required: true,
    index: true
  },
  block: {
    type: String,
    required: true,
    index: true
  },
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  amount: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

const Payment = mongoose.model('Payment', PaymentSchema)

module.exports = Payment
