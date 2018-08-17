const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AccountSchema = new Schema({
  address: {
    type: String,
    required: true,
    index: {
      unique: true
    },
    trim: true
  },
  index: {
    type: Number,
    required: true
  }
})

const Account = mongoose.model('Account', AccountSchema)

module.exports = Account
