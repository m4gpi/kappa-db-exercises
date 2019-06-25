var Discovery = require('discovery-swarm')
var hypercore = require('hypercore')
var multifeed = require('multifeed')
var pump = require('pump')

var APP_NAME = `./multi-chat-${process.argv[2]}`
var DISCOVERY_KEY = 'multi-chat'
var multi = multifeed(hypercore, APP_NAME, { valueEncoding: 'json' })
var swarm = Discovery()

multi.ready(function () {
  swarm.join(DISCOVERY_KEY)
  swarm.on('connection', function (connection, info) {
    console.log(info)
    pump(connection, multi.replicate({ live: true }), connection)
  })
})

multi.writer('local', function (err, feed) {
  feed.createReadStream({ live: true }).on('data', console.log)

  prompt('Whats your name?\n', process.exit)

  function prompt(question, callback) {
    var stdin = process.stdin,
      stdout = process.stdout

    stdin.resume()
    stdout.write(question)

    stdin.on('data', function (data) {
      feed.append({
        type: 'chat-message',
        nickname: 'cat-lover',
        text: data.toString().trim(),
        timestamp: new Date().toISOString()
      })
    })
  }
})

multi.ready(() => {
  multi.feeds().forEach((feed) => {
    feed.createReadStream({ live: true }).on('data', console.log)
  })
})
