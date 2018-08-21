const mongoose = require('mongoose')
const Schema = mongoose.Schema

const JobSchema = new Schema({
  input: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  output: {
    type: String,
    required: true,
    trim: true
  },
  token: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

const Job = mongoose.model('Job', JobSchema)

module.exports = Job
