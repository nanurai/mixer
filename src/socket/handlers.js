const { io } = require('./index')
const Jobs = require('../api/jobs/controller')
const Nano = require('../api/nano/controller')

exports.onConnection = async function(socket) {
  socket.on('subscribe#job', async (id) => {
    socket.join(id)
    Jobs.sendNextPendingBlock(id)
    Jobs.sendOutstandingChains(id)
  })

  socket.on('work#completed', async ({ blockHash, work }) => {
    console.log(blockHash)
    Nano.onWorkCompleted({ work, blockHash })
  })
}
