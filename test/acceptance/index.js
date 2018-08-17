const App = require('app')
const mongoose = require('mongoose')

before(async function() {
  this.timeout(5000)
  process.env.MONGO_URL = 'mongodb://127.0.0.1:27017/apptest'
  await App.start()
})

after(async function() {
  this.timeout(5000)
  await mongoose.connection.db.dropDatabase()
  await App.stop()
})
