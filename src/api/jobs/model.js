const mongoose = require('mongoose')
const Schema = mongoose.Schema

const JobSchema = new Schema({
  input: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

const Mix = mongoose.model('Job', JobSchema)

module.exports = Mix

