const mongoose = require('mongoose')
const Schema = mongoose.Schema

const JobLogSchema = new Schema({
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['debit', 'credit', 'move', 'update'],
    required: true
  }
}, {
  timestamps: true
})

const JobLog = mongoose.model('JobLog', JobLogSchema)

module.exports = JobLog
