const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BlockSchema = new Schema({
  hash: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  block: {
    type: {
      type: String,
      enum: ['state'],
      required: true
    },
    account: {
      type: String,
      required: true
    },
    previous: {
      type: String,
      required: true
    },
    representative: {
      type: String,
      required: true
    },
    balance: {
      type: String,
      required: true
    },
    link: {
      type: String,
      required: true
    },
    link_as_account: {
      type: String,
      required: true
    },
    signature: {
      type: String,
      required: true
    },
    work: {
      type: String
    }
  }
})

const Block = mongoose.model('Block', BlockSchema)

module.exports = Block
